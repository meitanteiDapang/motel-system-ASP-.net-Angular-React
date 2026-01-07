#!/usr/bin/env bash
set -euo pipefail

# ---- config (edit if you want) ----
CONTAINER_NAME="${CONTAINER_NAME:-pg-local}"
IMAGE="${IMAGE:-postgres:16}"
PORT="${PORT:-5432}"

POSTGRES_USER="${POSTGRES_USER:-app}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-app_pw}"
POSTGRES_DB="${POSTGRES_DB:-appdb}"

VOLUME_NAME="${VOLUME_NAME:-pgdata-local}"
# -----------------------------------

echo "==> Ensuring Docker is available..."
docker version >/dev/null

# Create volume if missing (no-op if exists)
docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

# If container exists, start it; else create it
if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "==> Container exists: $CONTAINER_NAME"
  if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "==> Already running."
  else
    echo "==> Starting..."
    docker start "$CONTAINER_NAME" >/dev/null
  fi
else
  echo "==> Creating and starting: $CONTAINER_NAME"
  docker run --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "$PORT:5432" \
    -v "$VOLUME_NAME:/var/lib/postgresql/data" \
    -d "$IMAGE" >/dev/null
fi

echo "==> Waiting for Postgres to be ready..."
# pg_isready exists inside the postgres image
until docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 0.5
done

echo "==> Ready!"
echo "Container : $CONTAINER_NAME"
echo "DB        : $POSTGRES_DB"
echo "User      : $POSTGRES_USER"
echo "Port      : localhost:$PORT"
echo "Conn str  : postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$PORT/$POSTGRES_DB"
