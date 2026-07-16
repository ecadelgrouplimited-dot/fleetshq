#!/usr/bin/env bash
# Redeploy FLEET.HQ (fleetshq.com) on the VPS after pushing to GitHub.
# Usage (on the VPS):  bash /var/www/fleetshq/scripts/deploy.sh
set -e
cd /var/www/fleetshq
echo "→ Pulling latest…"
# npm can rewrite the lockfile during install; discard any such drift so ff-only pulls succeed.
git checkout -- package-lock.json package.json 2>/dev/null || true
git pull --ff-only
echo "→ Installing dependencies…"
# npm ci is deterministic (installs exactly from the lockfile) and does not mutate it.
npm ci --no-audit --no-fund
echo "→ Applying migrations…"
npx prisma migrate deploy
npx prisma generate >/dev/null
echo "→ Restarting app…"
pm2 restart fleetshq --update-env
pm2 save >/dev/null
echo "✓ Deployed $(git rev-parse --short HEAD) — $(date)"
