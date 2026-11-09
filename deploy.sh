#!/bin/sh
# Production deploy entrypoint on Ubuntu.
# Delegates to scripts/deploy-prod.sh (uses .env; requires NEXT_PUBLIC_API_URL).
set -eu
cd "$(dirname "$0")"
exec ./scripts/deploy-prod.sh "$@"
