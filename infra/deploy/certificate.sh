#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
[[ $EUID == 0 ]] || { echo 'Run as root on the prepared EC2 host.' >&2; exit 1; }
# shellcheck source=/dev/null
source /opt/rigforce/shared/host.env
shared=/opt/rigforce/shared
certbot='certbot/certbot:v5.10.0@sha256:c5698da859429ccee0fcc299a8000368198222d1f9e789ab6e388b491e8ce06d'
nginx='nginx:1.30.6-alpine@sha256:901e593c95dc85f5a729f5765516321366ef4ac401821431d408897e95287d0a'
[[ $ENVIRONMENT =~ ^(staging|demo)$ && $DOMAIN_NAME =~ ^[a-z0-9.-]+$ ]] || exit 1
exec 9>/opt/rigforce/shared/deploy.lock
flock -n 9 || { echo 'A deployment or certificate operation is running.' >&2; exit 1; }
mode=${1:-}
if [[ $mode == issue || $mode == test-issuance ]]; then
  email=${2:?Supply the ACME contact email}
  release=$(realpath -e "${3:?Supply the release directory printed by --prepare}")
  [[ $release == /opt/rigforce/releases/* && -f $release/infra/nginx/acme.conf ]] || exit 1
  [[ $email == *@*.* && $email != -* ]] || exit 1
  # Do not replace an existing lineage or stop the running website automatically.
  [[ ! -e $shared/letsencrypt/live/$DOMAIN_NAME ]] || { echo 'Certificate already exists; use renew.' >&2; exit 1; }
  challenge="rigforce-${ENVIRONMENT}-acme"
  docker run -d --rm --name "$challenge" -p 80:80 \
    -v "$release/infra/nginx/acme.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "$shared/acme:/var/www/acme:ro" "$nginx" >/dev/null
  trap 'docker stop "$challenge" >/dev/null 2>&1 || true' EXIT
  extra=()
  [[ $mode != test-issuance ]] || extra+=(--test-cert --config-dir /etc/letsencrypt-test)
  docker run --rm -v "$shared/letsencrypt:/etc/letsencrypt" \
    -v "$shared/letsencrypt-test:/etc/letsencrypt-test" -v "$shared/acme:/var/www/acme" \
    "$certbot" certonly --webroot -w /var/www/acme --non-interactive --agree-tos \
    --email "$email" --cert-name "$DOMAIN_NAME" -d "$DOMAIN_NAME" "${extra[@]}"
elif [[ $mode == renew || $mode == test-renewal ]]; then
  release=$(realpath -e /opt/rigforce/current)
  [[ $release == /opt/rigforce/releases/* ]] || exit 1
  extra=()
  [[ $mode != test-renewal ]] || extra+=(--dry-run)
  docker run --rm -v "$shared/letsencrypt:/etc/letsencrypt" -v "$shared/acme:/var/www/acme" \
    "$certbot" renew --non-interactive "${extra[@]}"
  docker compose --project-name "rigforce-$ENVIRONMENT" --env-file "$release/compose.env" \
    -f "$release/compose.deploy.yaml" -f "$release/compose.aws.yaml" exec -T nginx nginx -t
  docker compose --project-name "rigforce-$ENVIRONMENT" --env-file "$release/compose.env" \
    -f "$release/compose.deploy.yaml" -f "$release/compose.aws.yaml" exec -T nginx nginx -s reload
else
  echo 'Usage: certificate.sh issue|test-issuance EMAIL PREPARED_RELEASE_DIR | renew | test-renewal' >&2
  exit 1
fi
