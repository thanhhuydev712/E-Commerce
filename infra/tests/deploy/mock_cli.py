#!/usr/bin/env python3
"""Fake host CLIs for integration.py. All credentials/payloads below are fixtures."""
import json
import os
import pathlib
import shutil
import sys

if os.environ.get('RIGFORCE_TEST_CONTAINER') != '1' or not pathlib.Path('/.dockerenv').is_file():
    raise SystemExit('Mocks may run only inside the documented isolated test container.')

name = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
state = pathlib.Path('/tmp/rigforce-mocks')
state.mkdir(exist_ok=True)


def log(payload):
    with (state / 'calls.jsonl').open('a') as output:
        output.write(json.dumps([name] + payload) + '\n')


def argument(flag):
    return args[args.index(flag) + 1]


if name == 'aws':
    if args[:2] == ['ssm', 'get-parameter']:
        parameter = argument('--name')
        label = 'runtime' if parameter.endswith('runtime-env') else 'migration'
        values = {
            'DATABASE_URL': 'postgresql://app:fixture@db.abc.ap-southeast-1.rds.amazonaws.com:5432/rigforce?sslmode=verify-full&sslrootcert=/run/certs/rds-global-bundle.pem',
            'DATABASE_SCHEMA': 'public',
        }
        if label == 'runtime':
            values.update(JWT_SECRET='A' * 64, JWT_REFRESH_SECRET='B' * 64,
                          ALLOWED_ORIGINS='https://staging.example.com',
                          STOREFRONT_URL='https://staging.example.com')
        else:
            values['DATABASE_URL'] = values['DATABASE_URL'].replace('//app:', '//migrator:')
            values['PRISMA_MIGRATION_DATABASE_URL'] = values['DATABASE_URL'].replace(
                'sslmode=verify-full&sslrootcert=', 'sslmode=require&sslaccept=strict&sslcert=')
        log(['ssm', label])
        print(json.dumps({'Parameter': {'Name': parameter, 'Type': 'SecureString',
                                       'Value': ''.join(key + '=' + value + '\n' for key, value in values.items())}}))
    elif args[:2] == ['s3api', 'get-object']:
        commit = argument('--key').split('/')[2]
        shutil.copyfile(state / 'archives' / (commit + '.tar.gz'), args[-1])
        log(['s3', commit])
        print('{}')
    elif args[:2] == ['ecr', 'get-login-password']:
        print('private-fixture-token')
    else:
        raise SystemExit('Unexpected AWS call in fixture.')
elif name == 'docker':
    if args[0] == 'login':
        sys.stdin.read()
        log(['login'])
        # Emulate the credential file created by a real docker login.
        config = pathlib.Path(os.environ['DOCKER_CONFIG'])
        (config / 'config.json').write_text('{"fixture":"private-fixture-token"}')
        print('ok')
    elif args[:2] == ['image', 'inspect']:
        metadata = json.loads((state / 'images.json').read_text())
        for image in args[2:args.index('--format')]:
            commit, fingerprint = metadata[image]
            if os.getenv('MOCK_BAD_LABELS') == commit:
                fingerprint = '0' * 64
            print(json.dumps({'architecture': 'amd64', 'os': 'linux', 'labels': {
                'org.opencontainers.image.revision': commit,
                'dev.rigforce.schema-fingerprint': fingerprint}}))
    elif args[0] == 'compose':
        directory = pathlib.Path(argument('--env-file')).parent
        commit = json.loads((directory / 'manifest.json').read_text())['commit']
        command = next(item for item in args if item in ['config', 'pull', 'run', 'up', 'stop'])
        log(['compose', commit, command])
        if command == 'run' and os.getenv('MOCK_FAIL_MIGRATION') == commit:
            raise SystemExit(19)
        if command == 'up':
            (state / 'running').write_text(commit)
            if commit in os.getenv('MOCK_FAIL_UP_ALWAYS', '').split(','):
                raise SystemExit(22)
            marker = state / ('failed-' + commit)
            if os.getenv('MOCK_FAIL_UP_ONCE') == commit and not marker.exists():
                marker.touch()
                raise SystemExit(21)
    else:
        raise SystemExit('Unexpected Docker call in fixture.')
elif name == 'curl':
    assert '--insecure' not in args and '-k' not in args
    url = next(item for item in args if item.startswith('https://'))
    pathlib.Path(argument('--output')).write_text(
        '{"data":{"products":[]}}' if url.endswith('/api/v1/storefront') else '<html>fixture</html>')
    log(['https-smoke'])
elif name == 'openssl':
    if args[0] == 'x509' and '-pubkey' in args:
        print('public')
    elif args[0] == 'pkey':
        if '-pubin' in args:
            sys.stdin.read()
        print('fixture-public-key')
    log(['certificate-check'])
else:
    raise SystemExit('Unexpected mock executable name.')
