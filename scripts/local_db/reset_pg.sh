#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-pg-local}"
VOLUME_NAME="${VOLUME_NAME:-pgdata-local}"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker volume rm "$VOLUME_NAME" >/dev/null 2>&1 || true

echo "Reset done: container + volume deleted."
