# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`shame.skogai.se` — a static React site that roasts a DOTA2 squad, plus a tiny Cloudflare Worker that lets the trash talk be edited live. There is **no build step, no bundler, no package.json, no test suite, no linter.** JSX is transformed in the browser by `@babel/standalone`; React is loaded from `unpkg`.

If you find yourself wanting to add a build pipeline, stop and re-read this paragraph — the deliberate constraint is that `public/index.html` works when opened directly off disk.

## Layout (the parts that matter)

- `public/` — the site. Deployed to Cloudflare Pages.
  - `index.html` — boots everything. Sets `window.__WORKER_URL__` (empty = static/offline mode).
  - `fallback-data.js` — inlined copy of `public/data/*.json`. Used when no worker is configured or fetch fails. Must stay in sync with the JSON files.
  - `data-loader.js` — synchronously hydrates `window.*` globals from fallback (fast path) or fetches from the worker with a 1.5s timeout per key (slow path). Dispatches `data-loaded`.
  - `data/{squad,disses,shame,match}.json` — canonical content. These four keys are hard-coded everywhere.
  - `app.jsx`, `components/*.jsx` — UI. Loaded by `index.html` as `type="text/babel"` after `data-loaded` fires.
  - `tweaks-panel.jsx` — visual-editor side panel (separate from the admin panel below).
- `worker/` — Cloudflare Worker `shame.api`. Source: `worker/src/index.js`. Wrangler config: `worker/wrangler.toml`.
- `wrangler.jsonc` — top-level Cloudflare Pages config (`name = "shame"`, `pages_build_output_dir = "public"`). Used to deploy the site with `wrangler pages deploy public`.
- `tools/opendota-to-match.md` — agent-facing instructions for turning an OpenDota match JSON into a new `match.json` + autopsy roast lines.
- `DEPLOY.md`, `START_HERE.md` — human-facing setup docs. Read `START_HERE.md` first if you're orienting.

There are two wrangler config files: `worker/wrangler.toml` (the API Worker) and top-level `wrangler.jsonc` (the site, a Cloudflare Pages project). They are separate deploy targets — always deploy the Worker with an explicit `-c worker/wrangler.toml`, because bare `wrangler deploy` resolves the root `wrangler.jsonc` (the Pages project) instead, which has no KV binding.

## Architecture

### Globals-as-state

Components don't import each other. Each `.jsx` file attaches things to `window.*`:

- `data-loader.js` populates `window.SQUAD`, `window.SQUAD_STATS`, `window.DISSES`, `window.SHAME_FEEDERS`, `window.SHAME_KDA`, `window.SHAME_DURATION`, `window.SHAME_FOUNTAIN`, `window.MATCH`.
- `components/shared.jsx` exports `window.SkogComponents` (Marquee, AgentTerminal, ToastBurns, ShameMeter, Donut).
- `components/{squad,pages,autopsy,admin}.jsx` register `window.SquadPage`, `window.SoloPage`, `window.WallOfShame`, `window.MatchAutopsyPage`, `window.AdminPanel`.
- `app.jsx` is the entry; it reads from `window.*` and renders.

Boot order is controlled by the script list in `index.html` — `shared.jsx` must come before consumers. If you add a component file, append it there.

### Worker API (`worker/src/index.js`)

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /auth` | password in body | Verifies admin password |
| `GET /data/:key` | none | Returns JSON from KV (5s edge cache) |
| `PUT /data/:key` | `Bearer <ADMIN_PASSWORD>` | Writes JSON to KV |
| `GET /list` | bearer | Dumps all keys |

`ALLOWED_KEYS` is hard-coded to `{squad, disses, shame, match}`. To introduce a new data key, you must update **all four** of: `worker/src/index.js`, `data-loader.js`, `fallback-data.js`, and the `applyToWindow`/state list in `components/admin.jsx`.

KV binding: `SHAME_KV` (id `991b275ce576427795c436d1d5cbc061` is committed in `worker/wrangler.toml` and `public/wrangler.toml`). `ADMIN_PASSWORD` is a Worker secret — set with `wrangler secret put ADMIN_PASSWORD`.

### Admin panel (`components/admin.jsx`)

Press `` ` `` or `~` to toggle (suppressed when an input is focused). When `__WORKER_URL__` is empty, runs in **offline preview**: any password works, edits update `window.*` but don't persist. When configured, saves via `PUT /data/:key` and the live UI re-reads from updated globals (no full reload).

### Match autopsy roasts

The `MATCH_DISSES` object at the top of `components/autopsy.jsx` is hand-written per match and lives **alongside** `public/data/match.json`. When you import a new match (see `tools/opendota-to-match.md`), update both. Voice is "40+ dudes locker-room, specific numbers > generic insults."

### Visual editor hooks

`app.jsx` uses `/*EDITMODE-BEGIN*/.../*EDITMODE-END*/` markers around the `TWEAK_DEFAULTS` object and a `postMessage`-based protocol (`__edit_mode_*`) to integrate with an external visual editor. Don't reformat those markers or the surrounding JSON.

## Common commands

There is nothing to install, build, or test. Workflows:

```bash
# Just look at the site (no internet, no toolchain)
xdg-open public/index.html      # or open public/index.html on macOS

# Local dev with the Worker (requires `npm i -g wrangler` + `wrangler login`)
cd worker && wrangler dev        # runs the API locally

# Deploy (run both from the repo root)
wrangler deploy -c worker/wrangler.toml                   # API Worker (must pass -c)
wrangler pages deploy public --project-name=shame         # site (alternative: drag-drop)

# Seed / write KV from the canonical JSON
TOKEN="$ADMIN_PASSWORD"
WORKER="https://shame.api.skogai.se"   # custom domain (or shame-api.<sub>.workers.dev)
for k in squad disses shame match; do
  curl -X PUT "$WORKER/data/$k" \
    -H "authorization: Bearer $TOKEN" \
    -H "content-type: application/json" \
    --data @public/data/$k.json
done
```

After deploy, set `window.__WORKER_URL__` in `public/index.html` to the deployed worker URL, then redeploy Pages — otherwise the admin panel is stuck in offline preview.

## Editing gotchas

- **Editing `public/data/*.json`** only affects the static fallback. Live data lives in KV; either re-seed with the curl loop above, or edit through the `~` admin panel.
- **`fallback-data.js` drift**: when the four JSON files change meaningfully, regenerate the fallback so the offline experience still matches.
- **Allowed-keys symmetry**: see the four-file list under "Worker API" before adding a new dataset.
- **Component boot order**: appending a new `components/X.jsx`? Add it to the `scripts` array in `index.html`, after `shared.jsx`.
- **No npm/test scaffolding**: don't `npm init` or add Jest/Vitest/etc. without explicit instruction — the no-toolchain stance is intentional.
