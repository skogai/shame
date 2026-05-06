// Wall of Shame, Solo dossier, Draft pages
const { Donut: __Donut } = window.SkogComponents;

function WallOfShame() {
  const s = window.SQUAD_STATS;
  const [logLines, setLogLines] = useState([]);

  useEffect(() => {
    const all = [
      ...window.SHAME_FEEDERS.map(f => ({lvl:'CRIT', msg:`${f.player.toUpperCase()} :: ${f.hero} :: ${f.deaths} deaths :: ${f.dur} :: badge="${f.badge}"`})),
      ...window.SHAME_KDA.map(k => ({lvl:'ERR', msg:`${k.player.toUpperCase()} :: KDA=${k.kda} :: ${k.line} on ${k.hero} :: result=${k.result}`})),
      ...window.SHAME_DURATION.map(d => ({lvl:'WARN', msg:`${d.player.toUpperCase()} :: ${d.dur} on ${d.hero} :: "${d.desc}"`})),
      ...window.SHAME_FOUNTAIN.map(f => ({lvl:'INFO', msg:`fountain visits :: ${f.player}=${f.count} (${f.week})`})),
    ];
    setLogLines(all);
  }, []);

  return (
    <div>
      <div className="wos-hero">
        <div className="wos-skulls">☠ ☠ ☠</div>
        <div className="wos-title">WALL OF SHAME</div>
        <div className="wos-sub">IT COULD ALWAYS BE WORSE… RIGHT?</div>
        <div style={{display:'flex', gap:16, justifyContent:'center', marginTop:24, flexWrap:'wrap'}}>
          <__Donut pct={s.lossRate} label="LOSS RATE" color="#ff2d4a" />
          <div className="stat-tile" style={{borderColor:'var(--blood)'}}><div className="v" style={{color:'var(--blood)'}}>{s.totalLosses.toLocaleString()}</div><div className="l">TOTAL LOSSES</div></div>
          <div className="stat-tile"><div className="v">{s.totalWins.toLocaleString()}</div><div className="l">TOTAL WINS</div></div>
          <div className="stat-tile" style={{borderColor:'var(--blood)'}}><div className="v" style={{color:'var(--blood)'}}>{s.avgDeathsPerGame}</div><div className="l">AVG DEATHS/GAME</div></div>
          <div className="stat-tile"><div className="v">{s.totalGames.toLocaleString()}</div><div className="l">GAMES PLAYED</div></div>
        </div>
      </div>

      <div className="section-eyebrow">☠ BIGGEST FEEDERS // MOST DEATHS, ONE GAME</div>
      <div className="shame-grid">
        {window.SHAME_FEEDERS.map((f, i) => (
          <div className="shame-card" key={i}>
            <span className="badge">{f.badge}</span>
            <div className="head-row">
              <div className="heroimg">{f.heroImg}</div>
              <div>
                <div className="hero-name">{f.hero}</div>
                <div className="player-tag">{f.player}</div>
              </div>
              <div style={{marginLeft:'auto', textAlign:'right'}}>
                <div className="big">{f.deaths}</div>
                <div className="big-label">DEATHS</div>
              </div>
            </div>
            <div className="stat-line">
              <div><div className="l">KILLS</div><div className="v k">{f.k}</div></div>
              <div><div className="l">DEATHS</div><div className="v d">{f.deaths}</div></div>
              <div><div className="l">ASSISTS</div><div className="v a">{f.a}</div></div>
            </div>
            <div className="footer"><span>{f.dur}</span><span>{f.gpm} GPM</span><span>{f.date}</span></div>
          </div>
        ))}
      </div>

      <div className="section-eyebrow">💩 ROCK BOTTOM KDA // WHEN STATS HIT THE FLOOR</div>
      <div className="shame-grid">
        {window.SHAME_KDA.map((k, i) => (
          <div className="shame-card" key={i}>
            <span className="badge">{k.badge}</span>
            <div className="head-row">
              <div className="heroimg">{k.heroImg}</div>
              <div>
                <div className="hero-name">{k.hero}</div>
                <div className="player-tag">{k.player}</div>
              </div>
              <div style={{marginLeft:'auto', textAlign:'right'}}>
                <div className="big">{k.kda}</div>
                <div className="big-label">KDA RATIO</div>
              </div>
            </div>
            <div className="footer"><span>{k.line} K/D/A</span><span>{k.gpm} GPM</span><span style={{color:'var(--blood)'}}>{k.result}</span></div>
          </div>
        ))}
      </div>

      <div className="section-eyebrow">// LIVE LOG :: SHAME EVENTS COMPILED FROM 10080 MATCHES</div>
      <div className="shame-log">
        <div className="lhead"><span>$ tail -f /var/log/shame.log</span><span>EVENTS: {logLines.length}</span></div>
        {logLines.map((l, i) => (
          <div className="shame-log-line" key={i}>
            <span className="ts">[2026-04-25 {String(2 + Math.floor(i/4)).padStart(2,'0')}:{String((i*7)%60).padStart(2,'0')}:{String((i*13)%60).padStart(2,'0')}]</span>{' '}
            <span className={`lvl-${l.lvl}`}>{l.lvl}</span>{' '}<span>{l.msg}</span>
          </div>
        ))}
        <div className="shame-log-line"><span className="ts">[2026-04-25 04:20:69]</span> <span className="lvl-CRIT">CRIT</span> compilation complete :: 10080 matches indexed :: <span style={{color:'var(--blood)'}}>verdict=GUILTY ON ALL COUNTS</span></div>
      </div>
    </div>
  );
}

// ============== SOLO DOSSIER ==============
function SoloPage({ initial = 'skogix', onBack }) {
  const [pid, setPid] = useState(initial);
  const p = window.SQUAD.find(x => x.id === pid);
  const disses = window.DISSES.byPlayer[pid] || [];

  return (
    <div>
      <div className="dossier">
        <div className="dossier-side">
          <div className="who">SUBJECT INDEX</div>
          <div className="pname" style={{color: p.accentHex}}>{p.nameShort || p.name}</div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-2)', marginBottom:16}}>{p.tag} · age {p.age}</div>
          {window.SQUAD.map(x => (
            <button key={x.id} className={x.id===pid ? 'on' : ''} onClick={() => setPid(x.id)}>
              ▸ {x.nameShort || x.name}
            </button>
          ))}
        </div>

        <div className="case-file">
          <div className="casehead">
            <span>CASE FILE :: 0042-{p.id.toUpperCase()}</span>
            <span style={{color:'var(--blood)'}}>● CLASSIFIED</span>
          </div>
          <div className="charge">CHARGE: {p.id === 'skogix' ? 'CHRONIC FEEDING' : p.id === 'zcope' ? 'COPING IN PUBLIC' : p.id === 'nagasaki' ? 'BRAVE BOY SYNDROME' : 'CARRYING DEAD WEIGHT'}</div>
          <span className="verdict">VERDICT ▸ GUILTY</span>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:16}}>
            <div className="kda-cell"><div className="l">RANK</div><div className="v" style={{color: p.accentHex, fontSize:14}}>{p.rank}</div></div>
            <div className="kda-cell"><div className="l">GAMES</div><div className="v" style={{fontSize:18}}>{p.games.toLocaleString()}</div></div>
            <div className="kda-cell"><div className="l">WINRATE</div><div className="v" style={{color:p.winRate < 50 ? 'var(--blood)' : 'var(--acid)', fontSize:18}}>{p.winRate}%</div></div>
            <div className="kda-cell"><div className="l">AVG K/D/A</div><div className="v" style={{fontSize:14}}>{p.kda.k}/{p.kda.d}/{p.kda.a}</div></div>
          </div>

          <div className="evidence">
            <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.3em', color:'var(--fg-2)', marginBottom:8}}>EVIDENCE LOG // {disses.length} ENTRIES</div>
            {disses.map((d, i) => (
              <div key={i} style={{marginBottom:6}}><b>›</b> {d}</div>
            ))}
          </div>

          <div style={{marginTop:20}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.3em', color:'var(--fg-2)', marginBottom:8}}>SIGNATURE HEROES // EXHIBITS A-E</div>
            <div className="heroes-list">
              {p.heroes.map((h) => (
                <div className="hero-row" key={h.name}>
                  <div className="heroimg">{h.img}</div>
                  <div className="hname">{h.name}</div>
                  <div className={`hwr ${h.wr >= 55 ? 'good' : h.wr >= 49 ? 'mid' : 'bad'}`}>{h.wr}%</div>
                  <div className="hgames">{h.games}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== DRAFT BOARD ==============
function DraftPage() {
  return (
    <div>
      <div className="section-eyebrow">DRAFT INTELLIGENCE // BASED ON 10080 GAMES OF EVIDENCE</div>
      <div className="draft-grid">
        <div className="draft-col banned">
          <h3>⚠ BANNED FROM CIVILIAN USE</h3>
          {[
            { hero: 'Bristleback', img: '🦔', wr: 31, who: 'skogix', reason: '41 deaths over 2 games. War crime.' },
            { hero: 'Nature\'s Prophet', img: '🌿', wr: 44.7, who: 'skogix', reason: '0.67 KDA. Trees are mocking him.' },
            { hero: 'Tinker', img: '⚙️', wr: 28, who: 'skogix', reason: 'Refuses to GG. 78 minute losses.' },
            { hero: 'Lina', img: '🔥', wr: 38, who: 'zcope', reason: '21 deaths on a glass cannon. Glass shattered.' },
            { hero: 'Lich', img: '❄️', wr: 33, who: 'nagasaki', reason: 'Sub-zero impact. 0.88 KDA.' },
            { hero: 'Marci', img: '🥊', wr: 42.2, who: 'nagasaki', reason: 'Hits her teammates by accident.' },
          ].map((d, i) => (
            <div className="draft-row" key={i}>
              <div className="heroimg">{d.img}</div>
              <div>
                <div style={{fontFamily:'var(--font-ui)', fontWeight:600}}>{d.hero}</div>
                <div className="reason">▸ {d.who} :: {d.reason}</div>
              </div>
              <div className="stat-pill bad">{d.wr}% WR</div>
              <div style={{color:'var(--blood)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em'}}>BANNED</div>
            </div>
          ))}
        </div>

        <div className="draft-col recommended">
          <h3>✓ APPROVED FOR DEPLOYMENT</h3>
          {[
            { hero: 'Omniknight', img: '✨', wr: 66.1, who: 'kevin', reason: 'Press R, win game. Even kevin can do it.' },
            { hero: 'Chaos Knight', img: '🐎', wr: 56.6, who: 'kevin', reason: 'Four illusions doing 4× the damage of kevin.' },
            { hero: 'Necrophos', img: '💀', wr: 55.6, who: 'skogix', reason: 'Stalls long enough for kevin to win it.' },
            { hero: 'Undying', img: '🧟', wr: 56.0, who: 'skogix', reason: 'Already dead. Cannot be killed worse.' },
            { hero: 'Mirana', img: '🏹', wr: 54.6, who: 'zcope', reason: 'Only hero where blind W = a kill. Acceptable.' },
            { hero: 'Snapfire', img: '🐉', wr: 54.8, who: 'zcope', reason: 'Cookie-throwing grandma. Relatable.' },
          ].map((d, i) => (
            <div className="draft-row" key={i}>
              <div className="heroimg">{d.img}</div>
              <div>
                <div style={{fontFamily:'var(--font-ui)', fontWeight:600}}>{d.hero}</div>
                <div className="reason">▸ {d.who} :: {d.reason}</div>
              </div>
              <div className="stat-pill good">{d.wr}% WR</div>
              <div style={{color:'var(--acid)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em'}}>FIRST PICK</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-eyebrow">TEAM COMPOSITION ANALYSIS // RUN BY THE AGENT</div>
      <div className="agent-term" style={{height:'auto'}}>
        <div className="term-head"><span>SKOGAI :: DRAFT-ADVISOR</span><span>RECOMMEND ▸ NEXT 5 GAMES</span></div>
        <div className="term-line"><span className="lvl INFO">INFO</span> <span className="msg">subject KEVIN should pick Omniknight every game until rank-up</span></div>
        <div className="term-line"><span className="lvl WARN">WARN</span> <span className="msg">subject SKOGIX must NOT instalock Bristleback. Repeat: must NOT.</span></div>
        <div className="term-line"><span className="lvl ERR">ERR</span> <span className="msg">subject ZCOPE has clicked Lina 21 times this month. Hide the icon.</span></div>
        <div className="term-line"><span className="lvl CRIT">CRIT</span> <span className="msg">composition score: 22/100. Recommend opponent forfeit before pick phase.</span></div>
      </div>
    </div>
  );
}

window.WallOfShame = WallOfShame;
window.SoloPage = SoloPage;
window.DraftPage = DraftPage;
