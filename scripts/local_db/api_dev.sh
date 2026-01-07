#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/api"
echo "Starting API on http://localhost:8080 ..."
ASPNETCORE_URLS="http://0.0.0.0:8080" exec dotnet watch run
