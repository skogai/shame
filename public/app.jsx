// Main app — DOTA2 HUB
const { Marquee, AgentTerminal, ToastBurns, ShameMeter } = window.SkogComponents;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intensity": 10,
  "scanlines": true,
  "flicker": true,
  "marquee": true,
  "agentTerminal": true,
  "toastBurns": true,
  "shameMeter": true,
  "dissStyle": "inline",
  "accentMode": "blood"
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = useState('squad');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : useState(TWEAK_DEFAULTS);

  // Manual tweaks plumbing if hook unavailable — fallback uses postMessage
  useEffect(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (k, v) => {
    if (typeof setTweaks === 'function') {
      setTweaks(prev => (typeof prev === 'object' && !Array.isArray(prev)) ? { ...prev, [k]: v } : { ...tweaks, [k]: v });
    }
    window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]: v}}, '*');
  };

  const handleSelectPlayer = (p) => {
    setSelectedPlayer(p.id);
    setTab('solo');
  };

  // marquee items — interleave squad burns + alerts
  const marqueeItems = useMemo(() => {
    const lines = window.DISSES.squad;
    return lines.map((m, i) => ({ msg: m, type: i%3===0 ? 'alert' : i%2===0 ? 'warn' : 'info' }));
  }, []);

  return (
    <div className="ds-root">
      {tweaks.scanlines && <div className={`crt-overlay ${tweaks.intensity >= 7 ? 'intense' : ''} ${tweaks.flicker ? 'crt-flicker' : ''}`}></div>}
      {tweaks.intensity >= 5 && <div className="noise"></div>}

      <div className="topbar">
        <div className="brand">
          <span className="glyph">DK</span>
          <span>DOTA2 HUB</span>
          <span style={{color:'var(--fg-2)', fontSize:11, letterSpacing:'0.2em', marginLeft:8, fontFamily:'var(--font-mono)', fontWeight:400}}>// shame.skogai.se</span>
        </div>
        <div className="topnav">
          {['squad','solo','draft','wall','autopsy','excuses','wrapped'].map(t => (
            <button key={t} className={tab===t ? 'active' : ''} onClick={() => setTab(t)}
              style={t === 'wrapped' ? {color: tab===t ? undefined : 'var(--blood)', textShadow: '0 0 8px rgba(255,45,74,0.6)'} : undefined}>
              {t === 'wall' ? 'Wall of Shame' : t === 'autopsy' ? 'Match Autopsy' : t === 'excuses' ? 'Excuses' : t === 'wrapped' ? '✦ Wrapped' : t}
            </button>
          ))}
        </div>
      </div>

      {tweaks.marquee && <Marquee items={marqueeItems} />}

      <div className="page">
        {/* Agent terminal pinned at top of every page */}
        {tweaks.agentTerminal && tab !== 'solo' && tab !== 'autopsy' && tab !== 'wrapped' && (
          <div style={{marginBottom: 24}}>
            <AgentTerminal enabled={true} />
          </div>
        )}

        {tab === 'squad' && <window.SquadPage onSelectPlayer={handleSelectPlayer} dissStyle={tweaks.dissStyle} />}
        {tab === 'solo' && <window.SoloPage initial={selectedPlayer || 'skogix'} />}
        {tab === 'draft' && <window.DraftPage />}
        {tab === 'wall' && <window.WallOfShame />}
        {tab === 'autopsy' && <window.MatchAutopsyPage />}
        {tab === 'excuses' && <window.ExcusePage />}
        {tab === 'wrapped' && <window.ShameWrappedPage />}

        <div style={{textAlign:'center', marginTop:48, padding:'24px 0', borderTop:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-2)', letterSpacing:'0.3em'}}>
          DATA :: OPENDOTA · DOTABUFF · STRATZ &nbsp;//&nbsp; SHAME :: COMPILED LOCALLY &nbsp;//&nbsp; v0.50 «SHAME WRAPPED — THE BIGGEST UPDATE IN DOTA-SHAME HISTORY» — skogai
        </div>
      </div>

      {tweaks.toastBurns && <ToastBurns enabled={true} />}
      {tweaks.shameMeter && <ShameMeter value={(window.SQUAD_STATS.lossRate)} />}

      {window.AdminPanel && <window.AdminPanel />}

      {tweaksOpen && <TweaksPanel tweaks={tweaks} update={updateTweak} onClose={() => {
        setTweaksOpen(false);
        window.parent.postMessage({type:'__edit_mode_dismissed'}, '*');
      }} />}
    </div>
  );
}

function TweaksPanel({ tweaks, update, onClose }) {
  return (
    <div style={{
      position:'fixed', top:80, right:20, width:300, zIndex:9500,
      background:'rgba(11,13,21,0.96)', border:'1px solid var(--cyan)',
      boxShadow:'0 0 24px rgba(0,229,255,0.3)', padding:16,
      clipPath:'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      fontFamily:'var(--font-ui)',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <span style={{fontFamily:'var(--font-display)', fontWeight:900, color:'var(--cyan)', letterSpacing:'0.2em'}}>TWEAKS</span>
        <button onClick={onClose} style={{background:'transparent', border:'1px solid var(--border)', color:'var(--fg-2)', padding:'2px 8px', cursor:'pointer'}}>X</button>
      </div>

      <TwSlider label="VISUAL INTENSITY" value={tweaks.intensity} min={0} max={10} onChange={v => update('intensity', v)} />
      <TwToggle label="SCANLINES" value={tweaks.scanlines} onChange={v => update('scanlines', v)} />
      <TwToggle label="CRT FLICKER" value={tweaks.flicker} onChange={v => update('flicker', v)} />
      <TwToggle label="MARQUEE TICKER" value={tweaks.marquee} onChange={v => update('marquee', v)} />
      <TwToggle label="AGENT TERMINAL" value={tweaks.agentTerminal} onChange={v => update('agentTerminal', v)} />
      <TwToggle label="TOAST BURNS" value={tweaks.toastBurns} onChange={v => update('toastBurns', v)} />
      <TwToggle label="SHAME METER" value={tweaks.shameMeter} onChange={v => update('shameMeter', v)} />
      <TwRadio label="INLINE DISS STYLE" value={tweaks.dissStyle} options={[
        {v:'inline', l:'Inline burns'}, {v:'off', l:'No inline (use toasts/log)'}
      ]} onChange={v => update('dissStyle', v)} />
    </div>
  );
}

function TwSlider({ label, value, min, max, onChange }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:10, letterSpacing:'0.2em', color:'var(--fg-2)', marginBottom:4}}>
        <span>{label}</span><span style={{color:'var(--cyan)'}}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} style={{width:'100%', accentColor:'var(--cyan)'}}/>
    </div>
  );
}
function TwToggle({ label, value, onChange }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
      <span style={{fontSize:11, letterSpacing:'0.15em', color:'var(--fog-1)'}}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        background: value ? 'var(--cyan)' : 'transparent',
        color: value ? '#000' : 'var(--fg-2)',
        border:'1px solid ' + (value ? 'var(--cyan)' : 'var(--border)'),
        fontFamily:'var(--font-mono)', fontSize:10, padding:'2px 10px', cursor:'pointer', letterSpacing:'0.2em',
      }}>{value ? 'ON' : 'OFF'}</button>
    </div>
  );
}
function TwRadio({ label, value, options, onChange }) {
  return (
    <div style={{marginBottom:8}}>
      <div style={{fontSize:10, letterSpacing:'0.2em', color:'var(--fg-2)', marginBottom:4}}>{label}</div>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          display:'block', width:'100%', textAlign:'left',
          background: value===o.v ? 'rgba(0,229,255,0.1)' : 'transparent',
          color: value===o.v ? 'var(--cyan)' : 'var(--fog-1)',
          border:'1px solid ' + (value===o.v ? 'var(--cyan)' : 'var(--border)'),
          padding:'4px 8px', fontFamily:'var(--font-ui)', fontSize:11, cursor:'pointer', marginBottom:2, letterSpacing:'0.1em'
        }}>{o.l}</button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
