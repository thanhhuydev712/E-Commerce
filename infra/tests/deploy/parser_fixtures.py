"""Exercise the actual inline Python validators without AWS, Docker or /opt writes."""
import copy
import io
import json
import pathlib
import re
import subprocess
import sys
import tarfile
import tempfile

repository = pathlib.Path(__file__).resolve().parents[3]
apply = (repository / 'infra/deploy/apply-release.sh').read_text(encoding='utf8')
fetch = (repository / 'infra/deploy/fetch-env.sh').read_text(encoding='utf8')
archive_code = next(block for block in re.findall(r"<<'PY'\n(.*?)\nPY", apply, re.S)
                    if 'ARCHIVE_PATH_INVALID' in block)
environment_code = next(block for block in re.findall(r"<<'PY'\n(.*?)\nPY", fetch, re.S)
                        if 'PARAMETER_METADATA_MISMATCH' in block)
commit, fingerprint = 'a' * 40, 'f' * 64
registry = '111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/'
manifest = {
    'schemaVersion': 1, 'commit': commit,
    'images': {'api': registry + 'rigforce/staging/api@sha256:' + '1' * 64,
               'front': registry + 'rigforce/staging/front@sha256:' + '2' * 64,
               'tools': registry + 'rigforce/staging/api@sha256:' + '3' * 64},
    'migrationPolicy': 'backward-compatible', 'schemaFingerprint': fingerprint, 'sourceDirty': False,
}
checks = 0


def archive_case(base, name, mutate=None, extra=None, expected=True):
    global checks
    folder = base / name
    folder.mkdir()
    output = folder / 'output'
    output.mkdir()
    candidate = copy.deepcopy(manifest)
    if mutate:
        mutate(candidate)
    files = {'manifest.json': json.dumps(candidate).encode(),
             'compose.deploy.yaml': b'services: {}\n', 'compose.aws.yaml': b'services: {}\n',
             'infra/nginx/production.conf.template': b'server {}\n',
             'infra/deploy/renew.service': b'[Unit]\n', 'infra/deploy/renew.timer': b'[Timer]\n'}
    archive = folder / 'bundle.tar.gz'
    with tarfile.open(archive, 'w:gz') as target:
        for path, content in files.items():
            item = tarfile.TarInfo(path)
            item.size = len(content)
            target.addfile(item, io.BytesIO(content))
        if extra:
            extra(target)
    result = subprocess.run([sys.executable, '-c', archive_code, str(archive), str(output), commit,
                             'staging', 'ap-southeast-1', 'rigforce'], capture_output=True, text=True)
    assert (result.returncode == 0) == expected, (name, result.stderr)
    checks += 1


def member(archive, name, symlink=False):
    item = tarfile.TarInfo(name)
    if symlink:
        item.type, item.linkname = tarfile.SYMTYPE, '/etc/passwd'
        archive.addfile(item)
    else:
        item.size = 1
        archive.addfile(item, io.BytesIO(b'x'))


runtime = {
    'DATABASE_URL': 'postgresql://app:fixture@db.abc.ap-southeast-1.rds.amazonaws.com:5432/rigforce?sslmode=verify-full&sslrootcert=/run/certs/rds-global-bundle.pem',
    'DATABASE_SCHEMA': 'public', 'JWT_SECRET': 'A' * 64, 'JWT_REFRESH_SECRET': 'B' * 64,
    'ALLOWED_ORIGINS': 'https://staging.example.com', 'STOREFRONT_URL': 'https://staging.example.com',
}
migration = {
    'DATABASE_URL': runtime['DATABASE_URL'].replace('//app:', '//migrator:'),
    'PRISMA_MIGRATION_DATABASE_URL': runtime['DATABASE_URL'].replace('//app:', '//migrator:').replace(
        'sslmode=verify-full&sslrootcert=', 'sslmode=require&sslaccept=strict&sslcert='),
    'DATABASE_SCHEMA': 'public',
}


def environment_case(base, name, mutate=None, expected=True):
    global checks
    folder = base / name
    folder.mkdir()
    app, tool = copy.deepcopy(runtime), copy.deepcopy(migration)
    if mutate:
        mutate(app, tool)
    for label, values in [('runtime', app), ('migration', tool)]:
        payload = ''.join(key + '=' + value + '\n' for key, value in values.items())
        response = {'Parameter': {'Name': '/rigforce/staging/' + label + '-env',
                                  'Type': 'SecureString', 'Value': payload}}
        (folder / (label + '.json')).write_text(json.dumps(response))
    result = subprocess.run([sys.executable, '-c', environment_code, str(folder),
                             '/rigforce/staging/runtime-env', '/rigforce/staging/migration-env',
                             'staging.example.com'], capture_output=True, text=True)
    assert (result.returncode == 0) == expected, (name, result.stderr)
    assert 'postgresql://' not in result.stdout + result.stderr
    if name == 'shell-literal':
        assert '$(touch /tmp/SHOULD_NOT_RUN)' in (folder / 'runtime.env').read_text()
    checks += 1


with tempfile.TemporaryDirectory(prefix='rigforce-parser-fixture-') as temporary:
    base = pathlib.Path(temporary)
    archive_case(base, 'valid')
    archive_case(base, 'traversal', extra=lambda archive: member(archive, 'infra/deploy/../../outside.sh'), expected=False)
    archive_case(base, 'symlink', extra=lambda archive: member(archive, 'infra/deploy/attack.sh', True), expected=False)
    archive_case(base, 'duplicate', extra=lambda archive: member(archive, './manifest.json'), expected=False)
    archive_case(base, 'secret-file', extra=lambda archive: member(archive, 'infra/deploy/runtime.env'), expected=False)
    archive_case(base, 'wrong-env', mutate=lambda candidate: candidate['images'].__setitem__(
        'api', registry + 'rigforce/demo/api@sha256:' + '1' * 64), expected=False)
    archive_case(base, 'tag-image', mutate=lambda candidate: candidate['images'].__setitem__(
        'api', registry + 'rigforce/staging/api:latest'), expected=False)
    archive_case(base, 'boolean-schema', mutate=lambda candidate: candidate.__setitem__('schemaVersion', True), expected=False)
    archive_case(base, 'wrong-commit', mutate=lambda candidate: candidate.__setitem__('commit', 'b' * 40), expected=False)
    archive_case(base, 'wrong-policy', mutate=lambda candidate: candidate.__setitem__('migrationPolicy', 'automatic'), expected=False)
    archive_case(base, 'dirty-type', mutate=lambda candidate: candidate.__setitem__('sourceDirty', 'false'), expected=False)
    environment_case(base, 'valid-env')
    environment_case(base, 'interactive-demo', lambda app, tool: app.__setitem__('INTERACTIVE_DEMO', 'true'))
    environment_case(base, 'interactive-off', lambda app, tool: app.__setitem__('INTERACTIVE_DEMO', 'false'))
    environment_case(base, 'invalid-interactive', lambda app, tool: app.__setitem__('INTERACTIVE_DEMO', 'yes'), False)
    environment_case(base, 'shell-literal', lambda app, tool: app.__setitem__('JWT_SECRET', '$(touch /tmp/SHOULD_NOT_RUN)' + 'C' * 40))
    environment_case(base, 'wrong-role', lambda app, tool: app.__setitem__('DATABASE_URL', tool['DATABASE_URL']), False)
    environment_case(base, 'insecure-pg', lambda app, tool: app.__setitem__(
        'DATABASE_URL', app['DATABASE_URL'].replace('verify-full', 'disable')), False)
    environment_case(base, 'insecure-prisma', lambda app, tool: tool.__setitem__(
        'PRISMA_MIGRATION_DATABASE_URL', tool['PRISMA_MIGRATION_DATABASE_URL'].replace('sslaccept=strict', 'sslaccept=accept_invalid_certs')), False)
    environment_case(base, 'wrong-origin', lambda app, tool: app.__setitem__('ALLOWED_ORIGINS', 'http://localhost:3000'), False)
    environment_case(base, 'unknown-env', lambda app, tool: app.__setitem__('STRIPE_SECRET_KEY', 'sk_test_fixture'), False)
    environment_case(base, 'newline-injection', lambda app, tool: app.__setitem__('JWT_SECRET', 'A' * 64 + '\nUNEXPECTED=bad'), False)

print(json.dumps({'fixtureChecksPassed': checks, 'archiveChecks': 11, 'envChecks': 11,
                  'networkCalls': 0, 'awsCalls': 0}))
