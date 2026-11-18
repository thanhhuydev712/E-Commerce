#!/usr/bin/env bash
# Root-only host entrypoint. An SSM document supplies exactly key/version/checksum.
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export AWS_PAGER=''
base=/opt/rigforce
shared=$base/shared
die() { printf '%s\n' "Release rejected: $*" >&2; exit 1; }
[[ "$EUID" -eq 0 ]] || die 'root is required'
prepare=false
if [[ "${1:-}" == --prepare ]]; then prepare=true; shift; fi
[[ "$#" -eq 3 ]] || die 'usage: apply-release.sh [--prepare] KEY VERSION SHA256'
release_key=$1
release_version=$2
release_sha=$3
[[ "$release_sha" =~ ^[a-f0-9]{64}$ ]] || die 'invalid bundle checksum'
[[ "$release_version" =~ ^[A-Za-z0-9._~+/=-]{1,1024}$ && "$release_version" != null ]] || die 'invalid S3 version ID'

host=$shared/host.env
[[ -f "$host" && ! -L "$host" && "$(stat -c '%u:%a' "$host")" == 0:600 ]] || die 'trusted root-owned 0600 host.env is required'
# Nonsecret bootstrap identifiers only. Secret env files are never sourced.
# shellcheck source=/dev/null
source "$host"
for variable in AWS_REGION PROJECT_NAME ENVIRONMENT DOMAIN_NAME RELEASE_BUCKET LOG_GROUP_PREFIX; do
  [[ -n "${!variable:-}" ]] || die "missing host setting $variable"
done
[[ "$ENVIRONMENT" =~ ^(staging|demo)$ && "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]{2,19}$ ]] || die 'invalid host environment'
[[ "$AWS_REGION" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]] || die 'invalid region'
[[ "$DOMAIN_NAME" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || die 'invalid hostname'
[[ "$RELEASE_BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] || die 'invalid release bucket'
[[ "$LOG_GROUP_PREFIX" == "/$PROJECT_NAME/$ENVIRONMENT" ]] || die 'log group mismatch'
[[ "$release_key" =~ ^releases/$ENVIRONMENT/([a-f0-9]{40})/release\.tar\.gz$ ]] || die 'release key must match this environment/full commit'
expected_commit=${BASH_REMATCH[1]}
export AWS_REGION AWS_DEFAULT_REGION="$AWS_REGION"
install -d -m 0750 "$base/releases" /var/log/rigforce
exec 9>"$shared/deploy.lock"
flock -n 9 || die 'another deployment/certificate/secret operation is running'
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a /var/log/rigforce/deploy.log; }
task_tmp=$(mktemp -d "$shared/.release-work.XXXXXXXX")
phase=preflight
candidate=''
old_current=''
policy=''
compatible=false
env_refreshed=false
rollback_failed=false

compose() {
  local directory=$1
  shift
  # Shell env takes precedence over --env-file. Remove inherited overrides so the
  # validated immutable manifest and trusted host settings remain authoritative.
  env -u API_IMAGE -u FRONT_IMAGE -u TOOLS_IMAGE -u SHARED_DIR \
    -u DEPLOY_ENVIRONMENT -u CONTAINER_LOG_GROUP -u BIND_ADDRESS \
    -u HTTP_PORT -u HTTPS_PORT -u COMPOSE_FILE -u COMPOSE_PROJECT_NAME \
    -u COMPOSE_PROFILES -u COMPOSE_ENV_FILES \
    docker compose --project-name "rigforce-$ENVIRONMENT" \
    --env-file "$directory/compose.env" \
    -f "$directory/compose.deploy.yaml" -f "$directory/compose.aws.yaml" "$@"
}

step() {
  local label=$1
  shift
  log "$label"
  if "$@" > "$task_tmp/command.log" 2>&1; then return 0; fi
  log "$label failed; raw command output suppressed to protect environment values."
  return 1
}

smoke() {
  # Public trust/hostname validation stays on. Local resolve probes this host,
  # independent of DNS propagation; it does not prove external routing/firewall.
  local label
  for label in html storefront; do
    local route=/
    [[ "$label" != storefront ]] || route=/api/v1/storefront
    curl --fail --silent --show-error --proto '=https' --tlsv1.2 \
      --connect-timeout 5 --max-time 30 \
      --resolve "$DOMAIN_NAME:443:127.0.0.1" "https://$DOMAIN_NAME$route" \
      --output "$task_tmp/smoke-$label" 2> "$task_tmp/curl.log" || return 1
  done
  python3 - "$task_tmp" <<'PY'
import json, pathlib, sys
try:
    root = pathlib.Path(sys.argv[1])
    if '<html' not in (root / 'smoke-html').read_text().lower():
        raise ValueError()
    result = json.loads((root / 'smoke-storefront').read_text())
    if not isinstance(result.get('data', {}).get('products'), list):
        raise ValueError()
except Exception:
    raise SystemExit(1)
PY
}

restore_env() {
  local label
  if [[ "$env_refreshed" == true ]]; then
    for label in runtime migration; do
      if [[ -f "$task_tmp/old-$label.env" ]]; then
        install -o root -g root -m 0600 "$task_tmp/old-$label.env" "$task_tmp/restore-$label.env" || return 1
        mv -f -- "$task_tmp/restore-$label.env" "$shared/$label.env" || return 1
      fi
    done
  fi
}

finish() {
  local result=$?
  trap - EXIT INT TERM HUP
  set +e
  if [[ "$result" -ne 0 ]]; then
    log "Release did not complete (phase=$phase); schema is never rolled back automatically."
    if [[ "$phase" == migrating ]]; then
      printf '%s\n' 'Migration failed/interrupted; operator must inspect applied/failed migrations before clearing this marker.' > "$shared/schema-uncertain"
      chmod 0600 "$shared/schema-uncertain"
      restore_env || log 'Previous secret snapshot could not be restored; operator recovery is required.'
    fi
    if [[ "$phase" == deploying || "$phase" == smoke || "$phase" == publishing ]]; then
      if [[ -n "$old_current" && "$compatible" == true ]]; then
        log 'Attempting application/config rollback to the previous running release; keeping migrated schema.'
        if restore_env && step 'Restore previous application images/config' compose "$old_current" up --detach --wait --wait-timeout 180 api front nginx && smoke; then
          log 'Application rollback passed HTTPS smoke; current symlink is unchanged.'
          rm -f -- "$shared/deploy-in-progress.json"
        else
          rollback_failed=true
          log 'Application rollback failed; operator recovery is required. Deployment marker retained.'
        fi
      else
        log 'No compatible previous application is available; stopping candidate application services without deleting volumes.'
        if [[ -n "$candidate" ]]; then compose "$candidate" stop api front nginx > "$task_tmp/stop.log" 2>&1 || true; fi
      fi
    elif [[ "$phase" != migrating ]]; then
      restore_env || log 'Previous secret snapshot could not be restored; operator recovery is required.'
    fi
  fi
  if [[ -n "${DOCKER_CONFIG:-}" && "$DOCKER_CONFIG" == "$task_tmp/docker-config" ]]; then
    rm -rf -- "$DOCKER_CONFIG"
  fi
  if [[ "$rollback_failed" == true ]]; then
    # Keep private credential snapshots for authorized recovery, never as bundle.
    mv -- "$task_tmp" "$shared/.failed-release-$release_sha-$$"
  else
    rm -rf -- "$task_tmp"
  fi
  exit "$result"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP

if [[ "$prepare" == false && ( -e "$shared/schema-uncertain" || -e "$shared/deploy-in-progress.json" ) ]]; then
  die 'an earlier migration/deployment needs operator review; --prepare may inspect a candidate without launching it'
fi
if [[ -e "$base/current" || -L "$base/current" ]]; then
  [[ -L "$base/current" ]] || die 'current must be a managed symlink'
  old_current=$(realpath -e "$base/current")
  [[ "$old_current" == "$base/releases/"* && -f "$old_current/manifest.json" && -f "$old_current/compose.env" ]] || die 'current release target is invalid'
fi

log "Download pinned bundle for commit $expected_commit ($ENVIRONMENT)."
if ! aws s3api get-object --bucket "$RELEASE_BUCKET" --key "$release_key" \
  --version-id "$release_version" --region "$AWS_REGION" \
  "$task_tmp/release.tar.gz" > "$task_tmp/s3.json" 2> "$task_tmp/aws.log"; then
  die 'S3 bundle download failed; check object version and scoped instance role'
fi
printf '%s  %s\n' "$release_sha" "$task_tmp/release.tar.gz" | sha256sum --check --status || die 'bundle checksum mismatch'
mkdir -m 0750 "$task_tmp/content"
python3 - "$task_tmp/release.tar.gz" "$task_tmp/content" "$expected_commit" "$ENVIRONMENT" "$AWS_REGION" "$PROJECT_NAME" <<'PY'
import gzip, hashlib, io, json, os, pathlib, re, sys, tarfile

def reject(code):
    raise ValueError(code)

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            reject('DUPLICATE_JSON_KEY')
        result[key] = value
    return result

try:
    archive, destination, commit, environment, region, project = sys.argv[1:]
    archive = pathlib.Path(archive)
    destination = pathlib.Path(destination)
    if archive.stat().st_size > 16 * 1024 * 1024:
        reject('COMPRESSED_BUNDLE_TOO_LARGE')
    with gzip.open(archive, 'rb') as compressed:
        raw = compressed.read(64 * 1024 * 1024 + 1)
    if len(raw) > 64 * 1024 * 1024:
        reject('EXPANDED_BUNDLE_TOO_LARGE')
    inventory, seen = {}, set()
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:') as source:
        for number, member in enumerate(source, 1):
            if number > 128:
                reject('TOO_MANY_ARCHIVE_ENTRIES')
            name = member.name
            if name in ('.', './') and member.isdir():
                continue
            if name.startswith('./'):
                name = name[2:]
            name = name.rstrip('/') if member.isdir() else name
            parts = name.split('/')
            if not name or name.startswith('/') or any(part in ('', '.', '..') for part in parts) or '\\' in name:
                reject('ARCHIVE_PATH_INVALID')
            if name in seen:
                reject('DUPLICATE_ARCHIVE_PATH')
            seen.add(name)
            if member.issym() or member.islnk() or not (member.isfile() or member.isdir()):
                reject('ARCHIVE_LINK_OR_SPECIAL_FILE')
            if member.isdir():
                if name not in ('infra', 'infra/nginx', 'infra/deploy'):
                    reject('ARCHIVE_DIRECTORY_NOT_ALLOWED')
                (destination / name).mkdir(mode=0o750, parents=True, exist_ok=True)
                continue
            allowed = name in ('manifest.json', 'compose.deploy.yaml', 'compose.aws.yaml')
            allowed |= bool(re.fullmatch(r'infra/nginx/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:conf|template)', name))
            allowed |= bool(re.fullmatch(r'infra/deploy/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:sh|service|timer)', name))
            if not allowed or member.size < 0 or member.size > 2 * 1024 * 1024:
                reject('ARCHIVE_FILE_NOT_ALLOWED')
            content = source.extractfile(member).read()
            if len(content) != member.size or b'\x00' in content or b'\r' in content:
                reject('ARCHIVE_TEXT_ENCODING_INVALID')
            content.decode('utf8')
            target = destination / name
            target.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
            with target.open('xb') as output:
                output.write(content)
            os.chmod(target, 0o750 if name.endswith('.sh') else 0o640)
            inventory[name] = hashlib.sha256(content).hexdigest()
    required = {'manifest.json', 'compose.deploy.yaml', 'compose.aws.yaml', 'infra/nginx/production.conf.template'}
    if not required <= set(inventory):
        reject('BUNDLE_REQUIRED_FILES_MISSING')
    manifest = json.loads((destination / 'manifest.json').read_text(), object_pairs_hook=unique_object)
    if type(manifest.get('schemaVersion')) is not int or manifest['schemaVersion'] != 1 or manifest.get('commit') != commit:
        reject('MANIFEST_IDENTITY_MISMATCH')
    if not re.fullmatch(r'[a-f0-9]{64}', str(manifest.get('schemaFingerprint', ''))):
        reject('MANIFEST_SCHEMA_FINGERPRINT_INVALID')
    if manifest.get('migrationPolicy') not in ('none', 'backward-compatible', 'maintenance-required') or type(manifest.get('sourceDirty')) is not bool:
        reject('MANIFEST_POLICY_INVALID')
    images = manifest.get('images')
    if not isinstance(images, dict) or set(images) != {'api', 'front', 'tools'}:
        reject('MANIFEST_IMAGES_INVALID')
    registry = None
    for label, image in images.items():
        suffix = 'front' if label == 'front' else 'api'
        pattern = rf'([0-9]{{12}}\.dkr\.ecr\.{re.escape(region)}\.amazonaws\.com)/{re.escape(project)}/{environment}/{suffix}@sha256:[a-f0-9]{{64}}'
        match = re.fullmatch(pattern, image) if isinstance(image, str) else None
        if not match or (registry is not None and registry != match[1]):
            reject('IMAGE_REPOSITORY_OR_ENVIRONMENT_MISMATCH')
        registry = match[1]
    (destination / '.bundle-inventory.json').write_text(json.dumps(inventory, sort_keys=True) + '\n')
except Exception as error:
    code = str(error) if isinstance(error, ValueError) and re.fullmatch(r'[A-Z_]+', str(error)) else 'ARCHIVE_OR_MANIFEST_INVALID'
    print('Bundle validation failed: ' + code, file=sys.stderr)
    raise SystemExit(1)
PY

candidate=$base/releases/$expected_commit/$release_sha
install -d -m 0750 "$base/releases/$expected_commit"
if [[ -e "$candidate" || -L "$candidate" ]]; then
  [[ -d "$candidate" && ! -L "$candidate" ]] || die 'existing release target is invalid'
  python3 - "$candidate" "$task_tmp/content/.bundle-inventory.json" <<'PY'
import hashlib, json, pathlib, sys
try:
    root = pathlib.Path(sys.argv[1])
    inventory = json.loads(pathlib.Path(sys.argv[2]).read_text())
    for name, checksum in inventory.items():
        item = root / name
        if item.is_symlink() or not item.is_file() or hashlib.sha256(item.read_bytes()).hexdigest() != checksum:
            raise ValueError()
except Exception:
    print('Existing immutable release differs from the pinned bundle.', file=sys.stderr)
    raise SystemExit(1)
PY
else
  mv -- "$task_tmp/content" "$candidate"
fi

policy=$(jq -er '.migrationPolicy' "$candidate/manifest.json")
fingerprint=$(jq -er '.schemaFingerprint' "$candidate/manifest.json")
api_image=$(jq -er '.images.api' "$candidate/manifest.json")
front_image=$(jq -er '.images.front' "$candidate/manifest.json")
tools_image=$(jq -er '.images.tools' "$candidate/manifest.json")
if [[ "$prepare" == false ]]; then
  [[ "$(jq -r '.sourceDirty' "$candidate/manifest.json")" == false ]] || die 'deployment requires a clean source manifest'
  [[ "$policy" != maintenance-required ]] || die 'maintenance-required needs a separate operator maintenance procedure'
  known_fingerprint=''
  if [[ -f "$shared/schema-state.json" && ! -L "$shared/schema-state.json" ]]; then
    known_fingerprint=$(jq -er '.schemaFingerprint' "$shared/schema-state.json")
    [[ "$known_fingerprint" =~ ^[a-f0-9]{64}$ ]] || die 'stored schema state is invalid'
  fi
  if [[ "$policy" == none && "$known_fingerprint" != "$fingerprint" ]]; then
    die 'policy none requires an already-known identical schema fingerprint; first deployment must declare backward-compatible'
  fi
  if [[ "$policy" == backward-compatible || "$known_fingerprint" == "$fingerprint" ]]; then compatible=true; fi
fi

for label in runtime migration; do
  if [[ -e "$shared/$label.env" || -L "$shared/$label.env" ]]; then
    [[ -f "$shared/$label.env" && ! -L "$shared/$label.env" && "$(stat -c '%u:%a' "$shared/$label.env")" == 0:600 ]] || die 'existing secret file permissions are invalid'
    cp -p -- "$shared/$label.env" "$task_tmp/old-$label.env"
  fi
done
env_refreshed=true
step 'Refresh exact runtime/migration SecureStrings' "$base/bin/fetch-env.sh"
{
  printf 'DEPLOY_ENVIRONMENT=%s\n' "$ENVIRONMENT"
  printf 'API_IMAGE=%s\nFRONT_IMAGE=%s\nTOOLS_IMAGE=%s\n' "$api_image" "$front_image" "$tools_image"
  printf 'DOMAIN_NAME=%s\nSHARED_DIR=%s\nAWS_REGION=%s\n' "$DOMAIN_NAME" "$shared" "$AWS_REGION"
  printf 'CONTAINER_LOG_GROUP=%s/containers\n' "$LOG_GROUP_PREFIX"
  printf 'BIND_ADDRESS=0.0.0.0\nHTTP_PORT=80\nHTTPS_PORT=443\n'
} > "$task_tmp/compose.env"
install -o root -g root -m 0600 "$task_tmp/compose.env" "$candidate/compose.env"
step 'Validate production Compose without printing resolved secrets' compose "$candidate" config --quiet
if [[ "$prepare" == true ]]; then
  log "Prepared release directory: $candidate"
  log 'No migration, application start, certificate issuance or symlink promotion was performed.'
  exit 0
fi

phase=certificate
certificate=$shared/letsencrypt/live/$DOMAIN_NAME/fullchain.pem
private_key=$shared/letsencrypt/live/$DOMAIN_NAME/privkey.pem
[[ -r "$certificate" && -r "$private_key" ]] || die 'issue a trusted certificate after --prepare before deploying'
step 'Verify certificate hostname and at least 24 hours validity' openssl x509 -in "$certificate" -noout -checkhost "$DOMAIN_NAME" -checkend 86400
step 'Verify public certificate trust chain' openssl verify -untrusted "$certificate" "$certificate"
certificate_public=$(openssl x509 -in "$certificate" -pubkey -noout 2> "$task_tmp/cert.log" | openssl pkey -pubin -outform DER 2>> "$task_tmp/cert.log" | sha256sum)
private_public=$(openssl pkey -in "$private_key" -passin pass: -pubout -outform DER 2> "$task_tmp/key.log" | sha256sum)
[[ "$certificate_public" == "$private_public" ]] || die 'certificate/private key do not match'

phase=pull
export DOCKER_CONFIG="$task_tmp/docker-config"
mkdir -m 0700 "$DOCKER_CONFIG"
registry=${api_image%%/*}
log 'Authenticate ECR using a temporary Docker config; token is not logged.'
if ! aws ecr get-login-password --region "$AWS_REGION" 2> "$task_tmp/ecr.log" \
  | docker login --username AWS --password-stdin "$registry" > "$task_tmp/login.log" 2>&1; then
  die 'ECR authentication failed'
fi
step 'Pull immutable production images' compose "$candidate" pull api front migrate nginx
docker image inspect "$api_image" "$front_image" "$tools_image" \
  --format '{"architecture":{{json .Architecture}},"os":{{json .Os}},"labels":{{json .Config.Labels}}}' \
  > "$task_tmp/image-labels.jsonl" 2> "$task_tmp/inspect.log"
python3 - "$task_tmp/image-labels.jsonl" "$expected_commit" "$fingerprint" <<'PY'
import json, pathlib, sys
try:
    images = [json.loads(line) for line in pathlib.Path(sys.argv[1]).read_text().splitlines()]
    if len(images) != 3:
        raise ValueError()
    for image in images:
        labels = image.get('labels') or {}
        if image.get('architecture') != 'amd64' or image.get('os') != 'linux' or labels.get('org.opencontainers.image.revision') != sys.argv[2] or labels.get('dev.rigforce.schema-fingerprint') != sys.argv[3]:
            raise ValueError()
except Exception:
    print('Pulled image platform/revision/schema labels do not match the manifest.', file=sys.stderr)
    raise SystemExit(1)
PY

phase=migrating
jq -n --arg commit "$expected_commit" --arg checksum "$release_sha" \
  '{phase:"migration",commit:$commit,bundleSha256:$checksum}' > "$task_tmp/deploy-state.json"
mv -f -- "$task_tmp/deploy-state.json" "$shared/deploy-in-progress.json"
step 'Apply one-shot migration with its separate DB role' compose "$candidate" run --rm --no-deps migrate
# This state follows schema, not app. Keep it after application rollback.
jq -n --arg fingerprint "$fingerprint" --arg commit "$expected_commit" \
  '{schemaFingerprint:$fingerprint,appliedByCommit:$commit}' > "$task_tmp/schema-state.json"
mv -f -- "$task_tmp/schema-state.json" "$shared/schema-state.json"
phase=deploying
jq -n --arg commit "$expected_commit" '{phase:"application",commit:$commit}' > "$task_tmp/deploy-state.json"
mv -f -- "$task_tmp/deploy-state.json" "$shared/deploy-in-progress.json"
step 'Start application and wait for all production health checks' compose "$candidate" up --detach --wait --wait-timeout 180 api front nginx
phase=smoke
step 'Verify HTTPS HTML and public catalog through Nginx' smoke
phase=publishing
if [[ -n "$old_current" && "$old_current" != "$candidate" ]]; then
  ln -s -- "$old_current" "$task_tmp/previous"
  mv -Tf -- "$task_tmp/previous" "$base/previous"
fi
ln -s -- "$candidate" "$task_tmp/current"
mv -Tf -- "$task_tmp/current" "$base/current"
rm -f -- "$shared/deploy-in-progress.json"
phase=complete
log "Release active: $expected_commit; schema fingerprint $fingerprint."
