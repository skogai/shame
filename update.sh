#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# CLOUDFLARE_API_TOKEN in the environment may be a scoped token that lacks
# Pages write permissions. Unset it so wrangler falls back to the stored
# OAuth token from `wrangler login`.
unset CLOUDFLARE_API_TOKEN

echo "==> Pulling latest..."
git pull --rebase origin master

echo "==> Deploying Pages..."
wrangler pages deploy public/ --project-name=shame --commit-dirty=true

echo "==> Deploying Worker..."
wrangler deploy -c worker/wrangler.toml

echo ""
echo "==> Seeding KV from local JSON..."
echo "    (requires ADMIN_PASSWORD env var or will prompt)"
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -rsp "Admin password: " ADMIN_PASSWORD
  echo
fi
WORKER="https://shame.api.skogai.se"
for k in squad disses shame match; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$WORKER/data/$k" \
    -H "authorization: Bearer $ADMIN_PASSWORD" \
    -H "content-type: application/json" \
    --data @public/data/$k.json)
  echo "    $k → $STATUS"
done

echo ""
echo "==> Done! Site live at https://shame.skogai.se"
