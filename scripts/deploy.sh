#!/usr/bin/env bash
# Redeploy 256 Logistics Compliance Hub on the VPS after pushing to GitHub.
# Usage (on the VPS):  bash /var/www/256logisticsltd/scripts/deploy.sh
set -e
cd /var/www/256logisticsltd
echo "→ Pulling latest…"
git pull --ff-only
echo "→ Installing dependencies…"
npm install --no-audit --no-fund
echo "→ Applying migrations…"
npx prisma migrate deploy
npx prisma generate >/dev/null
echo "→ Restarting app…"
pm2 restart 256logistics --update-env
pm2 save >/dev/null
echo "✓ Deployed $(git rev-parse --short HEAD) — $(date)"
