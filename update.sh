#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Pulling latest..."
git pull --rebase origin master

echo "==> Deploying Pages..."
wrangler pages deploy public/ --project-name=shame --commit-dirty=true

echo "==> Deploying Worker..."
cd worker && wrangler deploy

echo "==> Done! Site live at https://shame.skogai.se"
