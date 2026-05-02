#!/bin/sh
# PaaS platforms (Railway, Koyeb) may inject HOME=/data (read-only).
# Override to /app/data which is writable and owned by node.
export HOME=/app/data
export OPENCLAW_HOME=/app/data
export OPENCLAW_STATE_DIR=/app/data

mkdir -p /app/data 2>/dev/null || true

# Write default config only on first run (don't overwrite existing config).
if [ ! -f /app/data/openclaw.json ] && [ -f /app/config/openclaw.default.json ]; then
  cp /app/config/openclaw.default.json /app/data/openclaw.json
fi

exec "$@"
