# START HERE 👇

The site you want is **`public/index.html`**. Open that.

Everything else is for deployment. You don't need to touch it until you're ready to put this on the internet.

---

## Three things, in order

### 1. Just see it work (right now)

Open `public/index.html` in any browser. Done. The page loads with bundled fallback data — no internet or backend needed.

Press **`~`** anywhere on the page → admin panel opens (offline preview mode, changes don't save yet).

### 2. Put it online (15 minutes, free)

Read `DEPLOY.md`. It walks you through:
- Cloudflare Pages (the static site) → 5 min, drag-drop
- Cloudflare Worker + KV (the editable backend) → 10 min, copy-paste commands
- Custom domain `shame.skogai.se` → 1 min

### 3. Add a new match autopsy

Read `tools/opendota-to-match.md`. Hand it + an OpenDota match JSON to any agent and you get a `match.json` ready to upload.

---

## File map (only what matters)

```
public/                       ← the site
├── index.html                ← OPEN THIS
├── data/                     ← starting JSON (also the fallback)
│   ├── squad.json            ← player profiles
│   ├── disses.json           ← all the trash talk
│   ├── shame.json            ← wall of shame entries
│   └── match.json            ← latest match autopsy
└── (everything else is code, leave it alone)

worker/                       ← editable backend (deploy step 1)
DEPLOY.md                     ← deployment walkthrough
tools/opendota-to-match.md    ← agent instructions for new matches
```

---

## Editing trash talk

Two ways:

**A) Live, on the site (after deploy):** press `~`, type password, edit, SAVE.

**B) In the JSON files directly:** open `public/data/disses.json`, edit, redeploy. The structure is obvious — `byPlayer.skogix` is a list of strings, add another string, done.
