#!/usr/bin/env bash
set -euo pipefail

# ---- config (you can override via env vars) ----
NAMESPACE="${NAMESPACE:-ecommerce}"
RELEASE="${RELEASE:-ecommerce}"
CHART_PATH="${CHART_PATH:-./helm/ecommerce}"

# default tag: dev-<short git sha>
IMAGE_TAG="${IMAGE_TAG:-dev-$(git rev-parse --short HEAD)}"

echo "NAMESPACE=$NAMESPACE"
echo "RELEASE=$RELEASE"
echo "CHART_PATH=$CHART_PATH"
echo "IMAGE_TAG=$IMAGE_TAG"

helm upgrade --install "$RELEASE" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set "web.image.tag=$IMAGE_TAG"

echo "DONE: helm deployed $RELEASE to namespace $NAMESPACE with web.image.tag=$IMAGE_TAG"
