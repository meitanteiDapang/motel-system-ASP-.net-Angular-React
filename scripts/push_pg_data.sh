#!/usr/bin/env bash
set -euo pipefail

# Restore a SQL backup into the Postgres pod deployed by Helm.
# Usage: ./scripts/restore_pg_backup.sh [path/to/backup.sql]
# Defaults: backups/appdb.sql, namespace=ecommerce, release=ecommerce, user=app, db=appdb, password=app_pw

BACKUP_FILE="${1:-backups/appdb.sql}"
NAMESPACE="${NAMESPACE:-ecommerce}"
RELEASE="${RELEASE:-ecommerce}"
DB_USER="${DB_USER:-app}"
DB_PASSWORD="${DB_PASSWORD:-app_pw}"
DB_NAME="${DB_NAME:-appdb}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "==> Locating Postgres pod in namespace '$NAMESPACE' (release '$RELEASE')..."
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l "app=${RELEASE}-postgres" -o jsonpath='{.items[0].metadata.name}')
if [[ -z "$POD_NAME" ]]; then
  echo "Postgres pod not found (label app=${RELEASE}-postgres)" >&2
  exit 1
fi
echo "Found pod: $POD_NAME"

echo "==> Copying backup to pod..."
kubectl cp "$BACKUP_FILE" "$NAMESPACE/$POD_NAME":/tmp/appdb.sql

echo "==> Applying backup..."
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- env PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/appdb.sql

echo "Done."
