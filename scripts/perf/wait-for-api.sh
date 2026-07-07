#!/usr/bin/env bash
set -euo pipefail

BASE="${URMS_API_BASE:-http://127.0.0.1:3000/health}"
MAX_ATTEMPTS="${URMS_API_WAIT_ATTEMPTS:-60}"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  if curl -sf "$BASE" >/dev/null; then
    echo "API ready: $BASE (attempt $attempt)"
    exit 0
  fi
  sleep 1
done

echo "API not ready after ${MAX_ATTEMPTS}s: $BASE" >&2
exit 1
