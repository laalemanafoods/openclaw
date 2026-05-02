#!/bin/sh
# PaaS platforms (Railway, Koyeb) may inject HOME=/data (read-only).
# Override to /app/data which is writable and owned by node.
export HOME=/app/data
export OPENCLAW_HOME=/app/data
export OPENCLAW_STATE_DIR=/app/data

# Ensure writable directories exist.
mkdir -p /app/data/agents/main/agent 2>/dev/null || true

# Always write the default openclaw.json so model/provider config stays current.
if [ -f /app/config/openclaw.default.json ]; then
  cp /app/config/openclaw.default.json /app/data/openclaw.json
fi

# Write auth-profiles.json for the main agent using the GEMINI_API_KEY env var.
# This runs every start so the key stays in sync with the Koyeb Variable.
if [ -n "$GEMINI_API_KEY" ]; then
  cat > /app/data/agents/main/agent/auth-profiles.json << AUTHEOF
{
  "version": 1,
  "profiles": {
    "google-1": {
      "type": "api_key",
      "provider": "google",
      "key": "$GEMINI_API_KEY"
    }
  }
}
AUTHEOF
fi

exec "$@"
