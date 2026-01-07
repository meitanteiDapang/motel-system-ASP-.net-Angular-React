#!/usr/bin/env bash
set -euo pipefail
CONTAINER_NAME="${CONTAINER_NAME:-pg-local}"

docker stop "$CONTAINER_NAME" >/dev/null
echo "Stopped: $CONTAINER_NAME (data preserved)"
