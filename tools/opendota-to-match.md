# Match Autopsy — Importing a New Match

You (or an agent on your behalf) want to turn an OpenDota match JSON into a new
autopsy. The frontend reads `match.json` from the worker (or from
`/data/match.json` in static mode) — replace its contents and the autopsy tab
re-skins itself.

## 1. Get the raw JSON

```bash
curl -s "https://api.opendota.com/api/matches/<MATCH_ID>" > raw.json
```

If the match is unparsed, request a parse and wait ~5 minutes:
`POST https://api.opendota.com/api/request/<MATCH_ID>`.

## 2. Identify the heroes (skogix + zcope)

In the JSON, find the two players in `players[]` whose `account_id` matches:
- Skogix: `116550742`
- ZCOPE:  `37551669`
- Nagasaki: `1619263035` (if present — currently named "yeank" in the test data)
- kevin: TBD — fill in once we have his ID

Pin them as `skogix` and `zcope`. Identify the enemy carry as the player on the
**opposite team** with the highest `kills` (call them the "villain").

## 3. Shape the data

The autopsy expects this schema (see `deploy/public/data/match.json` for a
working example):

```json
{
  "match_id": <number>,
  "duration": <seconds>,
  "radiant_win": <bool>,
  "radiant_score": <number>,
  "dire_score": <number>,
  "first_blood_time": <seconds>,
  "radiant_gold_adv": [<int per minute>],
  "radiant_xp_adv":   [<int per minute>],
  "fights": [{ "start": <s>, "end": <s>, "radDeaths": <n>, "direDeaths": <n>, "deaths": <n> }, …],
  "skogix": {
    "name": "Skogix", "hero": "<readable hero name>", "hero_id": <id>,
    "k": <n>, "d": <n>, "a": <n>,
    "gpm": <n>, "xpm": <n>, "lh": <n>, "dn": <n>,
    "hero_dmg": <n>, "tower_dmg": <n>, "healing": <n>,
    "obs": <n>, "sen": <n>, "stuns": <float>,
    "fight_part": <0..1>, "rune": <n>, "buybacks": <n>,
    "multi_kills": {<count>: <times>}, "kill_streaks": {<count>: <times>},
    "max_hit": { "value": <n>, "key": "<hero killed>", "inflictor": "<ability>", "time": <s> },
    "items": [<id>×6],
    "killed_by": { "npc_dota_hero_<name>": <count>, … },
    "gold_t": [...], "xp_t": [...], "lh_t": [...]
  },
  "zcope": { …same shape… },
  "enemy_carry": {
    "name": "<personaname>", "hero": "<hero name>",
    "k": <n>, "d": <n>, "a": <n>, "gpm": <n>, "hero_dmg": <n>,
    "streaks": {<n>: <times>, …}
  }
}
```

Hero ID → name lookup (only the IDs we currently use):
- 6 Drow Ranger · 15 Razor · 20 Vengeful Spirit · 26 Lion · 30 Witch Doctor
- 37 Warlock · 53 Nature's Prophet · 74 Invoker · 80 Lone Druid · 85 Undying

For others, see https://api.opendota.com/api/heroes.

## 4. Write the disses

Open the file, find the `MATCH_DISSES` block at the top of
`components/autopsy.jsx`. Update:
- `cold[]` — three lines for the cold open
- `skogix.bullets[]` — 5–8 specific roasts pulled from his stats (low GPM, high
  deaths, who killed him most, etc). NAME the hero who farmed him.
- `zcope.bullets[]` — same, for ZCOPE
- `villain.bullets[]` — 2–3 lines of grudging respect for the enemy carry
- `fights[]` — 2–3 callouts of pivotal teamfights from `fights[]`
- `closing[]` — three lines for the verdict card
- Headlines (`skogix.headline`, `zcope.headline`) — one-liner tagline for each

Voice: 40+ dudes locker-room. Specific numbers > generic insults. If the same
enemy hero killed him 4×, name that hero. If GPM is below 400 on a core, that's
a charge.

## 5. Push it live

If running with the Worker:

```bash
TOKEN=<ADMIN_PASSWORD>
curl -X PUT https://shame-api.YOURNAME.workers.dev/data/match \
  -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  --data @match.json
```

Or open the live site, press `~`, log in, paste into the Match Autopsy tab,
hit SAVE.

If running static (no worker), drop the file into `public/data/match.json` and
re-deploy the Pages project.

## 6. Verify

Visit the site → Match Autopsy tab. Press play on the timeline. Confirm the
new score, duration, and roast lines render. The agent commentary phases are
time-driven so they update automatically.
