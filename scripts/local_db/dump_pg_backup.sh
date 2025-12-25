#!/usr/bin/env bash
docker exec -e PGPASSWORD=app_pw pg-local \
  pg_dump --host localhost --port 5432 --username app --format=plain --no-owner --no-privileges appdb \
  > backups/appdb.sql
