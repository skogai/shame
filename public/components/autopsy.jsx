// Match Autopsy — single-match scrolling shame report w/ animated timeline
const { useState: aUse, useEffect: aEff, useRef: aRef, useMemo: aMem } = React;

// Diss lines for THIS match
const MATCH_DISSES = {
  cold: [
    "MATCH 8785053226 :: 29:29 RUNTIME :: VERDICT — DEFEAT",
    "33 KILLS FOR :: 52 AGAINST :: A DIFFERENTIAL OF -19",
    "RADIANT TEAM CONTAINED 2 SUBJECTS OF INTEREST",
  ],
  skogix: {
    head: "EXHIBIT A :: SKOGIX :: UNDYING :: 7/11/12",
    bullets: [
      "11 deaths in 29 minutes. That's a death every 2 minutes 41 seconds. Buy a calendar.",
      "Furion killed you FOUR TIMES. The tree-jumper. Globally. You couldn't predict him with the in-game minimap pinging.",
      "346 max hit. The enemy carry hit for 606. The carry. With items. Not a stun. Just damage.",
      "Tower damage: 203. A creep wave does more by accident.",
      "Stuns inflicted: 0.0. ZERO. Undying has Decay AND Tombstone AND Soul Rip — the kit is built around team support and you contributed NOTHING TO LOCKDOWN.",
      "Wards placed: 0. Sentries: 0. The map was dark and you preferred it that way.",
      "Teamfight participation: 57.6%. You skipped FOUR of TEN fights. The team needed you. You needed a snack.",
    ],
    headline: "FOUNTAIN-AHOLIC. 11 DEATHS. PATIENT ZERO.",
  },
  zcope: {
    head: "EXHIBIT B :: ZCOPE :: LION :: 3/12/13",
    bullets: [
      "12 deaths on a position 4. The role with one job: don't die. You died TWELVE times.",
      "Furion killed you SIX TIMES. SIX. Same enemy. Same hero. Six separate occasions you walked up to the same tree-spawning trap.",
      "GPM: 299. Below 300. The COURIER has higher gold income.",
      "299 GPM and you bought a Force Staff. Which you used on yourself. Once. Into a Sprout. Genius.",
      "Last hits: 78. Denies: 7. As a support that's actually fine. As an excuse, it's not.",
      "1 buyback. Used at minute 22. Died 38 seconds later. Net result: -1500 gold + dignity.",
      "Cast 52.3 seconds of stuns. Furion was airborne for 0.0 of them. The stun was on the wrong people.",
    ],
    headline: "THE LION SLEPT. THE LION FED. THE LION COPED.",
  },
  villain: {
    head: "ENEMY CARRY :: NATURE'S PROPHET :: 20/4/16",
    bullets: [
      "767 GPM. 906 XPM. 34,639 hero damage. Killed Skogix 4×. Killed ZCOPE 6×. ONE HERO did this to TWO of you.",
      "Streaks: 3-kill ×4, 4-kill ×4, 5-kill ×3. He didn't get a streak. He WAS a streak.",
      "Treant Protectors don't run this fast.",
    ],
  },
  fights: [
    "1:12 — first fight. You traded 1-for-2. The only fight you'd 'win'. Enjoy it.",
    "21:57 — Radiant 4 dead, Dire 2 dead. The wheels weren't loose. The wheels were gone.",
    "27:22 — wiped 2-0. 28:25 — wiped 3-0. Furion farmed you like a buyout liquidation event.",
  ],
  closing: [
    "AFTER-ACTION REPORT :: COMPILED",
    "33 KILLS / 52 DEATHS / 1 GG NOT CALLED",
    "EVIDENCE FILED // 2 SUBJECTS GUILTY ON ALL COUNTS",
  ],
};

// ============== TIMELINE ANIMATION ==============
function MatchTimeline() {
  const m = window.MATCH;
  const [t, setT] = aUse(0);          // time in seconds
  const [playing, setPlaying] = aUse(true);
  const [speed, setSpeed] = aUse(8);  // 8x = 8 in-game seconds per real second

  aEff(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT(prev => {
        const next = prev + speed * 0.05;  // 50ms ticks
        return next > m.duration ? 0 : next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [playing, speed]);

  const W = 880, H = 280, PAD = { l: 50, r: 20, t: 20, b: 28 };
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  // gold/xp adv: array per minute
  const gAdv = m.radiant_gold_adv || [];
  const xAdv = m.radiant_xp_adv || [];
  const xMax = m.duration;
  const yMax = Math.max(Math.abs(Math.min(...gAdv)), Math.abs(Math.max(...gAdv)), 1) * 1.05;

  const x = (sec) => PAD.l + (sec / xMax) * innerW;
  const y = (val) => PAD.t + innerH/2 - (val/yMax) * (innerH/2);

  const goldPath = gAdv.map((v, i) => `${i===0?'M':'L'} ${x(i*60)} ${y(v)}`).join(' ');
  const xpPath = xAdv.map((v, i) => `${i===0?'M':'L'} ${x(i*60)} ${y(v)}`).join(' ');

  // Filter events up to current t
  const allEvents = [
    { t: 71, type: 'firstblood', label: 'FIRST BLOOD AGAINST' },
    { t: 634, type: 'tower', label: 'T1 BOT LOST' },
    { t: 888, type: 'tower', label: 'T1 MID LOST' },
    { t: 908, type: 'tower', label: 'T2 MID LOST' },
    ...(m.fights||[]).map(f => ({ t: f.start, type: 'fight', label: `FIGHT ${f.radDeaths}-${f.direDeaths}`, bad: f.radDeaths > f.direDeaths })),
    { t: 1567, type: 'event', label: 'SKOGIX MAX HIT 346' },
    { t: 1729, type: 'event', label: 'ENEMY HITS UNDYING FOR 384' },
    { t: 1762, type: 'crit', label: 'GG :: RADIANT THRONE FALLS' },
  ];
  const visible = allEvents.filter(e => e.t <= t);

  // Live agent commentary based on time
  const liveLine = aMem(() => {
    if (t < 75)  return ">> match begins :: 4 of 10 chatwheel-spammed before first creep";
    if (t < 200) return ">> first blood at 0:71 :: ZCOPE dies to Razor :: lane lost";
    if (t < 400) return ">> Skogix gold/xp curve flat :: undying farming has been described as 'creative'";
    if (t < 700) return ">> T1 bot taken :: enemy Nature's Prophet at 200 GPM advantage";
    if (t < 1000) return ">> mid towers falling in 20s window :: NO RADIANT DEFENSE LOGGED";
    if (t < 1300) return ">> ZCOPE has died 8 times :: Furion-on-Lion engagement counter: 4";
    if (t < 1500) return ">> Skogix at 7-11-X :: positive streak active :: surprising :: do not trust";
    if (t < 1700) return ">> 21:57 fight :: Radiant 4 dead :: confidence wavering";
    if (t < 1762) return ">> mass dispatch detected :: throne exposed :: end imminent";
    return ">> match ended :: GG NOT CALLED :: shame compiled";
  }, [t]);

  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <span style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.3em', color:'var(--fg-2)'}}>
          ▸ MINUTE-BY-MINUTE EVIDENCE :: GOLD ADVANTAGE (red below = behind)
        </span>
        <div style={{display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-mono)', fontSize:11}}>
          <button onClick={() => setPlaying(p => !p)} style={{background:'transparent', border:'1px solid var(--cyan)', color:'var(--cyan)', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-mono)', letterSpacing:'0.2em'}}>
            {playing ? '❚❚ PAUSE' : '▶ PLAY'}
          </button>
          <span style={{color:'var(--hazard)'}}>T+{Math.floor(t/60)}:{String(Math.floor(t%60)).padStart(2,'0')}</span>
          <button onClick={() => setSpeed(s => s===2 ? 8 : s===8 ? 16 : 2)} style={{background:'transparent', border:'1px solid var(--magenta)', color:'var(--magenta)', padding:'4px 8px', cursor:'pointer', fontFamily:'var(--font-mono)'}}>{speed}×</button>
        </div>
      </div>

      <div style={{background:'#000', border:'1px solid rgba(0,229,255,0.3)', clipPath:'polygon(10px 0,100% 0,100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)', padding:8}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto', display:'block'}}>
          {/* gridlines */}
          {[-1,-0.5,0,0.5,1].map((f,i) => (
            <g key={i}>
              <line x1={PAD.l} y1={PAD.t + innerH/2 - f*(innerH/2)} x2={W-PAD.r} y2={PAD.t + innerH/2 - f*(innerH/2)} stroke="rgba(255,255,255,0.06)" />
              <text x={PAD.l - 6} y={PAD.t + innerH/2 - f*(innerH/2) + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--fg-2)" textAnchor="end">{f === 0 ? 'EVEN' : (f>0?'+':'') + Math.round(f*yMax/1000) + 'k'}</text>
            </g>
          ))}
          {/* zero line */}
          <line x1={PAD.l} y1={PAD.t + innerH/2} x2={W-PAD.r} y2={PAD.t + innerH/2} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3"/>
          {/* x labels (minutes) */}
          {[0, 5, 10, 15, 20, 25, 29].map(min => (
            <g key={min}>
              <line x1={x(min*60)} y1={H-PAD.b} x2={x(min*60)} y2={H-PAD.b+4} stroke="var(--fg-2)" />
              <text x={x(min*60)} y={H - PAD.b + 16} fontSize="9" fontFamily="var(--font-mono)" fill="var(--fg-2)" textAnchor="middle">{min}'</text>
            </g>
          ))}

          {/* gold + xp paths — clip to current time */}
          <defs>
            <clipPath id="revealClip">
              <rect x={PAD.l} y={0} width={Math.max(0, x(t) - PAD.l)} height={H} />
            </clipPath>
            <linearGradient id="badShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,45,74,0)" />
              <stop offset="100%" stopColor="rgba(255,45,74,0.4)" />
            </linearGradient>
          </defs>

          {/* shaded area below 0 = enemy gold lead */}
          <path d={`${goldPath} L ${x((gAdv.length-1)*60)} ${PAD.t + innerH/2} L ${x(0)} ${PAD.t + innerH/2} Z`}
            fill="url(#badShade)" clipPath="url(#revealClip)" opacity="0.6"/>

          <path d={xpPath} fill="none" stroke="var(--magenta)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" clipPath="url(#revealClip)" />
          <path d={goldPath} fill="none" stroke="var(--blood)" strokeWidth="2.5" clipPath="url(#revealClip)"
            style={{filter: 'drop-shadow(0 0 6px rgba(255,45,74,0.8))'}}/>

          {/* time cursor */}
          <line x1={x(t)} y1={PAD.t} x2={x(t)} y2={H-PAD.b} stroke="var(--cyan)" strokeWidth="1.5"
            style={{filter:'drop-shadow(0 0 4px var(--cyan))'}}/>

          {/* events */}
          {visible.map((e, i) => {
            const fill = e.type==='firstblood' ? '#f2ff00' : e.type==='tower' ? '#ff2bd6' : e.type==='crit' ? '#ff2d4a' : e.bad ? '#ff2d4a' : '#39ff88';
            return (
              <g key={i}>
                <line x1={x(e.t)} y1={PAD.t} x2={x(e.t)} y2={H-PAD.b} stroke={fill} strokeWidth="0.5" opacity="0.4" strokeDasharray="2 2"/>
                <circle cx={x(e.t)} cy={PAD.t + 8} r="4" fill={fill} style={{filter: `drop-shadow(0 0 6px ${fill})`}}/>
                {i === visible.length - 1 && (
                  <g>
                    <rect x={x(e.t) + 6} y={PAD.t} width={130} height={16} fill="rgba(0,0,0,0.85)" stroke={fill} />
                    <text x={x(e.t) + 11} y={PAD.t + 11} fontSize="9" fontFamily="var(--font-mono)" fill={fill} letterSpacing="0.1em">{e.label}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* legend */}
          <g transform={`translate(${PAD.l}, ${H - 4})`}>
            <text fontSize="9" fontFamily="var(--font-mono)" fill="var(--blood)">— RADIANT GOLD ADV</text>
            <text x="160" fontSize="9" fontFamily="var(--font-mono)" fill="var(--magenta)">--- RADIANT XP ADV</text>
          </g>
        </svg>
      </div>

      {/* Live commentary */}
      <div style={{marginTop: 10, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--cyan)', padding:'8px 12px', background:'rgba(0,229,255,0.06)', borderLeft:'2px solid var(--cyan)'}}>
        <span style={{color:'var(--fg-muted)', marginRight:8}}>[live] ::</span>{liveLine}
      </div>
    </div>
  );
}

// ============== KILL TRADE GRAPH ==============
function KillsRow() {
  const m = window.MATCH;
  const r = m.radiant_score, d = m.dire_score;
  const total = r + d;
  return (
    <div style={{display:'flex', alignItems:'stretch', gap:0, height:48, fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, marginTop:16, border:'1px solid var(--border)'}}>
      <div style={{flex: r/total, background:'linear-gradient(90deg, rgba(57,255,136,0.25), rgba(57,255,136,0.1))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--acid)', borderRight:'1px solid var(--border)'}}>
        RADIANT · {r}
      </div>
      <div style={{flex: d/total, background:'linear-gradient(90deg, rgba(255,45,74,0.1), rgba(255,45,74,0.4))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--blood)'}}>
        {d} · DIRE
      </div>
    </div>
  );
}

// ============== KILLED-BY HEATMAP ==============
function KilledByCard({ data, name, color }) {
  const heroes = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  const total = heroes.reduce((s,[,c])=>s+c, 0);
  const heroDisplayMap = {
    'npc_dota_hero_furion':         "Nature's Prophet",
    'npc_dota_hero_warlock':        'Warlock',
    'npc_dota_hero_drow_ranger':    'Drow Ranger',
    'npc_dota_hero_razor':          'Razor',
    'npc_dota_hero_vengefulspirit': 'Vengeful Spirit',
  };
  return (
    <div style={{flex:1}}>
      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.25em', color:'var(--fg-2)', marginBottom:8}}>
        ▸ KILLED-BY LEDGER :: {name} :: {total} DEATHS
      </div>
      {heroes.map(([h, c]) => (
        <div key={h} style={{display:'grid', gridTemplateColumns:'140px 1fr 30px', gap:8, alignItems:'center', marginBottom:6}}>
          <div style={{fontFamily:'var(--font-body)', fontSize:13, color: c >= 4 ? color : 'var(--fog-1)', fontWeight: c>=4?700:400}}>{heroDisplayMap[h]||h}</div>
          <div style={{height:10, background:'var(--void-3)', position:'relative'}}>
            <div style={{position:'absolute', inset:0, width:`${(c/total)*100}%`, background: c >= 4 ? color : 'var(--fog-3)', boxShadow: c>=4 ? `0 0 6px ${color}` : 'none'}}></div>
          </div>
          <div style={{fontFamily:'var(--font-mono)', fontWeight:700, color: c>=4?color:'var(--fog-1)'}}>{c}×</div>
        </div>
      ))}
    </div>
  );
}

// ============== STAT REVEAL CARD ==============
function StatReveal({ label, value, max, format = (v) => v, color, bad }) {
  const [v, setV] = aUse(0);
  aEff(() => {
    let raf, start;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 1200);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div style={{padding:'12px 16px', background:'rgba(11,13,21,0.7)', border:`1px solid ${bad ? 'rgba(255,45,74,0.4)' : 'var(--border)'}`, clipPath:'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'}}>
      <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:'var(--fg-2)'}}>{label}</div>
      <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:30, color: color || (bad?'var(--blood)':'var(--fog-0)'), textShadow: bad?'0 0 10px rgba(255,45,74,0.5)':'none', lineHeight:1, marginTop:4}}>
        {format(v)}
      </div>
      {max != null && (
        <div style={{height:3, background:'var(--void-3)', marginTop:8}}>
          <div style={{width: `${Math.min(100,(v/max)*100)}%`, height:'100%', background: bad?'var(--blood)':'var(--cyan)', boxShadow: bad?'0 0 6px var(--blood)':'0 0 6px var(--cyan)'}}></div>
        </div>
      )}
    </div>
  );
}

// ============== EXHIBIT (per-villain card) ==============
function Exhibit({ tag, p, dissBlock, accent, role }) {
  return (
    <div style={{
      background:'rgba(11,13,21,0.85)', border:`1px solid ${accent}40`,
      padding:'24px 28px', position:'relative', overflow:'hidden',
      clipPath:'polygon(14px 0,100% 0,100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      marginTop:24,
    }}>
      <div style={{position:'absolute', top:0, left:14, right:0, height:3, background:accent, boxShadow:`0 0 14px ${accent}`}}></div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12}}>
        <div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.4em', color:accent}}>{tag}</div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:38, color:accent, textShadow:`0 0 18px ${accent}80`, marginTop:4, lineHeight:1}}>
            {p.name}
          </div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:13, color:'var(--fog-1)', marginTop:6, letterSpacing:'0.1em'}}>
            ▸ HERO: {p.hero} &nbsp; ▸ ROLE: {role}
          </div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:42, marginTop:14, color:'var(--fog-0)'}}>
            <span style={{color:'var(--acid)'}}>{p.k}</span>
            <span style={{color:'var(--fog-3)', margin:'0 8px'}}>/</span>
            <span style={{color:'var(--blood)', textShadow:'0 0 14px rgba(255,45,74,0.6)'}}>{p.d}</span>
            <span style={{color:'var(--fog-3)', margin:'0 8px'}}>/</span>
            <span style={{color:'var(--cyan)'}}>{p.a}</span>
          </div>
        </div>

        <div style={{padding:'16px 20px', border:`2px solid ${accent}`, background:`${accent}10`, clipPath:'polygon(10px 0,100% 0,100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)', maxWidth:380}}>
          <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:accent, marginBottom:6}}>HEADLINE VERDICT</div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--fog-0)', lineHeight:1.2}}>{dissBlock.headline}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:24}}>
        <StatReveal label="GPM" value={p.gpm} max={1000} bad={p.gpm < 400} />
        <StatReveal label="XPM" value={p.xpm} max={1000} bad={p.xpm < 500} />
        <StatReveal label="LAST HITS" value={p.lh} max={300} bad={p.lh < 100} />
        <StatReveal label="HERO DMG" value={p.hero_dmg} max={40000} format={(v)=>Math.round(v).toLocaleString()} bad={p.hero_dmg < 12000}/>
        <StatReveal label="HEALING" value={p.healing} max={10000} format={(v)=>Math.round(v).toLocaleString()} bad={p.healing < 500}/>
        <StatReveal label="STUNS (s)" value={p.stuns} max={120} format={(v)=>v.toFixed(1)} bad={p.stuns < 10}/>
        <StatReveal label="WARDS" value={p.obs + p.sen} max={30} bad={(p.obs+p.sen) < 5}/>
        <StatReveal label="FIGHT %" value={p.fight_part * 100} max={100} format={(v)=>v.toFixed(0)+'%'} bad={p.fight_part < 0.6}/>
      </div>

      <div style={{marginTop:20, fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.3em', color:'var(--fg-2)', marginBottom:8}}>
        ▸ CHARGES — READ INTO THE RECORD
      </div>
      <div style={{borderLeft:`2px solid ${accent}`, paddingLeft:14}}>
        {dissBlock.bullets.map((b, i) => (
          <div key={i} style={{
            fontFamily:'var(--font-body)', fontSize:14, color:'var(--fog-1)',
            margin:'0 0 8px 0', lineHeight:1.5,
            animation:`fadeUp 600ms ${i*150}ms both var(--ease-cyber)`,
          }}>
            <span style={{color:accent, fontWeight:700, marginRight:8, fontFamily:'var(--font-mono)'}}>§{i+1}</span>{b}
          </div>
        ))}
      </div>

      <div style={{marginTop:16}}>
        <KilledByCard data={p.killed_by} name={p.name.toUpperCase()} color={accent} />
      </div>
    </div>
  );
}

// ============== PAGE ==============
function MatchAutopsyPage() {
  const m = window.MATCH;
  const dur = `${Math.floor(m.duration/60)}:${String(m.duration%60).padStart(2,'0')}`;
  return (
    <div>
      {/* Cold open */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'radial-gradient(ellipse at center, rgba(255,45,74,0.15) 0%, transparent 60%), rgba(11,13,21,0.6)',
        border:'1px solid rgba(255,45,74,0.4)',
        padding:'48px 32px', textAlign:'center',
        clipPath:'polygon(16px 0,100% 0,100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
      }}>
        <div style={{position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, rgba(255,45,74,0.04) 0 1px, transparent 1px 3px)', pointerEvents:'none'}}></div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.4em', color:'var(--fg-2)', marginBottom:8}}>
          // POST-GAME AUTOPSY :: MATCH ID 8785053226
        </div>
        <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(60px, 9vw, 140px)', color:'rgba(255,45,74,0.7)', textShadow:'0 0 32px rgba(255,45,74,0.6)', letterSpacing:'0.05em', lineHeight:0.95}}>
          DEFEAT
        </div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:13, letterSpacing:'0.3em', color:'var(--fog-1)', marginTop:12}}>
          DURATION {dur} &nbsp;·&nbsp; FINAL {m.radiant_score}–{m.dire_score} &nbsp;·&nbsp; FIRST BLOOD AT 0:{m.first_blood_time}
        </div>
        <KillsRow />
        <div style={{display:'flex', gap:14, justifyContent:'center', marginTop:24, flexWrap:'wrap'}}>
          {MATCH_DISSES.cold.map((c, i) => (
            <div key={i} style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--blood)', letterSpacing:'0.2em', padding:'6px 10px', border:'1px solid rgba(255,45,74,0.3)', background:'rgba(255,45,74,0.05)'}}>{c}</div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="section-eyebrow">PHASE 01 // TIMELINE OF EVENTS — PLAY ▶ TO WATCH IT UNRAVEL</div>
      <div style={{padding:18, background:'rgba(11,13,21,0.7)', border:'1px solid var(--border)', clipPath:'polygon(12px 0,100% 0,100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'}}>
        <MatchTimeline />
      </div>

      {/* Exhibit A: Skogix */}
      <div className="section-eyebrow">PHASE 02 // SUSPECT IDENTIFICATION — TWO PERSONS OF INTEREST</div>
      <Exhibit tag="EXHIBIT A" p={m.skogix} dissBlock={MATCH_DISSES.skogix} accent="#ff2d4a" role="POSITION 5 (SUPPORT)" />

      {/* Exhibit B: ZCOPE */}
      <Exhibit tag="EXHIBIT B" p={m.zcope} dissBlock={MATCH_DISSES.zcope} accent="#00e5ff" role="POSITION 4 (SOFT SUPPORT)" />

      {/* The villain */}
      <div className="section-eyebrow">PHASE 03 // THE PERPETRATOR — IDENTIFIED, NOT APPREHENDED</div>
      <div style={{
        background:'rgba(11,13,21,0.85)', border:'1px solid rgba(242,255,0,0.3)',
        padding:'24px 28px', clipPath:'polygon(14px 0,100% 0,100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}>
        <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.4em', color:'var(--hazard)'}}>WANTED :: STILL AT LARGE</div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6, flexWrap:'wrap', gap:16}}>
          <div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:36, color:'var(--hazard)', textShadow:'0 0 14px rgba(242,255,0,0.5)', lineHeight:1}}>Бабайка</div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:13, color:'var(--fog-1)', marginTop:4}}>NATURE'S PROPHET (FURION) :: enemy carry</div>
          </div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:48, color:'var(--fog-0)'}}>
            <span style={{color:'var(--acid)'}}>20</span>
            <span style={{color:'var(--fog-3)', margin:'0 8px'}}>/</span>
            <span style={{color:'var(--blood)'}}>4</span>
            <span style={{color:'var(--fog-3)', margin:'0 8px'}}>/</span>
            <span style={{color:'var(--cyan)'}}>16</span>
          </div>
        </div>
        <div style={{marginTop:16, padding:14, background:'rgba(242,255,0,0.06)', borderLeft:'2px solid var(--hazard)'}}>
          {MATCH_DISSES.villain.bullets.map((b, i) => (
            <div key={i} style={{fontFamily:'var(--font-body)', fontSize:14, color:'var(--fog-1)', lineHeight:1.5, marginBottom:6}}>
              <span style={{color:'var(--hazard)', fontFamily:'var(--font-mono)', fontWeight:700, marginRight:8}}>›</span>{b}
            </div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:16}}>
          <div style={{padding:'10px 12px', background:'rgba(11,13,21,0.7)', border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:'var(--fg-2)'}}>GPM</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color:'var(--hazard)'}}>767</div>
          </div>
          <div style={{padding:'10px 12px', background:'rgba(11,13,21,0.7)', border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:'var(--fg-2)'}}>HERO DMG</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color:'var(--hazard)'}}>34,639</div>
          </div>
          <div style={{padding:'10px 12px', background:'rgba(11,13,21,0.7)', border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:'var(--fg-2)'}}>STREAKS</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color:'var(--hazard)'}}>3×4 4×4 5×3</div>
          </div>
          <div style={{padding:'10px 12px', background:'rgba(11,13,21,0.7)', border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em', color:'var(--fg-2)'}}>KILLS ON YOUR DUO</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color:'var(--hazard)'}}>10 / 11</div>
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="section-eyebrow">PHASE 04 // VERDICT — FILED</div>
      <div style={{
        background:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,45,74,0.3)',
        padding:'32px 28px', textAlign:'center',
        clipPath:'polygon(14px 0,100% 0,100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}>
        {MATCH_DISSES.closing.map((c, i) => (
          <div key={i} style={{fontFamily:'var(--font-display)', fontWeight: i===1?900:700, fontSize: i===1?28:14, color: i===1?'var(--blood)':'var(--fog-1)', letterSpacing:'0.25em', marginBottom:8, textShadow: i===1?'0 0 14px rgba(255,45,74,0.5)':'none'}}>
            {c}
          </div>
        ))}
        <div style={{marginTop:16, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-2)', letterSpacing:'0.3em'}}>
          // SIGNED ▸ skogai shame-engine v0.42 // {dur} of evidence reviewed
        </div>
      </div>
    </div>
  );
}

// fadeUp keyframe injection
if (!document.getElementById('autopsy-anim')) {
  const s = document.createElement('style');
  s.id = 'autopsy-anim';
  s.textContent = '@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }';
  document.head.appendChild(s);
}

window.MatchAutopsyPage = MatchAutopsyPage;
