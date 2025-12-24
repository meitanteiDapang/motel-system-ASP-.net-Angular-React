#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/web"
echo "Starting Vite dev server on http://localhost:5173 (proxy /api -> 8080) ..."
exec npm run dev -- --host --port 5173
