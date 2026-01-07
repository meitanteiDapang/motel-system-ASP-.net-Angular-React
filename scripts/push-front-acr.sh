#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=../setup.sh
source "$ROOT_DIR/setup.sh"

IMAGE_NAME="${IMAGE_NAME:-front}"
TAG="${TAG:-dev-$(git rev-parse --short HEAD)}"

ACR_LOGIN_SERVER="$(az acr show -n "$ACR_NAME" --query loginServer -o tsv)"

echo "ACR_NAME=$ACR_NAME"
echo "ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "IMAGE=$ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG"

# Login to ACR
az acr login -n "$ACR_NAME"

# Build & push
docker build -t "$ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG" ./front
docker push "$ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG"

# Verify tags
echo "Pushed. Available tags:"
az acr repository show-tags -n "$ACR_NAME" --repository "$IMAGE_NAME" -o table

echo "DONE: $ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG"
