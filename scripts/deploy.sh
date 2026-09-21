#!/usr/bin/env bash
# Redeploy FLEET.HQ (fleetshq.com) on the VPS.
#
# Usage (as root, on the VPS):
#   bash /var/www/fleetshq/scripts/deploy.sh                    # pull from origin
#   bash /var/www/fleetshq/scripts/deploy.sh /tmp/x.bundle      # apply a git bundle
#
# Why it looks like this:
#   * The app is a systemd unit (fleetshq.service), NOT pm2 — pm2 is not
#     installed on this box.
#   * /var/www/fleetshq is owned by the `fleets` user, which has a nologin
#     shell. `su - fleets` fails; `runuser -u fleets` is the way in. Every
#     repo/npm/prisma command runs as `fleets` so nothing ends up root-owned
#     (root-owned files in the tree break the service, which runs as fleets).
#   * `fleets` has no $HOME of its own, so HOME and the npm cache are pointed
#     somewhere writable.
#   * The VPS has no working GitHub credentials at present (the deploy key and
#     the github-256 ssh alias are both gone), so the bundle path is the
#     reliable route until a new read-only deploy key is installed:
#        local:  git bundle create out.bundle <vps-head>..main
#        local:  scp out.bundle root@<vps>:/tmp/
#        vps:    bash scripts/deploy.sh /tmp/out.bundle
set -euo pipefail

APP=/var/www/fleetshq
SERVICE=fleetshq
BUNDLE="${1:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "✗ run as root (it drops to the fleets user itself)" >&2
  exit 1
fi

# Run a command as the app's owner, with a writable HOME and npm cache.
as_fleets() {
  runuser -u fleets -- env HOME="$APP" npm_config_cache=/tmp/npm-fleets "$@"
}
mkdir -p /tmp/npm-fleets && chown fleets:fleets /tmp/npm-fleets

cd "$APP"
BEFORE=$(as_fleets git rev-parse HEAD)
LOCK_BEFORE=$(md5sum package-lock.json | cut -d' ' -f1)

# Surface uncommitted drift rather than silently discarding it. server.js in
# particular carries a hotfix (bind to 127.0.0.1) that is not yet in the repo —
# clobbering it would expose the Node port publicly.
DIRTY=$(as_fleets git status --porcelain --untracked-files=no || true)
if [ -n "$DIRTY" ]; then
  echo "! uncommitted changes in the working tree (left untouched):"
  echo "$DIRTY" | sed 's/^/    /'
fi

echo "→ Updating source…"
if [ -n "$BUNDLE" ]; then
  [ -f "$BUNDLE" ] || { echo "✗ no such bundle: $BUNDLE" >&2; exit 1; }
  chmod 644 "$BUNDLE"
  as_fleets git bundle verify "$BUNDLE"
  as_fleets git pull --ff-only "$BUNDLE" main
else
  as_fleets git pull --ff-only
fi

AFTER=$(as_fleets git rev-parse HEAD)
if [ "$BEFORE" = "$AFTER" ]; then
  echo "  already at $(echo "$AFTER" | cut -c1-7) — nothing new"
fi

# Only reinstall when the lockfile actually moved; npm ci wipes and rebuilds
# node_modules, which is slow and needlessly risky on a view-only change.
if [ "$(md5sum package-lock.json | cut -d' ' -f1)" != "$LOCK_BEFORE" ]; then
  echo "→ Lockfile changed — installing dependencies…"
  as_fleets npm ci --no-audit --no-fund
else
  echo "→ Dependencies unchanged — skipping npm ci"
fi

echo "→ Applying migrations…"
as_fleets npx prisma migrate deploy
as_fleets npx prisma generate >/dev/null

echo "→ Restarting $SERVICE…"
systemctl restart "$SERVICE"
sleep 8

STATE=$(systemctl is-active "$SERVICE" || true)
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/login || echo 000)
echo "  service: $STATE   local HTTP: $CODE"

if [ "$STATE" != "active" ] || [ "$CODE" != "200" ]; then
  echo "✗ deploy unhealthy — recent logs:" >&2
  journalctl -u "$SERVICE" --since '1 minute ago' --no-pager | tail -20 >&2
  echo "  roll back with: runuser -u fleets -- git -C $APP reset --hard $BEFORE && systemctl restart $SERVICE" >&2
  exit 1
fi

echo "✓ Deployed $(echo "$AFTER" | cut -c1-7) — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
