#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-pg-local}"
DB_USER="${DB_USER:-app}"
DB_PASSWORD="${DB_PASSWORD:-app_pw}"
DB_NAME="${DB_NAME:-appdb}"

docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
  psql --host localhost --port 5432 --username "$DB_USER" --dbname "$DB_NAME" \
  --set ON_ERROR_STOP=1 \
  --command "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
