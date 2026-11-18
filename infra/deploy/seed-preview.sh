#!/usr/bin/env bash
# Explicit operator action for a new preview DB. CD never seeds automatically.
set -Eeuo pipefail
umask 077
[[ $EUID == 0 && ${1:-} == --new-sample-catalog ]] || { echo 'Usage: sudo bash seed-preview.sh --new-sample-catalog PREPARED_RELEASE_DIR' >&2; exit 1; }
# shellcheck source=/dev/null
source /opt/rigforce/shared/host.env
[[ $ENVIRONMENT =~ ^(staging|demo)$ ]] || exit 1
release=$(realpath -e "${2:?Supply prepared release directory}")
[[ $release == /opt/rigforce/releases/* && -f $release/compose.env ]] || exit 1
# Generated nonsecret file, owned by root; never source runtime/migration env.
# shellcheck source=/dev/null
source "$release/compose.env"
exec 9>/opt/rigforce/shared/deploy.lock
flock -n 9 || { echo 'Another operation is running.' >&2; exit 1; }
compose=(docker compose --project-name "rigforce-$ENVIRONMENT" --env-file "$release/compose.env" -f "$release/compose.deploy.yaml" -f "$release/compose.aws.yaml")
task_tmp=$(mktemp -d /opt/rigforce/shared/.seed-work.XXXXXXXX)
assets=''
trap 'if [[ -n $assets ]]; then docker volume rm "$assets" >/dev/null 2>&1 || true; fi; rm -rf -- "$task_tmp"' EXIT
export DOCKER_CONFIG="$task_tmp/docker-config"
mkdir -m 0700 "$DOCKER_CONFIG"
registry=${FRONT_IMAGE%%/*}
[[ $registry =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com$ ]] || exit 1
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry" > "$task_tmp/login.log" 2>&1
"${compose[@]}" pull migrate front
"${compose[@]}" run --rm --no-deps migrate
probe='const {Client}=require("pg");(async()=>{const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();const r=await db.query("SELECT count(*)::int AS n FROM products");await db.end();if(r.rows[0].n!==0)process.exitCode=1;})().catch(()=>process.exit(1));'
"${compose[@]}" run --rm --no-deps --entrypoint node migrate -e "$probe" || { echo 'Catalog is not empty or probe failed; refuse seed.' >&2; exit 1; }
assets="rigforce-$ENVIRONMENT-seed-$(date +%s)-$$"
docker volume create "$assets" >/dev/null
# The already-published frontend image is the source of sample image bytes.
docker run --rm --user 0 --entrypoint sh -v "$assets:/seed" "$FRONT_IMAGE" -ec 'cp -a /app/front/public/images/. /seed/'
"${compose[@]}" run --rm --no-deps --entrypoint sh \
  -v "$assets:/app/front/public/images:ro" -v "rigforce-${ENVIRONMENT}_media_data:/app/api/.local-media" \
  -e NODE_ENV=development -e MEDIA_ROOT=/app/api/.local-media \
  migrate -ec 'node scripts/run-built.cjs access && node prisma/seed-storefront.cjs --apply'
echo 'Sample catalog/media created. Runtime remains production, read-only and payment-disabled.'
