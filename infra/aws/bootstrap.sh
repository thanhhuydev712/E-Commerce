#!/usr/bin/env bash
# Amazon Linux 2023 x86_64 only. Run by pinned CloudFormation UserData as root.
# Installs host tooling/helpers; never creates an app release, seed, env secret or certificate.
set -Eeuo pipefail
umask 077

die() { printf '%s\n' "Bootstrap failed: $*" >&2; exit 1; }
[[ "$EUID" -eq 0 ]] || die 'root is required'
[[ "$(uname -m)" == x86_64 ]] || die 'only tested contract is x86_64'
# shellcheck source=/dev/null
source /etc/os-release
[[ "$ID" == amzn && "$VERSION_ID" == 2023 ]] || die 'Amazon Linux 2023 is required'

required=(AWS_REGION PROJECT_NAME ENVIRONMENT DOMAIN_NAME RELEASE_BUCKET
  RUNTIME_PARAMETER_NAME MIGRATION_PARAMETER_NAME LOG_GROUP_PREFIX
  COMPOSE_VERSION COMPOSE_SHA256 RDS_CA_SHA256 BOOTSTRAP_BUNDLE_DIR)
for variable in "${required[@]}"; do
  [[ -n "${!variable:-}" ]] || die "missing nonsecret setting $variable"
done
[[ "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]{2,19}$ ]] || die 'invalid project name'
[[ "$ENVIRONMENT" =~ ^(staging|demo)$ ]] || die 'invalid environment'
[[ "$AWS_REGION" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]] || die 'invalid AWS region'
[[ "$DOMAIN_NAME" =~ ^[a-z0-9.-]+$ ]] || die 'invalid domain'
[[ "$COMPOSE_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die 'invalid Compose version'
[[ "$COMPOSE_SHA256" =~ ^[a-f0-9]{64}$ ]] || die 'invalid Compose checksum'
[[ "$RDS_CA_SHA256" =~ ^[a-f0-9]{64}$ ]] || die 'invalid RDS CA checksum'
[[ "$RUNTIME_PARAMETER_NAME" == "/$PROJECT_NAME/$ENVIRONMENT/runtime-env" ]] || die 'runtime parameter path mismatch'
[[ "$MIGRATION_PARAMETER_NAME" == "/$PROJECT_NAME/$ENVIRONMENT/migration-env" ]] || die 'migration parameter path mismatch'
[[ "$LOG_GROUP_PREFIX" == "/$PROJECT_NAME/$ENVIRONMENT" ]] || die 'log group path mismatch'

export AWS_DEFAULT_REGION="$AWS_REGION" AWS_PAGER=''
# AL2023 pins repository snapshots through the chosen AMI/release version. Do not
# update --releasever=latest here: AMI/package upgrades need separate review.
dnf install -y docker awscli2 amazon-ssm-agent amazon-cloudwatch-agent openssl \
  jq python3 tar gzip util-linux logrotate ca-certificates
command -v curl >/dev/null || die 'AL2023 standard AMI must include curl'
install -d -o root -g root -m 0750 /opt/rigforce /opt/rigforce/bin \
  /opt/rigforce/releases /opt/rigforce/shared /opt/rigforce/shared/certs \
  /opt/rigforce/shared/letsencrypt /opt/rigforce/shared/acme \
  /opt/rigforce/shared/logs /var/log/rigforce
# These two directories contain public CA/challenge data and are bind-mounted
# into non-root readers. Certificate private keys remain under root-only paths.
chmod 0755 /opt/rigforce/shared/certs /opt/rigforce/shared/acme

# Never add ec2-user/ssm-user to docker group: that group is equivalent to root.
for file in apply-release.sh fetch-env.sh; do
  [[ -f "$BOOTSTRAP_BUNDLE_DIR/$file" && ! -L "$BOOTSTRAP_BUNDLE_DIR/$file" ]] || die "missing helper $file"
  bash -n "$BOOTSTRAP_BUNDLE_DIR/$file"
  install -o root -g root -m 0750 "$BOOTSTRAP_BUNDLE_DIR/$file" "/opt/rigforce/bin/$file"
done
install -o root -g root -m 0750 "${BASH_SOURCE[0]}" /opt/rigforce/bin/bootstrap.sh

task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
curl --fail --silent --show-error --location --retry 5 \
  "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64" \
  --output "$task_tmp/docker-compose"
printf '%s  %s\n' "$COMPOSE_SHA256" "$task_tmp/docker-compose" | sha256sum --check --status
install -d -m 0755 /usr/local/lib/docker/cli-plugins
install -o root -g root -m 0755 "$task_tmp/docker-compose" /usr/local/lib/docker/cli-plugins/docker-compose
curl --fail --silent --show-error --location --retry 5 \
  'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem' \
  --output "$task_tmp/rds-global-bundle.pem"
printf '%s  %s\n' "$RDS_CA_SHA256" "$task_tmp/rds-global-bundle.pem" | sha256sum --check --status
install -o root -g root -m 0644 "$task_tmp/rds-global-bundle.pem" /opt/rigforce/shared/certs/rds-global-bundle.pem

# The file contains identifiers only. Never append DATABASE_URL/JWT/token values.
host_config=/opt/rigforce/shared/host.env
{
  printf 'AWS_REGION=%q\n' "$AWS_REGION"
  printf 'PROJECT_NAME=%q\n' "$PROJECT_NAME"
  printf 'ENVIRONMENT=%q\n' "$ENVIRONMENT"
  printf 'DOMAIN_NAME=%q\n' "$DOMAIN_NAME"
  printf 'RELEASE_BUCKET=%q\n' "$RELEASE_BUCKET"
  printf 'RUNTIME_PARAMETER_NAME=%q\n' "$RUNTIME_PARAMETER_NAME"
  printf 'MIGRATION_PARAMETER_NAME=%q\n' "$MIGRATION_PARAMETER_NAME"
  printf 'LOG_GROUP_PREFIX=%q\n' "$LOG_GROUP_PREFIX"
} > "$task_tmp/host.env"
install -o root -g root -m 0600 "$task_tmp/host.env" "$host_config"

# Keep local log rotation by default. Production Compose awslogs override sends
# app streams directly; the agent below sends host logs and memory/disk metrics.
install -d -m 0755 /etc/docker
if [[ ! -e /etc/docker/daemon.json ]]; then
  cat > /etc/docker/daemon.json <<'JSON'
{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"},"live-restore":true}
JSON
fi
systemctl enable --now docker amazon-ssm-agent
installed_compose=$(docker compose version --short)
[[ "${installed_compose#v}" == "${COMPOSE_VERSION#v}" ]] || die 'Compose version mismatch'
ssm_agent_version=$(amazon-ssm-agent -version | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
python3 - "$ssm_agent_version" <<'PY'
import sys
installed = tuple(map(int, sys.argv[1].split('.')))
if installed < (3, 3, 2746, 0):
    raise SystemExit('SSM Agent >=3.3.2746.0 required for ENV_VAR interpolation; choose a reviewed newer AL2023 AMI/snapshot')
PY
docker info --format '{{.ServerVersion}}'

cat > /opt/aws/amazon-cloudwatch-agent/etc/rigforce.json <<JSON
{
  "agent": {"metrics_collection_interval": 60, "run_as_user": "root", "region": "$AWS_REGION"},
  "metrics": {
    "namespace": "$PROJECT_NAME/$ENVIRONMENT/Host",
    "append_dimensions": {"InstanceId": "\${aws:InstanceId}"},
    "metrics_collected": {
      "mem": {"measurement": ["mem_used_percent"]},
      "disk": {"measurement": ["used_percent"], "resources": ["/"], "drop_device": true}
    },
    "aggregation_dimensions": [["InstanceId"], ["InstanceId", "path"]]
  },
  "logs": {
    "logs_collected": {"files": {"collect_list": [
      {"file_path": "/var/log/rigforce-bootstrap.log", "log_group_name": "$LOG_GROUP_PREFIX/host", "log_stream_name": "{instance_id}/bootstrap"},
      {"file_path": "/var/log/rigforce/deploy.log", "log_group_name": "$LOG_GROUP_PREFIX/host", "log_stream_name": "{instance_id}/deploy"},
      {"file_path": "/var/log/amazon/ssm/amazon-ssm-agent.log", "log_group_name": "$LOG_GROUP_PREFIX/host", "log_stream_name": "{instance_id}/ssm-agent"}
    ]}},
    "force_flush_interval": 5
  }
}
JSON
chmod 0600 /opt/aws/amazon-cloudwatch-agent/etc/rigforce.json
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/rigforce.json
systemctl enable amazon-cloudwatch-agent

cat > /etc/logrotate.d/rigforce <<'CONF'
/var/log/rigforce-bootstrap.log /var/log/rigforce/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
    su root root
}
CONF

# A host reboot starts Docker containers that were already deployed with a restart
# policy. Bootstrap does not invent a release or start services without certificates.
touch /opt/rigforce/shared/bootstrap.complete
chmod 0600 /opt/rigforce/shared/bootstrap.complete
printf '%s\n' 'Host bootstrap complete; application release, runtime secrets and DNS/TLS still require operator setup.'
