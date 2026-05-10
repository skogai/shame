# DEPLOY :: shame.skogai.se

End-to-end setup for Cloudflare Pages (the site) + Cloudflare Workers + KV
(the live-editable trash talk store).

## What you get

- **`shame.skogai.se`** — the static site (Cloudflare Pages, free, fast)
- **`shame-api.<your>.workers.dev`** — tiny API for reading/writing JSON
- **In-page admin panel** — press **`~`** anywhere on the site, enter your
  password, edit any roast or stat, hit SAVE. Live in ~5 seconds for everyone.

---

## ONE-TIME SETUP

### Prerequisites

```bash
npm i -g wrangler
wrangler login   # opens browser, links to your Cloudflare account
```

### 1. Deploy the Worker (the editable backend)

```bash
cd deploy/worker

# Create a KV namespace and copy the returned id into wrangler.toml
wrangler kv namespace create SHAME_KV
# → paste the id into the `id = "..."` line in wrangler.toml

# Set the admin password (this is THE password for the ~ panel)
wrangler secret put ADMIN_PASSWORD
# → paste a strong password when prompted. Save it somewhere safe.

# Deploy
wrangler deploy
# → outputs: https://shame-api.<yourname>.workers.dev
```

### 2. Seed KV with the starting data

```bash
TOKEN="skogsund1"
WORKER="https://shame.api.skogix.workers.dev"

cd ../public

for k in squad disses shame match; do
  curl -X PUT "$WORKER/data/$k" \
    -H "authorization: Bearer $TOKEN" \
    -H "content-type: application/json" \
    --data @data/$k.json
done
```

### 3. Wire the frontend to the worker

Edit `deploy/public/index.html`:

```html
<script>
  window.__WORKER_URL__ = "https://shame-api.<yourname>.workers.dev";
</script>
```

Edit `deploy/public/data-loader.js` to read from the worker instead of static
files (replace the top of the file):

```js
const BASE = (window.__WORKER_URL__ || "") + "/data/";
// ...rest unchanged. The fetch call already appends `<name>.json` — drop the
// `.json` suffix in the loader since the worker routes are /data/<name>.
```

(or keep static fallback — see "Static-only mode" below.)

### 4. Deploy the frontend to Cloudflare Pages

Easiest path — **drag-drop**:

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets
2. Project name: `shame`
3. Drag the entire `deploy/public/` folder onto the upload zone
4. Deploy → site is live at `shame.pages.dev`

Or via CLI:

```bash
cd deploy/public
wrangler pages deploy . --project-name=shame
```

### 5. Custom domain `shame.skogai.se`

In the Pages project → Custom domains → Set up a custom domain → enter
`shame.skogai.se`. If the apex `skogai.se` is already on Cloudflare, the CNAME
is added automatically. SSL takes ~1 minute.

---

## DAILY USE

### Add new trash talk

1. Open <https://shame.skogai.se>
2. Press **`~`**
3. Type the password
4. Pick a tab (TRASH TALK / SQUAD / WALL OF SHAME / MATCH AUTOPSY)
5. Edit, hit SAVE. Live for everyone in ~5s.

### Add a new match autopsy

See `tools/opendota-to-match.md`. Two ways:

- **Via admin panel:** open the Match Autopsy tab in the admin panel, paste
  the new match JSON, hit SAVE.
- **Via curl:**

  ```bash
  curl -X PUT $WORKER/data/match \
    -H "authorization: Bearer $TOKEN" \
    -H "content-type: application/json" \
    --data @new-match.json
  ```

### Re-deploy site after changing code

```bash
cd deploy/public
wrangler pages deploy . --project-name=shame
```

---

## STATIC-ONLY MODE (no worker)

If you want pure Pages with no editable backend:

1. Skip step 1 (worker).
2. Leave `__WORKER_URL__` as `''` in `index.html`.
3. The data loader serves `data/<name>.json` from the Pages site.
4. To update content: edit the JSON file, redeploy.

The admin panel still opens with `~` but operates in OFFLINE PREVIEW (changes
don't persist). Useful for trying out a new burn before committing.

---

## STRUCTURE

```
deploy/
├── public/                    static site → Cloudflare Pages
│   ├── index.html
│   ├── data-loader.js
│   ├── data/                  starting JSON (also the static fallback)
│   │   ├── squad.json
│   │   ├── disses.json
│   │   ├── shame.json
│   │   └── match.json
│   ├── components/
│   │   └── admin.jsx          press ~ to open
│   └── ...
├── worker/                    Cloudflare Worker → admin API
│   ├── src/index.js
│   └── wrangler.toml
├── tools/
│   └── opendota-to-match.md   how to import a new match
└── DEPLOY.md                  this file
```

---

## TROUBLESHOOTING

- **`~` doesn't open the panel** — focus is on an input/textarea; click empty
  space first.
- **"OFFLINE PREVIEW" shown when authed** — `__WORKER_URL__` not set in
  index.html. Fix and redeploy.
- **401 on save** — wrong password, or `ADMIN_PASSWORD` secret not set on the
  worker. Re-run `wrangler secret put ADMIN_PASSWORD`.
- **Changes not showing** — the worker caches reads at the edge for 5 seconds.
  Wait, then hard-refresh.
- **Worker quota** — Free plan: 100k requests/day, plenty.
- **KV write limits** — 1 write/key/sec. Don't smash the SAVE button.
