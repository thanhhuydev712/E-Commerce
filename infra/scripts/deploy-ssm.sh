#!/usr/bin/env bash
set -Eeuo pipefail
[[ $DEPLOY_ENVIRONMENT =~ ^(staging|demo)$ ]] || exit 1
[[ $RELEASE_KEY =~ ^releases/$DEPLOY_ENVIRONMENT/[a-f0-9]{40}/release\.tar\.gz$ ]] || exit 1
[[ $RELEASE_SHA256 =~ ^[a-f0-9]{64}$ && $INSTANCE_ID =~ ^i-[a-f0-9]+$ ]] || exit 1
[[ $RELEASE_VERSION != null && $RELEASE_VERSION =~ ^[A-Za-z0-9._~+/=-]{1,1024}$ ]] || exit 1
parameters=$(jq -cn --arg key "$RELEASE_KEY" --arg version "$RELEASE_VERSION" --arg sha "$RELEASE_SHA256" '{ReleaseKey:[$key],ReleaseVersion:[$version],ReleaseSha256:[$sha]}')
command_id=$(aws ssm send-command --document-name "$RELEASE_DOCUMENT" --instance-ids "$INSTANCE_ID" \
  --parameters "$parameters" --timeout-seconds 120 --query 'Command.CommandId' --output text)
[[ $command_id =~ ^[a-f0-9-]{36}$ ]] || exit 1
printf 'SSM command %s\n' "$command_id"
status=Pending
for ((attempt=0; attempt<150; attempt++)); do
  status=$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$INSTANCE_ID" --query Status --output text 2>/dev/null || printf 'Pending')
  case "$status" in
    Success) printf 'Deployment succeeded: %s\n' "$command_id"; exit 0 ;;
    Pending|InProgress|Delayed) sleep 10 ;;
    *) printf 'Deployment failed: %s; inspect the sanitized host deploy log. Command: %s\n' "$status" "$command_id" >&2; exit 1 ;;
  esac
done
echo 'Polling timed out. The host command may still be running; inspect SSM before retrying.' >&2
exit 1
