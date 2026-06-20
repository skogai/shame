-- shame.skogai.se — match history schema (Cloudflare D1 / SQLite)
--
-- Two tables:
--   matches        — one row per imported match, plus the full shaped JSON in `raw`
--   match_players  — one row per TRACKED squad player per match (skogix, zcope, …)
--                    so per-player trends/benchmarks are queryable without parsing JSON.
--
-- The `raw` column is the exact JSON the autopsy UI already consumes, so
-- GET /data/match keeps returning the same shape (offline fallback unaffected).

CREATE TABLE IF NOT EXISTS matches (
  match_id      INTEGER PRIMARY KEY,
  played_at     INTEGER,            -- OpenDota start_time (unix seconds), nullable
  duration      INTEGER,
  radiant_win   INTEGER,            -- 0/1
  radiant_score INTEGER,
  dire_score    INTEGER,
  imported_at   INTEGER NOT NULL,   -- when we ingested it (unix seconds)
  raw           TEXT NOT NULL       -- full shaped match JSON
);

-- newest-first lookups (latest match, history list)
CREATE INDEX IF NOT EXISTS idx_matches_recent
  ON matches (COALESCE(played_at, imported_at) DESC);

CREATE TABLE IF NOT EXISTS match_players (
  match_id    INTEGER NOT NULL,
  player      TEXT    NOT NULL,     -- 'skogix' | 'zcope' | 'nagasaki' | 'kevin' | …
  hero        TEXT,
  hero_id     INTEGER,
  k           INTEGER,
  d           INTEGER,
  a           INTEGER,
  gpm         INTEGER,
  xpm         INTEGER,
  lh          INTEGER,
  dn          INTEGER,
  hero_dmg    INTEGER,
  tower_dmg   INTEGER,
  healing     INTEGER,
  stuns       REAL,
  wards       INTEGER,              -- obs + sen
  fight_part  REAL,
  buybacks    INTEGER,
  PRIMARY KEY (match_id, player),
  FOREIGN KEY (match_id) REFERENCES matches (match_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_players_player
  ON match_players (player);
