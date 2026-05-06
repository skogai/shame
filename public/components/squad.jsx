// PlayerCard + Squad page
const { Donut: _Donut, Spark: _Spark } = window.SkogComponents;

function getDiss(playerId) {
  const lines = window.DISSES.byPlayer[playerId] || [];
  return lines[Math.floor(Math.random() * lines.length)];
}

function PlayerCard({ p, onSelect, dissStyle = 'inline' }) {
  const [diss] = useState(() => getDiss(p.id));
  const last20 = p.last20.split('');
  const sparkData = useMemo(() => {
    // synthesize a wandering line scaled to win rate
    const base = p.winRate;
    return Array.from({length: 20}, (_, i) => base + Math.sin(i*0.7)*8 + (Math.random()*6-3));
  }, [p.id]);

  return (
    <div className="player-card" onClick={() => onSelect && onSelect(p)} style={{
      '--accent-color': p.accentHex,
      '--avatar-bg': p.avatarBg,
    }}>
      <div className="player-head">
        <div className="avatar">{p.avatar}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="player-name">{p.nameShort || p.name}</div>
          <div className="player-rank">{p.rank}</div>
          {p.streak && (
            <div className={`streak-badge ${p.streak.type === 'L' ? 'loss' : ''}`}>{p.streak.label}</div>
          )}
        </div>
        <div style={{textAlign:'right'}}>
          <div className="player-wr">{p.winRate}%</div>
          <div className="player-games">{p.games.toLocaleString()} games</div>
        </div>
      </div>

      {/* Stickers */}
      <div className="stickers">
        {p.id === 'skogix' && <>
          <span className="sticker blood">FOUNTAIN MAIN</span>
          <span className="sticker hazard">22-DEATH RECORD</span>
        </>}
        {p.id === 'zcope' && <>
          <span className="sticker cyan">204 APM</span>
          <span className="sticker blood">HARDSTUCK 4YR</span>
        </>}
        {p.id === 'nagasaki' && <>
          <span className="sticker hazard">3W STREAK</span>
          <span className="sticker magenta">BRAVE BOY</span>
        </>}
        {p.id === 'kevin' && <>
          <span className="sticker magenta">CARRY POTENTIAL</span>
          <span className="sticker cyan">LOWERCASE</span>
        </>}
      </div>

      <div className="kda-row">
        <div className="kda-cell k"><div className="l">KILLS</div><div className="v">{p.kda.k}</div></div>
        <div className="kda-cell d"><div className="l">DEATHS</div><div className="v">{p.kda.d}</div></div>
        <div className="kda-cell a"><div className="l">ASSISTS</div><div className="v">{p.kda.a}</div></div>
      </div>
      <div className="perf-row">
        <div className="kda-cell gpm"><div className="l">GPM</div><div className="v">{p.perf.gpm}</div></div>
        <div className="kda-cell xpm"><div className="l">XPM</div><div className="v">{p.perf.xpm}</div></div>
        <div className="kda-cell apm"><div className="l">APM</div><div className="v">{p.perf.apm}</div></div>
      </div>

      <div className="last20-wrap">
        <div className="last20-head"><span>LAST 20</span><span>{p.last20Score}</span></div>
        <div className="last20-row">
          {last20.map((c, i) => <div key={i} className={`pip ${c}`}>{c}</div>)}
        </div>
        <_Spark data={sparkData} color={p.accentHex} />
      </div>

      <div className="heroes-list">
        <div className="heroes-head">SIGNATURE HEROES</div>
        {p.heroes.map((h) => (
          <div className="hero-row" key={h.name}>
            <div className="heroimg">{h.img}</div>
            <div className="hname">{h.name}</div>
            <div className={`hwr ${h.wr >= 55 ? 'good' : h.wr >= 49 ? 'mid' : 'bad'}`}>{h.wr}%</div>
            <div className="hgames">{h.games}</div>
          </div>
        ))}
      </div>

      {dissStyle !== 'off' && (
        <div className="inline-diss">{diss}</div>
      )}
    </div>
  );
}

function SquadPage({ onSelectPlayer, dissStyle }) {
  const s = window.SQUAD_STATS;
  return (
    <div>
      <div className="hero-stats">
        <_Donut pct={s.winRate} label="SQUAD WR" color="#39ff88" />
        <div className="stat-tile"><div className="v">{s.totalGames.toLocaleString()}</div><div className="l">TOTAL GAMES</div></div>
        <div className="stat-tile"><div className="v">{s.avgKDA.toFixed(1)}</div><div className="l">AVG KDA</div></div>
        <div className="stat-tile"><div className="v">{s.heroesPlayed}</div><div className="l">HEROES PLAYED</div></div>
        <div className="stat-tile" style={{borderColor:'var(--blood)'}}>
          <div className="v" style={{color:'var(--blood)'}}>{s.totalLosses.toLocaleString()}</div>
          <div className="l">L COLUMN</div>
        </div>
      </div>

      <div className="section-eyebrow">PLAYER PROFILES // 4 SUBJECTS UNDER SURVEILLANCE</div>
      <div className="players-grid">
        {window.SQUAD.map((p) => (
          <PlayerCard key={p.id} p={p} onSelect={onSelectPlayer} dissStyle={dissStyle} />
        ))}
      </div>

      <div className="section-eyebrow">ANALYTICS // EVIDENCE</div>
      <RadarChart />
    </div>
  );
}

// Radar chart
function RadarChart() {
  const players = window.SQUAD;
  const axes = ['KILLS','DEATHS','ASSISTS','GPM','XPM','APM'];
  // normalize values across players
  const maxes = {
    KILLS:  Math.max(...players.map(p => p.kda.k)),
    DEATHS: Math.max(...players.map(p => p.kda.d)),
    ASSISTS:Math.max(...players.map(p => p.kda.a)),
    GPM:    Math.max(...players.map(p => p.perf.gpm)),
    XPM:    Math.max(...players.map(p => p.perf.xpm)),
    APM:    Math.max(...players.map(p => p.perf.apm)),
  };
  const get = (p, axis) => {
    if (axis==='KILLS') return p.kda.k/maxes.KILLS;
    if (axis==='DEATHS') return p.kda.d/maxes.DEATHS;
    if (axis==='ASSISTS') return p.kda.a/maxes.ASSISTS;
    if (axis==='GPM') return p.perf.gpm/maxes.GPM;
    if (axis==='XPM') return p.perf.xpm/maxes.XPM;
    if (axis==='APM') return p.perf.apm/maxes.APM;
  };
  const cx=200, cy=200, r=150;
  const angleFor = (i) => -Math.PI/2 + (i/axes.length)*Math.PI*2;

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h4>PLAYER COMPARISON RADAR</h4>
        <div className="legend">
          {players.map(p => <span key={p.id} style={{'--c': p.accentHex, color: p.accentHex}}>{p.nameShort||p.name}</span>)}
        </div>
        <svg viewBox="0 0 400 400" style={{width:'100%', height:'auto'}}>
          {[0.25, 0.5, 0.75, 1].map((f, i) => {
            const pts = axes.map((_, ai) => {
              const a = angleFor(ai);
              return `${cx + Math.cos(a)*r*f},${cy + Math.sin(a)*r*f}`;
            }).join(' ');
            return <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>;
          })}
          {axes.map((ax, i) => {
            const a = angleFor(i);
            const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
            const lx = cx + Math.cos(a)*(r+20), ly = cy + Math.sin(a)*(r+20);
            return (
              <g key={ax}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)"/>
                <text x={lx} y={ly} fill="var(--fg-2)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="middle">{ax}</text>
              </g>
            );
          })}
          {players.map((p) => {
            const pts = axes.map((ax, ai) => {
              const a = angleFor(ai);
              const v = get(p, ax);
              return `${cx + Math.cos(a)*r*v},${cy + Math.sin(a)*r*v}`;
            }).join(' ');
            return (
              <g key={p.id}>
                <polygon points={pts} fill={p.accentHex} fillOpacity="0.12" stroke={p.accentHex} strokeWidth="2"
                  style={{filter: `drop-shadow(0 0 8px ${p.accentHex})`}} />
                {axes.map((ax, ai) => {
                  const a = angleFor(ai);
                  const v = get(p, ax);
                  return <circle key={ai} cx={cx + Math.cos(a)*r*v} cy={cy + Math.sin(a)*r*v} r="3" fill={p.accentHex}/>;
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-card">
        <h4>WIN RATE BREAKDOWN</h4>
        <div className="legend">
          <span style={{color:'var(--acid)', '--c':'#39ff88'}}>WINS</span>
          <span style={{color:'var(--blood)', '--c':'#ff2d4a'}}>LOSSES</span>
        </div>
        <WinRateBars />
      </div>
    </div>
  );
}

function WinRateBars() {
  const players = window.SQUAD;
  const max = Math.max(...players.map(p => p.games));
  const w = 400, h = 260;
  const barW = 50, gap = 30;
  const startX = 50;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%', height:260}}>
      {[0,0.25,0.5,0.75,1].map((f, i) => {
        const y = 30 + (h-60) * (1-f);
        return <g key={i}>
          <line x1="40" y1={y} x2={w-10} y2={y} stroke="rgba(255,255,255,0.08)" />
          <text x="36" y={y+3} fontSize="9" fill="var(--fg-2)" fontFamily="var(--font-mono)" textAnchor="end">{Math.round(max*f).toLocaleString()}</text>
        </g>;
      })}
      {players.map((p, i) => {
        const x = startX + i * (barW + gap);
        const wins = p.games * (p.winRate/100);
        const losses = p.games - wins;
        const wH = (wins/max)*(h-60), lH = (losses/max)*(h-60);
        const yLoss = 30 + (h-60) - lH;
        const yWin  = yLoss - wH;
        return (
          <g key={p.id}>
            <rect x={x} y={yLoss} width={barW} height={lH} fill="#ff2d4a" opacity="0.85" />
            <rect x={x} y={yWin}  width={barW} height={wH} fill="#39ff88" opacity="0.85" />
            <text x={x+barW/2} y={h-10} fontSize="10" fontFamily="var(--font-mono)" fill="var(--fog-1)" textAnchor="middle">{p.nameShort||p.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

window.SquadPage = SquadPage;
window.PlayerCard = PlayerCard;
