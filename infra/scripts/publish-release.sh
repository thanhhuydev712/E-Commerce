#!/usr/bin/env bash
# Invoked only by the protected release job after CI. No runtime secrets are read.
set -Eeuo pipefail
[[ $DEPLOY_ENVIRONMENT =~ ^(staging|demo)$ && $GITHUB_SHA =~ ^[a-f0-9]{40}$ ]] || exit 1
[[ $MIGRATION_POLICY =~ ^(none|backward-compatible)$ ]] || { echo 'Maintenance migrations require an operator plan.' >&2; exit 1; }
[[ $API_REPOSITORY_URI =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9/_.-]+$ ]] || exit 1
[[ $FRONT_REPOSITORY_URI =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9/_.-]+$ ]] || exit 1
key="releases/$DEPLOY_ENVIRONMENT/$GITHUB_SHA/release.tar.gz"
# Immutable release identity: never replace an existing successful bundle.
if aws s3api head-object --bucket "$RELEASE_BUCKET" --key "$key" >/dev/null 2>&1; then
  echo 'Release already exists. Use Deploy AWS with its recorded version/checksum.' >&2
  exit 1
fi
registry=${API_REPOSITORY_URI%%/*}
[[ ${FRONT_REPOSITORY_URI%%/*} == "$registry" ]] || exit 1
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry"
fingerprint=$(node infra/scripts/package-release.mjs --fingerprint)
build_image() {
  local repository=$1 tag=$2 context=$3 target=$4 digest
  digest=$(aws ecr list-images --repository-name "${repository#*/}" --filter tagStatus=TAGGED \
    --query "imageIds[?imageTag=='$tag'].imageDigest | [0]" --output text)
  if [[ $digest == None || $digest == null || -z $digest ]]; then
    docker build --platform linux/amd64 --target "$target" --label "org.opencontainers.image.revision=$GITHUB_SHA" \
      --label "dev.rigforce.schema-fingerprint=$fingerprint" -t "$repository:$tag" "$context"
    docker push "$repository:$tag"
    digest=$(aws ecr describe-images --repository-name "${repository#*/}" --image-ids "imageTag=$tag" --query 'imageDetails[0].imageDigest' --output text)
  fi
  [[ $digest =~ ^sha256:[a-f0-9]{64}$ ]] || exit 1
  printf '%s@%s' "$repository" "$digest" > "$RUNNER_TEMP/$target.image"
}
build_image "$API_REPOSITORY_URI" "api-$GITHUB_SHA" api runtime
api=$(cat "$RUNNER_TEMP/runtime.image")
build_image "$API_REPOSITORY_URI" "tools-$GITHUB_SHA" api tools
tools=$(cat "$RUNNER_TEMP/tools.image")
build_image "$FRONT_REPOSITORY_URI" "front-$GITHUB_SHA" front runtime
front=$(cat "$RUNNER_TEMP/runtime.image")
node infra/scripts/package-release.mjs --output release-output --api "$api" --front "$front" --tools "$tools" --policy "$MIGRATION_POLICY"
sha=$(cat release-output/release.sha256)
aws s3api put-object --bucket "$RELEASE_BUCKET" --key "$key" --body release-output/release.tar.gz \
  --content-type application/gzip --metadata "sha256=$sha,commit=$GITHUB_SHA" > "$RUNNER_TEMP/release-upload.json"
version=$(jq -er '.VersionId | select(. != "null" and . != null)' "$RUNNER_TEMP/release-upload.json")
{
  printf 'key=%s\nversion=%s\nsha256=%s\n' "$key" "$version" "$sha"
} >> "$GITHUB_OUTPUT"
{
  printf 'Release %s\n\n- Environment: %s\n- Key: %s\n- VersionId: %s\n- SHA256: %s\n' "$GITHUB_SHA" "$DEPLOY_ENVIRONMENT" "$key" "$version" "$sha"
  printf '\n- API image: %s\n- Frontend image: %s\n- Tools image: %s\n' "$api" "$front" "$tools"
  printf '\nDeployment is a separate step; this job only published immutable images and a versioned bundle.\n'
} >> "$GITHUB_STEP_SUMMARY"
