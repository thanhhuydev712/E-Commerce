"""State-machine tests. Refuses to install mocks or write /opt outside Docker."""
import hashlib
import io
import json
import os
import pathlib
import shutil
import stat
import subprocess
import tarfile

if (os.environ.get('RIGFORCE_TEST_CONTAINER') != '1'
        or not pathlib.Path('/.dockerenv').is_file()
        or pathlib.Path('/var/run/docker.sock').exists()
        or os.geteuid() != 0
        or pathlib.Path('/opt/rigforce').exists()):
    raise SystemExit('Use a fresh isolated fixture container with no Docker socket or host /opt mount.')

repository = pathlib.Path(__file__).resolve().parents[3]
state = pathlib.Path('/tmp/rigforce-mocks')
(state / 'archives').mkdir(parents=True)
base = pathlib.Path('/opt/rigforce')
shared = base / 'shared'
(base / 'bin').mkdir(parents=True)
shared.mkdir()
for name in ['apply-release.sh', 'fetch-env.sh']:
    shutil.copyfile(repository / 'infra/deploy' / name, base / 'bin' / name)
    os.chmod(base / 'bin' / name, 0o750)
for name in ['aws', 'docker', 'curl', 'openssl']:
    shutil.copyfile(pathlib.Path(__file__).with_name('mock_cli.py'), '/usr/local/bin/' + name)
    os.chmod('/usr/local/bin/' + name, 0o755)
(shared / 'host.env').write_text(
    'AWS_REGION=ap-southeast-1\nPROJECT_NAME=rigforce\nENVIRONMENT=staging\n'
    'DOMAIN_NAME=staging.example.com\nRELEASE_BUCKET=rigforce-fixture-bucket\n'
    'RUNTIME_PARAMETER_NAME=/rigforce/staging/runtime-env\n'
    'MIGRATION_PARAMETER_NAME=/rigforce/staging/migration-env\n'
    'LOG_GROUP_PREFIX=/rigforce/staging\n')
os.chmod(shared / 'host.env', 0o600)
certificate = shared / 'letsencrypt/live/staging.example.com'
certificate.mkdir(parents=True)
(certificate / 'fullchain.pem').write_text('public fixture')
(certificate / 'privkey.pem').write_text('private fixture')
metadata, bundles = {}, {}
registry = '111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/'


def bundle(letter, fingerprint_character, policy='backward-compatible', dirty=False, extra=False):
    commit, fingerprint = letter * 40, fingerprint_character * 64
    images = {}
    for label in ['api', 'front', 'tools']:
        digest = hashlib.sha256((letter + label).encode()).hexdigest()
        suffix = 'front' if label == 'front' else 'api'
        images[label] = registry + 'rigforce/staging/' + suffix + '@sha256:' + digest
        metadata[images[label]] = [commit, fingerprint]
    manifest = {'schemaVersion': 1, 'commit': commit, 'images': images,
                'schemaFingerprint': fingerprint, 'migrationPolicy': policy, 'sourceDirty': dirty}
    archive = state / 'archives' / (commit + '.tar.gz')
    with tarfile.open(archive, 'w:gz') as output:
        for name, value in {'manifest.json': json.dumps(manifest),
                            'compose.deploy.yaml': 'services: {}',
                            'compose.aws.yaml': 'services: {}',
                            'infra/nginx/production.conf.template': 'server {}'}.items():
            data = value.encode()
            item = tarfile.TarInfo(name)
            item.size = len(data)
            output.addfile(item, io.BytesIO(data))
        if extra:
            item = tarfile.TarInfo('../unsafe')
            item.size = 1
            output.addfile(item, io.BytesIO(b'x'))
    bundles[letter] = (commit, hashlib.sha256(archive.read_bytes()).hexdigest())
    (state / 'images.json').write_text(json.dumps(metadata))
    return commit


A = bundle('a', '1')
B = bundle('b', '2')
bundle('c', '1', 'none')
D = bundle('d', '2', 'none')
bundle('e', '3', 'maintenance-required')
F = bundle('f', '3')
bundle('1', '2', 'none')
H = bundle('2', '3')
bundle('3', '2', 'none', True)
bundle('4', '2', 'none', False, True)
checks = 0


def run(letter, expected=True, prepare=False, environment=None):
    global checks
    commit, checksum = bundles[letter]
    command = ['bash', str(base / 'bin/apply-release.sh')]
    if prepare:
        command += ['--prepare']
    command += ['releases/staging/' + commit + '/release.tar.gz', '3/version+example=', checksum]
    result = subprocess.run(command, text=True, capture_output=True,
                            env={**os.environ, **(environment or {})})
    assert (result.returncode == 0) == expected, (letter, result.returncode, result.stdout, result.stderr)
    assert 'postgresql://' not in result.stdout + result.stderr
    assert 'private-fixture-token' not in result.stdout + result.stderr
    checks += 1


def calls():
    return [json.loads(line) for line in (state / 'calls.jsonl').read_text().splitlines()]


def migrations():
    return [call for call in calls() if call[0] == 'docker' and call[-1] == 'run']


run('a', prepare=True)
assert not (base / 'current').exists() and not migrations()
assert not (shared / 'schema-state.json').exists()
assert stat.S_IMODE((shared / 'runtime.env').stat().st_mode) == 0o600
assert stat.S_IMODE((shared / 'migration.env').stat().st_mode) == 0o600
run('a')
assert pathlib.Path(os.readlink(base / 'current')).parts[-2] == A
assert json.loads((shared / 'schema-state.json').read_text())['schemaFingerprint'] == '1' * 64
run('b', False, environment={'MOCK_FAIL_UP_ONCE': B})
assert pathlib.Path(os.readlink(base / 'current')).parts[-2] == A
assert json.loads((shared / 'schema-state.json').read_text())['schemaFingerprint'] == '2' * 64
assert not (shared / 'deploy-in-progress.json').exists() and not (shared / 'schema-uncertain').exists()
assert len(migrations()) == 2
ups = [call[2] for call in calls() if call[0] == 'docker' and call[-1] == 'up']
assert ups[-2:] == [B, A]
run('c', False)
assert len(migrations()) == 2
run('2', False, environment={'MOCK_BAD_LABELS': H})
assert len(migrations()) == 2
run('3', False)
run('4', False)
run('d')
assert pathlib.Path(os.readlink(base / 'current')).parts[-2] == D
assert pathlib.Path(os.readlink(base / 'previous')).parts[-2] == A
run('d')
assert pathlib.Path(os.readlink(base / 'previous')).parts[-2] == A
run('e', False)
run('f', False, environment={'MOCK_FAIL_MIGRATION': F})
assert (shared / 'schema-uncertain').exists() and (shared / 'deploy-in-progress.json').exists()
assert pathlib.Path(os.readlink(base / 'current')).parts[-2] == D
before = len(calls())
run('1', False)
assert len(calls()) == before
before = len(migrations())
run('1', prepare=True)
assert len(migrations()) == before
# Simulate an operator resolving the deliberately failed mock migration. This is
# fixture state only; production markers must never be cleared automatically.
(shared / 'schema-uncertain').unlink()
(shared / 'deploy-in-progress.json').unlink()
run('2', False, environment={'MOCK_FAIL_UP_ALWAYS': H + ',' + D})
assert pathlib.Path(os.readlink(base / 'current')).parts[-2] == D
assert (shared / 'deploy-in-progress.json').exists()
recovery = list(shared.glob('.failed-release-*'))
assert len(recovery) == 1
assert (recovery[0] / 'old-runtime.env').exists()
assert stat.S_IMODE((recovery[0] / 'old-runtime.env').stat().st_mode) == 0o600
assert not list(shared.glob('.release-work.*')) and not list(shared.glob('.env-fetch.*'))
assert not pathlib.Path('/root/.docker/config.json').exists()
assert not list(shared.glob('**/docker-config/config.json'))
print(json.dumps({'mockIntegrationRunsPassed': checks, 'prepareDoesNotLaunch': True,
                  'failedAppRollsBack': True, 'currentPreviousCorrect': True,
                  'schemaStateSurvivesAppRollback': True,
                  'failedMigrationBlocksNextDeploy': True,
                  'rollbackFailureRetainsPrivateRecoveryWithoutToken': True, 'realAwsCalls': 0,
                  'realDockerCallsInsideHarness': 0}))
