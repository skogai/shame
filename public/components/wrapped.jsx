// SHAME WRAPPED 2026 — Spotify-Wrapped-style annual disgrace recap.
// Full-screen auto-playing story. Everything is computed from the live
// window.* globals (SQUAD, SQUAD_STATS, SHAME_*), so KV edits flow through.
const { useState: wUse, useEffect: wEff, useRef: wRef, useMemo: wMem } = React;

const WRAPPED_CSS = `
  .wrapped-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: radial-gradient(120% 120% at 50% 0%, #14101f 0%, #07060c 60%, #000 100%);
    font-family: var(--font-ui); color: #fff; overflow: hidden;
    user-select: none; -webkit-user-select: none; cursor: pointer;
  }
  .wrapped-bars {
    position: absolute; top: 14px; left: 16px; right: 16px;
    display: flex; gap: 5px; z-index: 20;
  }
  .wrapped-bars .bar { flex: 1; height: 3px; background: rgba(255,255,255,0.15); overflow: hidden; }
  .wrapped-bars .bar > div { height: 100%; background: #fff; box-shadow: 0 0 6px rgba(255,255,255,0.8); }
  @keyframes wrapped-fill { from { width: 0%; } to { width: 100%; } }
  .wrapped-slide {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 64px 28px; animation: wrapped-slide-in 0.55s var(--ease-cyber, ease-out);
  }
  @keyframes wrapped-slide-in {
    from { opacity: 0; transform: translateY(26px) scale(0.98); }
    to   { opacity: 1; transform: none; }
  }
  .wrapped-kicker {
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.45em;
    color: var(--fg-2, #888); margin-bottom: 18px; text-transform: uppercase;
    animation: wrapped-slide-in 0.55s 0.05s both;
  }
  .wrapped-huge {
    font-family: var(--font-display, var(--font-ui)); font-weight: 900;
    font-size: clamp(56px, 14vw, 160px); line-height: 0.95; letter-spacing: -0.02em;
  }
  .wrapped-title {
    font-family: var(--font-display, var(--font-ui)); font-weight: 900;
    font-size: clamp(30px, 6vw, 64px); line-height: 1.05; letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .wrapped-sub {
    margin-top: 22px; max-width: 560px; font-size: clamp(14px, 2.2vw, 19px);
    color: var(--fog-1, #cfd2e0); line-height: 1.5;
    animation: wrapped-slide-in 0.6s 0.35s both;
  }
  .wrapped-fine {
    margin-top: 14px; font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.25em; color: var(--fg-2, #777);
    animation: wrapped-slide-in 0.6s 0.6s both;
  }
  .wrapped-glitch { position: relative; display: inline-block; }
  .wrapped-glitch::before, .wrapped-glitch::after {
    content: attr(data-text); position: absolute; inset: 0; overflow: hidden;
  }
  .wrapped-glitch::before {
    color: var(--cyan, #00e5ff); z-index: -1;
    animation: wrapped-glitch-a 2.4s infinite steps(1);
  }
  .wrapped-glitch::after {
    color: var(--blood, #ff2d4a); z-index: -2;
    animation: wrapped-glitch-b 3.1s infinite steps(1);
  }
  @keyframes wrapped-glitch-a {
    0%, 91% { transform: none; opacity: 0; }
    92% { transform: translate(-4px, 2px); opacity: 0.9; }
    94% { transform: translate(3px, -1px); opacity: 0.9; }
    96%, 100% { transform: none; opacity: 0; }
  }
  @keyframes wrapped-glitch-b {
    0%, 88% { transform: none; opacity: 0; }
    89% { transform: translate(4px, -2px); opacity: 0.8; }
    93% { transform: translate(-3px, 2px); opacity: 0.8; }
    95%, 100% { transform: none; opacity: 0; }
  }
  .wrapped-float {
    position: absolute; bottom: -10vh; font-size: 28px; opacity: 0;
    animation: wrapped-rise linear infinite; pointer-events: none;
    filter: grayscale(0.3);
  }
  @keyframes wrapped-rise {
    0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
    10%  { opacity: 0.5; }
    90%  { opacity: 0.35; }
    100% { transform: translateY(-115vh) rotate(60deg); opacity: 0; }
  }
  .wrapped-card {
    margin-top: 26px; padding: 18px 22px; min-width: min(420px, 86vw);
    background: rgba(11,13,21,0.85); border: 1px solid var(--border, #2a2d3a);
    clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
    animation: wrapped-slide-in 0.6s 0.3s both; text-align: left;
  }
  .wrapped-row {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 24px; padding: 7px 0; border-bottom: 1px dashed rgba(255,255,255,0.08);
    font-family: var(--font-mono); font-size: 13px;
  }
  .wrapped-row:last-child { border-bottom: none; }
  .wrapped-row .who { letter-spacing: 0.15em; color: var(--fog-1, #cfd2e0); }
  .wrapped-row .val { font-weight: 700; }
  .wrapped-grade {
    font-family: var(--font-display, var(--font-ui)); font-weight: 900;
    font-size: clamp(120px, 30vw, 320px); line-height: 1; color: var(--blood, #ff2d4a);
    text-shadow: 0 0 60px rgba(255,45,74,0.55);
    animation: wrapped-stamp 0.8s 0.9s both;
  }
  @keyframes wrapped-stamp {
    0%   { opacity: 0; transform: scale(3.4) rotate(-14deg); }
    60%  { opacity: 1; transform: scale(0.92) rotate(-7deg); }
    100% { opacity: 1; transform: scale(1) rotate(-7deg); }
  }
  .wrapped-avatar {
    font-size: clamp(64px, 12vw, 110px); width: 1.6em; height: 1.6em;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; margin-bottom: 18px;
    animation: wrapped-slide-in 0.55s both;
    box-shadow: 0 0 50px rgba(255,255,255,0.12) inset, 0 0 40px rgba(0,0,0,0.6);
  }
  .wrapped-close {
    position: absolute; top: 30px; right: 18px; z-index: 30;
    background: rgba(0,0,0,0.5); border: 1px solid var(--border, #444);
    color: var(--fg-2, #999); font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.2em; padding: 5px 12px; cursor: pointer;
  }
  .wrapped-close:hover { color: #fff; border-color: #fff; }
  .wrapped-hint {
    position: absolute; bottom: 16px; left: 0; right: 0; text-align: center;
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.3em;
    color: var(--fg-2, #666); z-index: 20; pointer-events: none;
  }
  .wrapped-launch-btn {
    position: relative; padding: 22px 48px; cursor: pointer;
    background: linear-gradient(135deg, rgba(255,45,74,0.18), rgba(0,229,255,0.12));
    border: 1px solid var(--blood, #ff2d4a); color: #fff;
    font-family: var(--font-display, var(--font-ui)); font-weight: 900;
    font-size: clamp(20px, 3.4vw, 30px); letter-spacing: 0.18em;
    clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
    animation: wrapped-pulse 1.8s ease-in-out infinite;
  }
  @keyframes wrapped-pulse {
    0%, 100% { box-shadow: 0 0 18px rgba(255,45,74,0.35); }
    50%      { box-shadow: 0 0 46px rgba(255,45,74,0.75); }
  }
`;

const fmtNum = (n) => Math.round(n).toLocaleString('en-US');

// Eased count-up number. Remounted per slide, so it restarts each reveal.
function CountUp({ to, duration = 1600, format = fmtNum, style }) {
  const [val, setVal] = wUse(0);
  wEff(() => {
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span style={style}>{format(val)}</span>;
}

// Floating emoji background (skulls, tombstones, whatever the slide deserves).
function FloatField({ glyphs, count = 12 }) {
  const items = wMem(() => Array.from({ length: count }, (_, i) => ({
    g: glyphs[i % glyphs.length],
    left: Math.random() * 96 + '%',
    dur: 7 + Math.random() * 9,
    delay: -Math.random() * 12,
    size: 18 + Math.random() * 26,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {items.map((it, i) => (
        <span key={i} className="wrapped-float" style={{
          left: it.left, fontSize: it.size,
          animationDuration: it.dur + 's', animationDelay: it.delay + 's',
        }}>{it.g}</span>
      ))}
    </div>
  );
}

// ---- the yearly numbers, derived live -------------------------------------

function compileWrapped() {
  const squad = window.SQUAD || [];
  const stats = window.SQUAD_STATS || {};
  const feeders = window.SHAME_FEEDERS || [];
  const kdaHall = window.SHAME_KDA || [];
  const fountain = (window.SHAME_FOUNTAIN || []).slice().sort((a, b) => b.count - a.count);

  const totalGames = stats.totalGames || 0;
  const totalLosses = stats.totalLosses || 0;
  const totalDeaths = Math.round((stats.avgDeathsPerGame || 0) * totalGames);
  // ~38s average respawn timer, ~40min average game. Science.
  const daysDead = (totalDeaths * 38) / 86400;
  const daysLosing = (totalLosses * 40) / 1440;

  const byId = Object.fromEntries(squad.map((p) => [p.id, p]));
  const pName = (id) => (byId[id] && (byId[id].nameShort || byId[id].name)) || id;

  // Award ceremony — each player gets exactly one superlative. Greedy
  // assignment down this list; anyone left over gets the participation trophy.
  const fountainCount = (p) => (fountain.find((f) => f.player === p.id) || {}).count || 0;
  const awardDefs = [
    {
      pick: (pool) => pool.reduce((a, b) => (b.games > a.games ? b : a)),
      title: 'THE SUNK COST AWARD',
      line: (p) => `${fmtNum(p.games)} games and still ${p.rank}. At this point it's not a hobby, it's a hostage situation.`,
    },
    {
      pick: (pool) => pool.reduce((a, b) => (b.winRate < a.winRate ? b : a)),
      title: 'THE ANCHOR',
      line: (p) => `${p.winRate}% winrate. Statistically, queueing with him is the most reliable way to lose MMR without playing badly yourself.`,
    },
    {
      pick: (pool) => pool.reduce((a, b) => (fountainCount(b) > fountainCount(a) ? b : a)),
      title: 'GUARDIAN OF THE FOUNTAIN',
      line: (p) => `${fountainCount(p)} fountain deaths this week alone. The enemy fountain has a loyalty card with his name on it.`,
    },
    {
      pick: (pool) => pool.reduce((a, b) => (b.perf.apm > a.perf.apm ? b : a)),
      title: 'APM ≠ IMPACT',
      line: (p) => `${p.perf.apm} actions per minute, ${p.kda.d} deaths per game. Pressing buttons fast is not the same as pressing the right ones.`,
    },
    {
      pick: (pool) => pool.reduce((a, b) => (b.winRate > a.winRate ? b : a)),
      title: 'LEAST EMBARRASSING (LOW BAR)',
      line: (p) => `${p.winRate}% winrate. Congratulations on clearing a bar that was lying on the floor.`,
    },
    {
      pick: (pool) => pool[0],
      title: 'PARTICIPATION TROPHY',
      line: () => `He was there. That is the nicest thing the data allows us to say.`,
    },
  ];
  const awards = [];
  let pool = squad.slice();
  for (const def of awardDefs) {
    if (!pool.length) break;
    const p = def.pick(pool);
    pool = pool.filter((x) => x.id !== p.id);
    awards.push({ player: p, title: def.title, line: def.line(p) });
  }

  return {
    squad, stats, fountain, byId, pName,
    totalGames, totalLosses, totalDeaths, daysDead, daysLosing,
    awards,
    worstFeed: feeders[0],
    worstKda: kdaHall[0],
  };
}

// ---- slide deck ------------------------------------------------------------

function buildSlides(W) {
  const year = new Date().getFullYear();
  const slides = [];

  slides.push({
    dur: 5500,
    render: () => (
      <div className="wrapped-slide">
        <FloatField glyphs={['💀', '🪦', '⚰️']} />
        <div className="wrapped-kicker">SKOGAI PRESENTS · WITHOUT MERCY</div>
        <div className="wrapped-title wrapped-glitch" data-text={`SHAME WRAPPED ${year}`} style={{ color: '#fff' }}>
          SHAME WRAPPED {year}
        </div>
        <div className="wrapped-sub">Your year in DOTA, statistically reviewed. Nobody asked for this. We compiled it anyway.</div>
        <div className="wrapped-fine">EVIDENCE :: OPENDOTA · CERTIFIED :: SHAME-ENGINE</div>
      </div>
    ),
  });

  slides.push({
    dur: 6000,
    render: () => (
      <div className="wrapped-slide">
        <div className="wrapped-kicker">COMBINED MATCHES PLAYED</div>
        <div className="wrapped-huge" style={{ color: 'var(--cyan)' }}>
          <CountUp to={W.totalGames} />
        </div>
        <div className="wrapped-sub">
          Five guys. {fmtNum(W.totalGames)} games. In that time you could have learned five languages, built a house, or — hear us out — gotten good at one video game.
        </div>
      </div>
    ),
  });

  slides.push({
    dur: 6500,
    render: () => (
      <div className="wrapped-slide">
        <FloatField glyphs={['💀']} count={16} />
        <div className="wrapped-kicker">ESTIMATED COMBINED DEATHS</div>
        <div className="wrapped-huge" style={{ color: 'var(--blood)' }}>
          <CountUp to={W.totalDeaths} />
        </div>
        <div className="wrapped-sub">
          At an average respawn timer, that is <b style={{ color: 'var(--hazard)' }}>{W.daysDead.toFixed(1)} days</b> spent staring at a grey screen waiting to run it down again.
        </div>
        <div className="wrapped-fine">THE GREY SCREEN REMEMBERS</div>
      </div>
    ),
  });

  slides.push({
    dur: 6000,
    render: () => (
      <div className="wrapped-slide">
        <div className="wrapped-kicker">TIME DONATED TO THE ENEMY TEAM</div>
        <div className="wrapped-huge" style={{ color: 'var(--hazard)' }}>
          <CountUp to={W.daysLosing} format={(n) => n.toFixed(0)} /><span style={{ fontSize: '0.35em' }}> DAYS</span>
        </div>
        <div className="wrapped-sub">
          {fmtNum(W.totalLosses)} losses at ~40 minutes each. That is {(W.daysLosing / 30).toFixed(1)} months of collective lifetime spent actively making ten strangers happy.
        </div>
      </div>
    ),
  });

  if (W.worstFeed) {
    const f = W.worstFeed;
    slides.push({
      dur: 7000,
      render: () => (
        <div className="wrapped-slide">
          <FloatField glyphs={['🍽️', '💀', f.heroImg]} />
          <div className="wrapped-kicker">FEEDER OF THE YEAR</div>
          <div className="wrapped-avatar" style={{ background: (W.byId[f.player] || {}).avatarBg || '#222' }}>
            {(W.byId[f.player] || {}).avatar || '👤'}
          </div>
          <div className="wrapped-title" style={{ color: 'var(--blood)' }}>{W.pName(f.player)}</div>
          <div className="wrapped-sub">
            <b>{f.deaths} deaths</b> on {f.hero} {f.heroImg} in {f.dur}. Badge earned: «{f.badge}». The enemy carry sent a thank-you note.
          </div>
        </div>
      ),
    });
  }

  if (W.worstKda) {
    const k = W.worstKda;
    slides.push({
      dur: 6500,
      render: () => (
        <div className="wrapped-slide">
          <div className="wrapped-kicker">LOWEST KDA RECORDED</div>
          <div className="wrapped-huge" style={{ color: 'var(--magenta)' }}>
            <CountUp to={k.kda} format={(n) => n.toFixed(2)} />
          </div>
          <div className="wrapped-sub">
            {W.pName(k.player)} went <b>{k.line}</b> on {k.hero} {k.heroImg}. «{k.badge}». A lane creep with a battle pass would have contributed more.
          </div>
        </div>
      ),
    });
  }

  if (W.fountain.length) {
    slides.push({
      dur: 7000,
      render: () => (
        <div className="wrapped-slide">
          <FloatField glyphs={['⛲', '💀']} />
          <div className="wrapped-kicker">FOUNTAIN DEATHS · LEADERBOARD</div>
          <div className="wrapped-title" style={{ color: 'var(--cyan)' }}>THE PILGRIMAGE</div>
          <div className="wrapped-card">
            {W.fountain.map((f, i) => (
              <div className="wrapped-row" key={f.player}>
                <span className="who">{i + 1}. {W.pName(f.player).toUpperCase()}</span>
                <span className="val" style={{ color: i === 0 ? 'var(--blood)' : 'var(--fog-1)' }}>
                  {f.count}{i === 0 ? ' ☠ SEASON MVP (DEROGATORY)' : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="wrapped-fine">DYING PAST THE TIER 4s IS A LIFESTYLE</div>
        </div>
      ),
    });
  }

  // Award ceremony — one slide per player.
  W.awards.forEach(({ player: p, title, line }) => {
    slides.push({
      dur: 6500,
      render: () => (
        <div className="wrapped-slide">
          <FloatField glyphs={['🏆', '🗑️']} count={8} />
          <div className="wrapped-kicker">THE {year} SHAMMY AWARDS</div>
          <div className="wrapped-avatar" style={{ background: p.avatarBg, boxShadow: `0 0 60px ${p.accentHex}44` }}>{p.avatar}</div>
          <div className="wrapped-title" style={{ color: p.accentHex }}>{p.nameShort || p.name}</div>
          <div style={{
            marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.35em',
            color: 'var(--hazard)', animation: 'wrapped-slide-in 0.5s 0.25s both',
          }}>🏆 {title}</div>
          <div className="wrapped-sub">{line}</div>
          <div className="wrapped-fine">{p.role}</div>
        </div>
      ),
    });
  });

  slides.push({
    dur: 7000,
    render: () => (
      <div className="wrapped-slide">
        <div className="wrapped-kicker">FINAL SQUAD GRADE · {fmtNum(W.totalGames)} GAMES AUDITED</div>
        <div className="wrapped-grade">F</div>
        <div className="wrapped-sub">
          {W.stats.winRate}% winrate. The grade was never in doubt — we just wanted you to sit through the evidence first.
        </div>
        <div className="wrapped-fine">SEE YOU NEXT YEAR. WE BOTH KNOW YOU'LL QUEUE AGAIN TONIGHT.</div>
      </div>
    ),
  });

  slides.push({
    dur: 9000,
    render: () => (
      <div className="wrapped-slide">
        <FloatField glyphs={['💀', '🪦', '📉']} />
        <div className="wrapped-kicker">SHAME WRAPPED {year} · OFFICIAL RECEIPT</div>
        <div className="wrapped-card">
          <div className="wrapped-row"><span className="who">GAMES</span><span className="val" style={{ color: 'var(--cyan)' }}>{fmtNum(W.totalGames)}</span></div>
          <div className="wrapped-row"><span className="who">DEATHS (EST.)</span><span className="val" style={{ color: 'var(--blood)' }}>{fmtNum(W.totalDeaths)}</span></div>
          <div className="wrapped-row"><span className="who">DAYS SPENT DEAD</span><span className="val" style={{ color: 'var(--hazard)' }}>{W.daysDead.toFixed(1)}</span></div>
          <div className="wrapped-row"><span className="who">DAYS SPENT LOSING</span><span className="val" style={{ color: 'var(--hazard)' }}>{W.daysLosing.toFixed(0)}</span></div>
          <div className="wrapped-row"><span className="who">WINRATE</span><span className="val" style={{ color: 'var(--magenta)' }}>{W.stats.winRate}%</span></div>
          <div className="wrapped-row"><span className="who">GRADE</span><span className="val" style={{ color: 'var(--blood)' }}>F</span></div>
        </div>
        <div className="wrapped-sub" style={{ fontSize: 14 }}>
          Screenshot this and post it in the group chat. Or don't. We would understand.
        </div>
        <div className="wrapped-fine">TAP TO RE-LIVE THE SHAME · ESC TO PRETEND IT NEVER HAPPENED</div>
      </div>
    ),
  });

  return slides;
}

// ---- story player -----------------------------------------------------------

function ShameWrappedStory({ onClose }) {
  const W = wMem(compileWrapped, []);
  const slides = wMem(() => buildSlides(W), [W]);
  const [idx, setIdx] = wUse(0);
  const [paused, setPaused] = wUse(false);

  const next = () => setIdx((i) => (i + 1) % slides.length);
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  wEff(() => {
    if (paused) return;
    const t = setTimeout(next, slides[idx].dur);
    return () => clearTimeout(t);
  }, [idx, paused, slides]);

  wEff(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onTap = (e) => {
    (e.clientX / window.innerWidth) < 0.3 ? prev() : next();
  };

  return (
    <div
      className="wrapped-overlay"
      onClick={onTap}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
    >
      <style>{WRAPPED_CSS}</style>
      <div className="wrapped-bars">
        {slides.map((s, i) => (
          <div className="bar" key={i}>
            <div style={
              i < idx ? { width: '100%' }
              : i === idx ? { animation: `wrapped-fill ${s.dur}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }
              : { width: '0%' }
            }></div>
          </div>
        ))}
      </div>
      <button className="wrapped-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>ESC ✕</button>
      {/* key forces remount so per-slide entrance animations + CountUps restart */}
      <div key={idx} style={{ position: 'absolute', inset: 0 }}>{slides[idx].render()}</div>
      <div className="wrapped-hint">◂ TAP TO NAVIGATE ▸ · HOLD TO PAUSE · {idx + 1}/{slides.length}</div>
    </div>
  );
}

// ---- launcher page (the tab) --------------------------------------------------

function ShameWrappedPage() {
  const [playing, setPlaying] = wUse(false);
  const year = new Date().getFullYear();
  const stats = window.SQUAD_STATS || {};
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', position: 'relative' }}>
      <style>{WRAPPED_CSS}</style>
      <div className="wrapped-kicker" style={{ animation: 'none' }}>THE BIGGEST UPDATE IN THE HISTORY OF DOTA-SHAME</div>
      <h1 className="wrapped-title wrapped-glitch" data-text={`SHAME WRAPPED ${year}`} style={{ color: '#fff', margin: '8px 0 18px' }}>
        SHAME WRAPPED {year}
      </h1>
      <p style={{ maxWidth: 520, margin: '0 auto 36px', color: 'var(--fog-1)', lineHeight: 1.6, fontSize: 15 }}>
        {Number(stats.totalGames || 0).toLocaleString('en-US')} games. One squad. Zero excuses accepted.
        A cinematic, auto-playing recap of everything you should have uninstalled over.
      </p>
      <button className="wrapped-launch-btn" onClick={() => setPlaying(true)}>
        ▶ PLAY YOUR SHAME
      </button>
      <div className="wrapped-fine" style={{ animation: 'none', marginTop: 24 }}>
        RUNTIME ~90 SECONDS · SIDE EFFECTS MAY INCLUDE SELF-AWARENESS
      </div>
      {playing && <ShameWrappedStory onClose={() => setPlaying(false)} />}
    </div>
  );
}

window.ShameWrappedPage = ShameWrappedPage;
