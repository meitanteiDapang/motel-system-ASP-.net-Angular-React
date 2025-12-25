#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_DIR="$ROOT_DIR/sql"

CONTAINER_NAME="${CONTAINER_NAME:-pg-local}"
DB_USER="${DB_USER:-app}"
DB_PASSWORD="${DB_PASSWORD:-app_pw}"
DB_NAME="${DB_NAME:-appdb}"

shopt -s nullglob
sql_files=("$SQL_DIR"/*.sql)
shopt -u nullglob

if [ ${#sql_files[@]} -eq 0 ]; then
  echo "No .sql files found in $SQL_DIR"
  exit 0
fi

for file in "${sql_files[@]}"; do
  echo "Running $(basename "$file")"
  docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
    psql --host localhost --port 5432 --username "$DB_USER" --dbname "$DB_NAME" \
    --set ON_ERROR_STOP=1 \
    < "$file"
done
