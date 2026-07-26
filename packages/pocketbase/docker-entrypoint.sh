#!/bin/sh
set -eu

chown -R thiscord:thiscord /app/pb_data

set -- pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=/app/pb_data \
  --hooksDir=/app/pb_hooks \
  --migrationsDir=/app/pb_migrations \
  --dev="${POCKETBASE_DEV:-false}"

if [ -n "${POCKETBASE_ORIGINS:-}" ]; then
  set -- "$@" --origins="${POCKETBASE_ORIGINS}"
fi

exec su-exec thiscord "$@"
