#!/usr/bin/env bash
# One-shot D1 setup for shame.skogai.se match history.
#
# Provisions the D1 database, wires its id into worker/wrangler.toml, applies
# migrations, deploys the API Worker, and seeds the current match.json.
#
# Requires: wrangler (npm i -g wrangler) + a logged-in session (wrangler login).
# Safe to re-run — d1 create is skipped if the database already exists.
set -euo pipefail

cd "$(dirname "$0")"

DB_NAME="shame-db"
TOML="worker/wrangler.toml"
WORKER_URL="https://shame.api.skogai.se"

command -v wrangler >/dev/null 2>&1 || { echo "!! wrangler not found. npm i -g wrangler && wrangler login"; exit 1; }

echo "==> Ensuring D1 database '$DB_NAME' exists..."
wrangler d1 create "$DB_NAME" 2>/dev/null || echo "    (already exists — continuing)"

echo "==> Resolving database_id..."
DB_ID=""
if command -v jq >/dev/null 2>&1; then
  DB_ID=$(wrangler d1 list --json 2>/dev/null | jq -r ".[] | select(.name==\"$DB_NAME\") | .uuid" | head -n1)
fi
if [[ -z "$DB_ID" ]]; then
  echo "!! Could not auto-detect database_id (jq missing or unexpected output)."
  echo "   Run: wrangler d1 list   then paste the uuid for '$DB_NAME' here:"
  read -rp "   database_id: " DB_ID
fi
[[ -n "$DB_ID" ]] || { echo "!! no database_id; aborting"; exit 1; }

echo "==> Enabling D1 binding + writing database_id $DB_ID into $TOML..."
# Uncomment the (committed-as-disabled) d1 block, then set the id. Idempotent:
# if the block is already active, the uncomment passes are no-ops.
sed -i.bak -E \
  -e 's/^# (\[\[d1_databases\]\])/\1/' \
  -e 's/^# (binding = "SHAME_DB")/\1/' \
  -e 's/^# (database_name = "shame-db")/\1/' \
  -e 's/^# (database_id = ).*/\1""/' \
  "$TOML"
sed -i.bak -E "s|^(database_id = )\".*\"|\1\"$DB_ID\"|" "$TOML"
rm -f "$TOML.bak"

echo "==> Applying migrations (remote)..."
wrangler d1 migrations apply "$DB_NAME" --remote -c "$TOML"

echo "==> Deploying API Worker..."
wrangler deploy -c "$TOML"

echo "==> Seeding current match.json into D1..."
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -rsp "    Admin password: " ADMIN_PASSWORD; echo
fi
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$WORKER_URL/data/match" \
  -H "authorization: Bearer $ADMIN_PASSWORD" \
  -H "content-type: application/json" \
  --data @public/data/match.json)
echo "    match -> $STATUS"

echo ""
echo "==> Done. Verify:"
echo "    curl $WORKER_URL/matches"
echo "    curl $WORKER_URL/trends"
