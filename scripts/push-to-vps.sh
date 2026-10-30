#!/usr/bin/env bash
# Push local main branch to the Fleet HQ VPS (root@72.62.185.212) and run deploy.sh
set -euo pipefail

VPS_HOST="${VPS_HOST:-root@72.62.185.212}"
BUNDLE="/tmp/fleetshq-deploy.bundle"
BASE_COMMIT="6f1faa6"

echo "1. Creating git bundle ($BASE_COMMIT..main)..."
git bundle create "$BUNDLE" "${BASE_COMMIT}..main"

echo "2. Uploading bundle to $VPS_HOST:$BUNDLE..."
scp -o ConnectTimeout=15 "$BUNDLE" "$VPS_HOST:$BUNDLE"

echo "3. Applying update and restarting fleetshq.service on VPS..."
ssh -o ConnectTimeout=15 "$VPS_HOST" "
  set -euo pipefail
  runuser -u fleets -- git -C /var/www/fleetshq remote set-url origin https://github.com/ecadelgrouplimited-dot/fleetshq.git || true
  runuser -u fleets -- git -C /var/www/fleetshq checkout -- server.js || true
  bash /var/www/fleetshq/scripts/deploy.sh $BUNDLE
"

echo "✓ VPS deployment complete!"
