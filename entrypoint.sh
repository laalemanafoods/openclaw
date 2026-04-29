#!/bin/sh
# Railway injects HOME=/data (read-only). Override before starting the app.
export HOME=/app/data
export OPENCLAW_HOME=/app/data
export OPENCLAW_STATE_DIR=/app/data
mkdir -p /app/data/.openclaw 2>/dev/null || true
exec "$@"
