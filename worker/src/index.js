// Cloudflare Worker — shame.skogai.se admin API
//
// Storage model:
//   KV (SHAME_KV)  — editorial singletons: squad, disses, shame.
//   D1 (SHAME_DB)  — match HISTORY (one row per match). `match` is special:
//                    reads return the latest row, writes upsert a row + the
//                    per-player breakdown. KV still mirrors the latest `match`
//                    so /list and the offline fallback keep working.
//
// Routes:
//   POST /auth            — { password } -> 200 if matches env.ADMIN_PASSWORD
//   GET  /data/:key       — public. squad/disses/shame from KV; match = latest from D1
//   PUT  /data/:key       — bearer auth. match -> D1 (+ KV mirror); others -> KV
//   GET  /list            — bearer auth, dumps all KV keys
//   GET  /matches         — public, match history summary (newest first)
//   GET  /matches/:id     — public, full shaped JSON for one match
//   GET  /trends          — public, per-player aggregates across all matches
//
// Set secret: wrangler secret put ADMIN_PASSWORD

const ALLOWED_KEYS = new Set(['squad', 'disses', 'shame', 'match']);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,PUT,POST,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-max-age': '86400',
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { 'content-type': 'application/json', ...CORS, ...(init.headers || {}) },
  });
}

function rawJson(text, init = {}) {
  return new Response(text, {
    status: init.status || 200,
    headers: { 'content-type': 'application/json', ...CORS, ...(init.headers || {}) },
  });
}

function auth(req, env) {
  const h = req.headers.get('authorization') || '';
  const token = h.replace(/^Bearer\s+/i, '');
  return token && token === env.ADMIN_PASSWORD;
}

function hasD1(env) {
  return env.SHAME_DB && typeof env.SHAME_DB.prepare === 'function';
}

// A top-level match key is a TRACKED squad player if it's an object carrying
// `fight_part` (skogix/zcope/…). enemy_carry has no fight_part, so it's excluded.
function extractPlayers(match) {
  const rows = [];
  for (const [key, v] of Object.entries(match)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.fight_part === 'number') {
      rows.push({
        player: key,
        hero: v.hero ?? null,
        hero_id: v.hero_id ?? null,
        k: v.k ?? null, d: v.d ?? null, a: v.a ?? null,
        gpm: v.gpm ?? null, xpm: v.xpm ?? null,
        lh: v.lh ?? null, dn: v.dn ?? null,
        hero_dmg: v.hero_dmg ?? null, tower_dmg: v.tower_dmg ?? null,
        healing: v.healing ?? null, stuns: v.stuns ?? null,
        wards: (v.obs ?? 0) + (v.sen ?? 0),
        fight_part: v.fight_part ?? null,
        buybacks: v.buybacks ?? null,
      });
    }
  }
  return rows;
}

async function writeMatch(env, body, match) {
  const now = Math.floor(Date.now() / 1000);
  const stmts = [
    env.SHAME_DB.prepare(
      `INSERT INTO matches
         (match_id, played_at, duration, radiant_win, radiant_score, dire_score, imported_at, raw)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(match_id) DO UPDATE SET
         played_at=excluded.played_at, duration=excluded.duration,
         radiant_win=excluded.radiant_win, radiant_score=excluded.radiant_score,
         dire_score=excluded.dire_score, imported_at=excluded.imported_at,
         raw=excluded.raw`
    ).bind(
      match.match_id,
      match.start_time ?? null,
      match.duration ?? null,
      match.radiant_win ? 1 : 0,
      match.radiant_score ?? null,
      match.dire_score ?? null,
      now,
      body
    ),
    // replace this match's player rows
    env.SHAME_DB.prepare(`DELETE FROM match_players WHERE match_id = ?1`).bind(match.match_id),
  ];
  for (const p of extractPlayers(match)) {
    stmts.push(
      env.SHAME_DB.prepare(
        `INSERT INTO match_players
           (match_id, player, hero, hero_id, k, d, a, gpm, xpm, lh, dn,
            hero_dmg, tower_dmg, healing, stuns, wards, fight_part, buybacks)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)`
      ).bind(
        match.match_id, p.player, p.hero, p.hero_id, p.k, p.d, p.a, p.gpm, p.xpm,
        p.lh, p.dn, p.hero_dmg, p.tower_dmg, p.healing, p.stuns, p.wards,
        p.fight_part, p.buybacks
      )
    );
  }
  await env.SHAME_DB.batch(stmts);
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

    // POST /auth
    if (parts[0] === 'auth' && req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.password === env.ADMIN_PASSWORD) return json({ ok: true });
        return json({ ok: false }, { status: 401 });
      } catch { return json({ ok: false }, { status: 400 }); }
    }

    // GET /matches — history summary, newest first
    if (parts[0] === 'matches' && !parts[1] && req.method === 'GET') {
      if (!hasD1(env)) return json({ error: 'no database' }, { status: 503 });
      const { results } = await env.SHAME_DB.prepare(
        `SELECT match_id, played_at, duration, radiant_win, radiant_score, dire_score, imported_at
           FROM matches
          ORDER BY COALESCE(played_at, imported_at) DESC`
      ).all();
      return json({ matches: results || [] }, { headers: { 'cache-control': 'public, max-age=5' } });
    }

    // GET /matches/:id — full shaped JSON for one match
    if (parts[0] === 'matches' && parts[1] && req.method === 'GET') {
      if (!hasD1(env)) return json({ error: 'no database' }, { status: 503 });
      const row = await env.SHAME_DB.prepare(
        `SELECT raw FROM matches WHERE match_id = ?1`
      ).bind(Number(parts[1])).first();
      if (!row) return json({ error: 'not found' }, { status: 404 });
      return rawJson(row.raw, { headers: { 'cache-control': 'public, max-age=5' } });
    }

    // GET /trends — per-player aggregates across all matches
    if (parts[0] === 'trends' && req.method === 'GET') {
      if (!hasD1(env)) return json({ error: 'no database' }, { status: 503 });
      const { results } = await env.SHAME_DB.prepare(
        `SELECT player,
                COUNT(*)                  AS games,
                ROUND(AVG(k), 1)          AS avg_k,
                ROUND(AVG(d), 1)          AS avg_d,
                ROUND(AVG(a), 1)          AS avg_a,
                ROUND(AVG(gpm))           AS avg_gpm,
                ROUND(AVG(xpm))           AS avg_xpm,
                ROUND(AVG(hero_dmg))      AS avg_hero_dmg,
                ROUND(AVG(fight_part), 3) AS avg_fight_part,
                MAX(d)                    AS worst_deaths,
                MIN(gpm)                  AS worst_gpm
           FROM match_players
          GROUP BY player
          ORDER BY games DESC`
      ).all();
      return json({ trends: results || [] }, { headers: { 'cache-control': 'public, max-age=5' } });
    }

    // GET /data/:key  (public, read-only)
    if (parts[0] === 'data' && parts[1] && req.method === 'GET') {
      const key = parts[1];
      if (!ALLOWED_KEYS.has(key)) return json({ error: 'unknown key' }, { status: 404 });

      // match: latest row from D1, falling back to the KV mirror if D1 is
      // empty/unavailable (keeps the site alive mid-migration).
      if (key === 'match' && hasD1(env)) {
        const row = await env.SHAME_DB.prepare(
          `SELECT raw FROM matches ORDER BY COALESCE(played_at, imported_at) DESC LIMIT 1`
        ).first();
        if (row) return rawJson(row.raw, { headers: { 'cache-control': 'public, max-age=5' } });
        // fall through to KV mirror
      }

      const v = await env.SHAME_KV.get(key);
      if (!v) return json({ error: 'not set' }, { status: 404 });
      return rawJson(v, { headers: { 'cache-control': 'public, max-age=5' } });
    }

    // PUT /data/:key  (auth required)
    if (parts[0] === 'data' && parts[1] && req.method === 'PUT') {
      if (!auth(req, env)) return json({ error: 'unauthorized' }, { status: 401 });
      const key = parts[1];
      if (!ALLOWED_KEYS.has(key)) return json({ error: 'unknown key' }, { status: 404 });
      const body = await req.text();
      let parsed;
      try { parsed = JSON.parse(body); } catch { return json({ error: 'invalid json' }, { status: 400 }); }

      if (key === 'match') {
        if (!parsed || typeof parsed.match_id !== 'number') {
          return json({ error: 'match requires a numeric match_id' }, { status: 400 });
        }
        if (hasD1(env)) await writeMatch(env, body, parsed);
        // mirror latest into KV so /list + offline fallback stay in sync
        await env.SHAME_KV.put(key, body);
        return json({ ok: true, key, match_id: parsed.match_id, stored: hasD1(env) ? 'd1+kv' : 'kv' });
      }

      await env.SHAME_KV.put(key, body);
      return json({ ok: true, key, bytes: body.length });
    }

    // GET /list  (auth)
    if (parts[0] === 'list' && req.method === 'GET') {
      if (!auth(req, env)) return json({ error: 'unauthorized' }, { status: 401 });
      const out = {};
      for (const k of ALLOWED_KEYS) {
        const v = await env.SHAME_KV.get(k);
        out[k] = v ? JSON.parse(v) : null;
      }
      return json(out);
    }

    return json({ ok: true, service: 'shame.skogai.se admin api' });
  },
};
