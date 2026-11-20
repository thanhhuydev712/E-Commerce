#!/usr/bin/env bash
# Fetch two exact SecureString parameters; never source or print their payloads.
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export AWS_PAGER=''
die() { printf '%s\n' "Environment fetch failed: $*" >&2; exit 1; }
[[ "$EUID" -eq 0 && "$#" -eq 0 ]] || die 'run as root without arguments'

host=/opt/rigforce/shared/host.env
[[ -f "$host" && ! -L "$host" ]] || die 'trusted host.env is missing'
[[ "$(stat -c '%u:%a' "$host")" == 0:600 ]] || die 'host.env must be root-owned mode 0600'
# This root-owned file contains nonsecret identifiers; SecureString is never sourced.
# shellcheck source=/dev/null
source "$host"
for variable in AWS_REGION PROJECT_NAME ENVIRONMENT DOMAIN_NAME RUNTIME_PARAMETER_NAME MIGRATION_PARAMETER_NAME; do
  [[ -n "${!variable:-}" ]] || die "host setting $variable is missing"
done
[[ "$ENVIRONMENT" =~ ^(staging|demo)$ && "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]{2,19}$ ]] || die 'invalid host environment'
[[ "$AWS_REGION" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]] || die 'invalid host region'
[[ "$DOMAIN_NAME" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]] || die 'invalid host domain'
[[ "$RUNTIME_PARAMETER_NAME" == "/$PROJECT_NAME/$ENVIRONMENT/runtime-env" ]] || die 'runtime parameter path mismatch'
[[ "$MIGRATION_PARAMETER_NAME" == "/$PROJECT_NAME/$ENVIRONMENT/migration-env" ]] || die 'migration parameter path mismatch'
export AWS_REGION AWS_DEFAULT_REGION="$AWS_REGION"

# Inherit the apply-release lock when invoked as its child; standalone refresh
# acquires the same host lock so it cannot race container creation/rollback.
if [[ "$(readlink "/proc/$$/fd/9" 2>/dev/null || true)" != /opt/rigforce/shared/deploy.lock ]]; then
  exec 9>/opt/rigforce/shared/deploy.lock
fi
flock -n 9 || die 'another deployment/certificate operation is running'
exec 8>/opt/rigforce/shared/env.lock
flock -n 8 || die 'another secret refresh is running'
task_tmp=$(mktemp -d /opt/rigforce/shared/.env-fetch.XXXXXXXX)
trap 'rm -rf -- "$task_tmp"' EXIT
if ! aws ssm get-parameter --name "$RUNTIME_PARAMETER_NAME" --with-decryption \
  --region "$AWS_REGION" --output json > "$task_tmp/runtime.json" 2> "$task_tmp/aws-runtime.log"; then
  die 'runtime SecureString could not be read; inspect IAM/parameter configuration without printing values'
fi
if ! aws ssm get-parameter --name "$MIGRATION_PARAMETER_NAME" --with-decryption \
  --region "$AWS_REGION" --output json > "$task_tmp/migration.json" 2> "$task_tmp/aws-migration.log"; then
  die 'migration SecureString could not be read; inspect IAM/parameter configuration without printing values'
fi

python3 - "$task_tmp" "$RUNTIME_PARAMETER_NAME" "$MIGRATION_PARAMETER_NAME" "$DOMAIN_NAME" <<'PY'
import json, os, pathlib, re, sys
from urllib.parse import parse_qsl, unquote, urlsplit

def fail(code):
    raise ValueError(code)

def read_payload(directory, label, expected):
    response = json.loads((directory / (label + '.json')).read_text())
    parameter = response.get('Parameter', {})
    if parameter.get('Type') != 'SecureString' or parameter.get('Name') != expected:
        fail('PARAMETER_METADATA_MISMATCH')
    value = parameter.get('Value')
    if not isinstance(value, str) or not value or len(value.encode()) > 8192:
        fail('PARAMETER_SIZE_INVALID')
    if '\x00' in value or '\r' in value:
        fail('ENV_ENCODING_INVALID')
    values = {}
    for line in value.split('\n'):
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            fail('ENV_LINE_INVALID')
        key, item = line.split('=', 1)
        if not re.fullmatch(r'[A-Z][A-Z0-9_]*', key) or key in values:
            fail('ENV_KEY_INVALID_OR_DUPLICATE')
        if not item or any(ord(char) < 32 or ord(char) == 127 for char in item):
            fail('ENV_VALUE_INVALID')
        values[key] = item
    return values, value.rstrip('\n') + '\n'

def database(value, cli=False):
    url = urlsplit(value)
    if url.scheme not in ('postgres', 'postgresql') or not url.hostname or not url.username or not url.password:
        fail('DATABASE_URL_INVALID')
    if url.fragment or url.port not in (None, 5432) or not re.fullmatch(r'/[A-Za-z][A-Za-z0-9_]*', url.path):
        fail('DATABASE_TARGET_INVALID')
    if not re.fullmatch(r'[A-Za-z0-9.-]+\.rds\.amazonaws\.com', url.hostname):
        fail('DATABASE_MUST_USE_RDS_HOSTNAME')
    pairs = parse_qsl(url.query, keep_blank_values=True)
    if len({key for key, _ in pairs}) != len(pairs):
        fail('DATABASE_QUERY_DUPLICATE')
    query = dict(pairs)
    if query.get('schema', 'public') != 'public':
        fail('DATABASE_SCHEMA_MISMATCH')
    if cli:
        if query.get('sslmode') != 'require' or query.get('sslaccept') != 'strict' or query.get('sslcert') != '/run/certs/rds-global-bundle.pem':
            fail('PRISMA_TLS_REQUIRED')
        if 'sslrootcert' in query:
            fail('PRISMA_TLS_DIALECT_MISMATCH')
    else:
        if query.get('sslmode') != 'verify-full' or query.get('sslrootcert') != '/run/certs/rds-global-bundle.pem':
            fail('PG_VERIFIED_TLS_REQUIRED')
        if 'sslaccept' in query or 'sslcert' in query:
            fail('PG_TLS_DIALECT_MISMATCH')
    allowed = {'schema', 'sslmode', 'sslcert', 'sslaccept', 'sslrootcert', 'connect_timeout', 'connection_limit', 'pool_timeout'}
    if set(query) - allowed:
        fail('DATABASE_QUERY_UNSUPPORTED')
    return (url.hostname.lower(), url.port or 5432, url.path, unquote(url.username), unquote(url.password))

try:
    directory = pathlib.Path(sys.argv[1])
    runtime, runtime_text = read_payload(directory, 'runtime', sys.argv[2])
    migration, migration_text = read_payload(directory, 'migration', sys.argv[3])
    required_runtime = {'DATABASE_URL', 'DATABASE_SCHEMA', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ALLOWED_ORIGINS', 'STOREFRONT_URL'}
    flags = {'NODE_ENV': 'production', 'PREVIEW_READ_ONLY': 'true', 'DATABASE_TLS_REQUIRED': 'true', 'TRUST_PROXY_HOPS': '1'}
    recovery_fields = {'PASSWORD_RECOVERY_ALLOWED_EMAILS', 'CHALLENGE_DELIVERY',
                       'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'}
    allowed_runtime = required_runtime | {'JWT_EXPIRES_IN', 'REFRESH_TTL_SECONDS', 'INTERACTIVE_DEMO',
                                          'PASSWORD_RECOVERY_ENABLED'} | recovery_fields | set(flags)
    required_migration = {'DATABASE_URL', 'PRISMA_MIGRATION_DATABASE_URL', 'DATABASE_SCHEMA'}
    if not required_runtime <= set(runtime) or set(runtime) - allowed_runtime:
        fail('RUNTIME_KEYS_INVALID')
    if set(migration) != required_migration:
        fail('MIGRATION_KEYS_INVALID')
    if runtime['DATABASE_SCHEMA'] != 'public' or migration['DATABASE_SCHEMA'] != 'public':
        fail('DATABASE_SCHEMA_MUST_BE_PUBLIC')
    for key, expected in flags.items():
        if key in runtime and runtime[key] != expected:
            fail('PRODUCTION_FLAG_MISMATCH')
    if runtime.get('INTERACTIVE_DEMO', 'false') not in ('true', 'false'):
        fail('INTERACTIVE_DEMO_INVALID')
    if runtime.get('PASSWORD_RECOVERY_ENABLED', 'false') not in ('true', 'false'):
        fail('PASSWORD_RECOVERY_FLAG_INVALID')
    recovery_enabled = runtime.get('PASSWORD_RECOVERY_ENABLED', 'false') == 'true'
    if recovery_enabled:
        if runtime.get('INTERACTIVE_DEMO') != 'true' or runtime.get('CHALLENGE_DELIVERY') != 'smtp':
            fail('PASSWORD_RECOVERY_REQUIRES_DEMO_SMTP')
        if not recovery_fields <= set(runtime):
            fail('PASSWORD_RECOVERY_SETTINGS_MISSING')
        addresses = runtime['PASSWORD_RECOVERY_ALLOWED_EMAILS'].split(',')
        address_pattern = r'[a-z0-9.!#$%&\x27*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?'
        if (not 1 <= len(addresses) <= 5 or len(set(addresses)) != len(addresses)
                or any(not re.fullmatch(address_pattern, address) or address != address.lower() for address in addresses)
                or runtime['SMTP_FROM'] not in addresses):
            fail('PASSWORD_RECOVERY_EMAIL_SCOPE_INVALID')
        if not re.fullmatch(r'email-smtp\.[a-z]{2}-[a-z]+-[0-9]+\.amazonaws\.com', runtime['SMTP_HOST']):
            fail('SMTP_HOST_INVALID')
        if (runtime['SMTP_PORT'], runtime['SMTP_SECURE']) not in (('465', 'true'), ('587', 'false')):
            fail('SMTP_TLS_MODE_INVALID')
    elif recovery_fields & set(runtime):
        fail('SMTP_SETTINGS_REQUIRE_RECOVERY')
    if min(len(runtime['JWT_SECRET']), len(runtime['JWT_REFRESH_SECRET'])) < 32 or runtime['JWT_SECRET'] == runtime['JWT_REFRESH_SECRET']:
        fail('JWT_SECRETS_INVALID')
    for key, upper in [('JWT_EXPIRES_IN', 3600), ('REFRESH_TTL_SECONDS', 2592000)]:
        if key in runtime and (not runtime[key].isdigit() or not 0 < int(runtime[key]) <= upper):
            fail('TOKEN_TTL_INVALID')
    expected_origin = 'https://' + sys.argv[4]
    if runtime['ALLOWED_ORIGINS'] != expected_origin or runtime['STOREFRONT_URL'] != expected_origin:
        fail('HTTPS_ORIGIN_MISMATCH')
    app = database(runtime['DATABASE_URL'])
    tool = database(migration['DATABASE_URL'])
    cli = database(migration['PRISMA_MIGRATION_DATABASE_URL'], cli=True)
    if app[:3] != tool[:3] or tool != cli or app[3] == tool[3]:
        fail('DATABASE_ROLE_OR_TARGET_MISMATCH')
    for label, text in [('runtime', runtime_text), ('migration', migration_text)]:
        target = directory / (label + '.env')
        with target.open('x', encoding='utf8', newline='\n') as output:
            output.write(text)
        os.chmod(target, 0o600)
except Exception as error:
    # Never print parser/URL/JSON exceptions: their messages can contain secrets.
    code = str(error) if isinstance(error, ValueError) and re.fullmatch(r'[A-Z_]+', str(error)) else 'PAYLOAD_VALIDATION_FAILED'
    print('Environment validation failed: ' + code, file=sys.stderr)
    raise SystemExit(1)
PY

# Both payloads validate before either file changes; each rename is atomic. The
# env.lock serializes readers in this deployment system; Compose reads at create.
for label in runtime migration; do
  target="/opt/rigforce/shared/$label.env"
  [[ ! -L "$target" && ( ! -e "$target" || -f "$target" ) ]] || die 'secret destination must be a regular file'
done
mv -f -- "$task_tmp/runtime.env" /opt/rigforce/shared/runtime.env
mv -f -- "$task_tmp/migration.env" /opt/rigforce/shared/migration.env
printf '%s\n' 'Runtime and migration SecureStrings refreshed; payloads were not printed or sourced.'
