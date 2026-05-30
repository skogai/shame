#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Pulling latest..."
git pull --rebase origin master

echo "==> Deploying Pages..."
wrangler pages deploy public/ --project-name=shame --commit-dirty=true

echo "==> Deploying Worker..."
wrangler deploy -c worker/wrangler.toml

echo "==> Done! Site live at https://shame.skogai.se"
