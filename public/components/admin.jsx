// Admin panel — hidden editor for all the trash talk.
// Open with ~ (tilde) key. Password-gated. Saves to Cloudflare Worker.
// If __WORKER_URL__ is empty, runs in offline preview mode (changes don't persist).

const { useState: aS, useEffect: aE, useRef: aR, useMemo: aM } = React;

function AdminPanel() {
  const [open, setOpen] = aS(false);
  const [authed, setAuthed] = aS(() => sessionStorage.getItem('shame_admin') === '1');
  const [pw, setPw] = aS('');
  const [tab, setTab] = aS('disses');
  const [status, setStatus] = aS('');
  const [dirty, setDirty] = aS(false);

  // Editable copies of all the data
  const [disses, setDisses] = aS(() => JSON.parse(JSON.stringify(window.DISSES || {})));
  const [squad, setSquad] = aS(() => ({ squad: window.SQUAD || [], stats: window.SQUAD_STATS || {} }));
  const [shame, setShame] = aS(() => ({
    feeders: window.SHAME_FEEDERS || [],
    kda: window.SHAME_KDA || [],
    duration: window.SHAME_DURATION || [],
    fountain: window.SHAME_FOUNTAIN || [],
  }));
  const [match, setMatch] = aS(() => window.MATCH || {});

  // Tilde toggle
  aE(() => {
    function onKey(e) {
      if (e.key === '~' || e.key === '`') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        setOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const WORKER = window.__WORKER_URL__;
  const offline = !WORKER;

  async function login() {
    if (offline) {
      // local preview, any password works
      sessionStorage.setItem('shame_admin', '1');
      sessionStorage.setItem('shame_token', pw);
      setAuthed(true);
      return;
    }
    try {
      const r = await fetch(WORKER + '/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) { setStatus('rejected: ' + r.status); return; }
      sessionStorage.setItem('shame_admin', '1');
      sessionStorage.setItem('shame_token', pw);
      setAuthed(true);
      setStatus('authenticated');
    } catch (e) { setStatus('error: ' + e.message); }
  }

  async function save(key, payload) {
    setDirty(false);
    if (offline) {
      setStatus('OFFLINE :: changes are local only :: deploy worker to persist');
      // still update window.* so live UI reflects edits
      applyToWindow(key, payload);
      return;
    }
    setStatus('saving ' + key + '...');
    try {
      const r = await fetch(WORKER + '/data/' + key, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer ' + sessionStorage.getItem('shame_token'),
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { setStatus('SAVE FAILED :: http ' + r.status); return; }
      setStatus('saved ' + key + ' :: live in ~5s');
      applyToWindow(key, payload);
    } catch (e) { setStatus('error: ' + e.message); }
  }

  function applyToWindow(key, payload) {
    if (key === 'disses') window.DISSES = payload;
    if (key === 'squad') { window.SQUAD = payload.squad; window.SQUAD_STATS = payload.stats; }
    if (key === 'shame') {
      window.SHAME_FEEDERS = payload.feeders;
      window.SHAME_KDA = payload.kda;
      window.SHAME_DURATION = payload.duration;
      window.SHAME_FOUNTAIN = payload.fountain;
    }
    if (key === 'match') window.MATCH = payload;
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontFamily:'var(--font-display)', fontWeight:900, color:'var(--blood)', letterSpacing:'0.3em', fontSize:14}}>
            ▓ SHAME.ADMIN ▓
          </span>
          {authed && (
            <span style={{fontFamily:'var(--font-mono)', fontSize:10, color: offline ? 'var(--hazard)' : 'var(--acid)', letterSpacing:'0.2em'}}>
              {offline ? '◉ OFFLINE PREVIEW' : '◉ CONNECTED'}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(false)} style={closeBtn}>✕ CLOSE [~]</button>
      </div>

      {!authed ? (
        <div style={{padding:'40px 24px', textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-2)', letterSpacing:'0.3em', marginBottom:16}}>
            // CLEARANCE REQUIRED
          </div>
          <input type="password" autoFocus value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="passcode"
            style={{background:'#000', border:'1px solid var(--cyan)', color:'var(--cyan)', padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:14, letterSpacing:'0.2em', width:300, textAlign:'center'}}/>
          <button onClick={login} style={{...btnPrimary, marginLeft:8}}>AUTH</button>
          {status && <div style={{marginTop:12, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--blood)'}}>{status}</div>}
          {offline && (
            <div style={{marginTop:24, padding:12, background:'rgba(242,255,0,0.05)', border:'1px solid var(--hazard)', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--hazard)', maxWidth:480, marginLeft:'auto', marginRight:'auto', lineHeight:1.6, letterSpacing:'0.1em'}}>
              ⚠ NO WORKER CONFIGURED — any password unlocks local preview only.<br/>
              See deploy/DEPLOY.md to set up persistence.
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={tabsStyle}>
            {[
              ['disses', 'TRASH TALK'],
              ['squad', 'SQUAD'],
              ['shame', 'WALL OF SHAME'],
              ['match', 'MATCH AUTOPSY'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                ...tabBtn,
                color: tab === k ? 'var(--cyan)' : 'var(--fog-2)',
                borderBottom: tab === k ? '2px solid var(--cyan)' : '2px solid transparent',
              }}>{l}</button>
            ))}
          </div>

          <div style={contentStyle}>
            {tab === 'disses' && <DissesEditor data={disses} onChange={d => { setDisses(d); setDirty(true); }} />}
            {tab === 'squad' && <JsonEditor label="squad.json" data={squad} onChange={d => { setSquad(d); setDirty(true); }} />}
            {tab === 'shame' && <JsonEditor label="shame.json" data={shame} onChange={d => { setShame(d); setDirty(true); }} />}
            {tab === 'match' && <JsonEditor label="match.json" data={match} onChange={d => { setMatch(d); setDirty(true); }} />}
          </div>

          <div style={footerStyle}>
            <span style={{fontFamily:'var(--font-mono)', fontSize:11, color: dirty ? 'var(--hazard)' : 'var(--fg-2)', letterSpacing:'0.2em'}}>
              {dirty ? '● UNSAVED CHANGES' : '○ ALL SYNCED'}
              {status && <span style={{marginLeft:16, color:'var(--cyan)'}}>{status}</span>}
            </span>
            <button onClick={() => {
              const map = { disses, squad, shame, match };
              save(tab, map[tab]);
            }} style={btnPrimary}>SAVE {tab.toUpperCase()}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ============== DISSES EDITOR — friendlier than raw JSON ==============
function DissesEditor({ data, onChange }) {
  const [section, setSection] = aS('byPlayer');
  const sections = [
    ['byPlayer', 'PER PLAYER'],
    ['squad', 'MARQUEE TICKER'],
    ['terminal', 'AGENT TERMINAL'],
    ['byHero', 'PER HERO'],
    ['byStat', 'STAT-TRIGGERED'],
  ];

  function addLine() {
    const next = JSON.parse(JSON.stringify(data));
    if (section === 'byPlayer') {
      const player = Object.keys(next.byPlayer || {})[0] || 'skogix';
      next.byPlayer = next.byPlayer || {};
      next.byPlayer[player] = next.byPlayer[player] || [];
      next.byPlayer[player].push('');
    } else if (section === 'squad') {
      next.squad = next.squad || []; next.squad.push('');
    } else if (section === 'terminal') {
      next.terminal = next.terminal || []; next.terminal.push({ lvl: 'INFO', msg: '' });
    } else if (section === 'byHero') {
      next.byHero = next.byHero || {}; next.byHero['New Hero'] = '';
    } else if (section === 'byStat') {
      next.byStat = next.byStat || {}; next.byStat['newStat'] = '';
    }
    onChange(next);
  }

  return (
    <div>
      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}>
        {sections.map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)} style={{
            ...subTab,
            background: section === k ? 'rgba(0,229,255,0.12)' : 'transparent',
            color: section === k ? 'var(--cyan)' : 'var(--fog-2)',
            borderColor: section === k ? 'var(--cyan)' : 'var(--border)',
          }}>{l}</button>
        ))}
        <button onClick={addLine} style={{...subTab, marginLeft:'auto', color:'var(--acid)', borderColor:'var(--acid)'}}>+ ADD LINE</button>
      </div>

      {section === 'byPlayer' && Object.entries(data.byPlayer || {}).map(([pid, lines]) => (
        <div key={pid} style={{marginBottom:20}}>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.3em', color:'var(--blood)', marginBottom:6}}>
            ▸ {pid.toUpperCase()} ({lines.length} lines)
          </div>
          {lines.map((line, i) => (
            <DissLine key={i} value={line} onChange={v => {
              const next = JSON.parse(JSON.stringify(data));
              next.byPlayer[pid][i] = v;
              onChange(next);
            }} onDelete={() => {
              const next = JSON.parse(JSON.stringify(data));
              next.byPlayer[pid].splice(i, 1);
              onChange(next);
            }}/>
          ))}
          <button onClick={() => {
            const next = JSON.parse(JSON.stringify(data));
            next.byPlayer[pid].push('');
            onChange(next);
          }} style={addInline}>+ add line for {pid}</button>
        </div>
      ))}

      {section === 'squad' && (data.squad || []).map((line, i) => (
        <DissLine key={i} value={line} onChange={v => {
          const next = JSON.parse(JSON.stringify(data));
          next.squad[i] = v; onChange(next);
        }} onDelete={() => {
          const next = JSON.parse(JSON.stringify(data));
          next.squad.splice(i, 1); onChange(next);
        }}/>
      ))}

      {section === 'terminal' && (data.terminal || []).map((entry, i) => (
        <div key={i} style={{display:'flex', gap:6, marginBottom:6, alignItems:'stretch'}}>
          <select value={entry.lvl} onChange={e => {
            const next = JSON.parse(JSON.stringify(data));
            next.terminal[i].lvl = e.target.value; onChange(next);
          }} style={{...inputStyle, width:80}}>
            {['INFO','WARN','ERR','CRIT'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input value={entry.msg} onChange={e => {
            const next = JSON.parse(JSON.stringify(data));
            next.terminal[i].msg = e.target.value; onChange(next);
          }} style={{...inputStyle, flex:1}}/>
          <button onClick={() => {
            const next = JSON.parse(JSON.stringify(data));
            next.terminal.splice(i, 1); onChange(next);
          }} style={delBtn}>×</button>
        </div>
      ))}

      {section === 'byHero' && Object.entries(data.byHero || {}).map(([hero, line], i) => (
        <div key={hero} style={{display:'flex', gap:6, marginBottom:6}}>
          <input value={hero} readOnly style={{...inputStyle, width:160, opacity:0.6}}/>
          <input value={line} onChange={e => {
            const next = JSON.parse(JSON.stringify(data));
            next.byHero[hero] = e.target.value; onChange(next);
          }} style={{...inputStyle, flex:1}}/>
          <button onClick={() => {
            const next = JSON.parse(JSON.stringify(data));
            delete next.byHero[hero]; onChange(next);
          }} style={delBtn}>×</button>
        </div>
      ))}

      {section === 'byStat' && Object.entries(data.byStat || {}).map(([k, v]) => (
        <div key={k} style={{display:'flex', gap:6, marginBottom:6}}>
          <input value={k} readOnly style={{...inputStyle, width:160, opacity:0.6}}/>
          <input value={v} onChange={e => {
            const next = JSON.parse(JSON.stringify(data));
            next.byStat[k] = e.target.value; onChange(next);
          }} style={{...inputStyle, flex:1}}/>
        </div>
      ))}
    </div>
  );
}

function DissLine({ value, onChange, onDelete }) {
  return (
    <div style={{display:'flex', gap:6, marginBottom:4}}>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        rows={1}
        style={{...inputStyle, flex:1, resize:'vertical', minHeight:30}}/>
      <button onClick={onDelete} style={delBtn}>×</button>
    </div>
  );
}

// ============== JSON EDITOR — for squad / shame / match ==============
function JsonEditor({ label, data, onChange }) {
  const [text, setText] = aS(JSON.stringify(data, null, 2));
  const [err, setErr] = aS('');
  aE(() => { setText(JSON.stringify(data, null, 2)); }, [data]);

  function commit(t) {
    setText(t);
    try { onChange(JSON.parse(t)); setErr(''); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-2)', letterSpacing:'0.3em', marginBottom:6}}>
        ▸ EDITING {label} :: VALID JSON REQUIRED
      </div>
      <textarea value={text} onChange={e => commit(e.target.value)}
        spellCheck={false}
        style={{width:'100%', height:380, background:'#000', color:'var(--cyan)', border:'1px solid ' + (err ? 'var(--blood)' : 'var(--border)'),
          fontFamily:'var(--font-mono)', fontSize:12, padding:12, lineHeight:1.5, resize:'vertical'}}/>
      {err && <div style={{color:'var(--blood)', fontFamily:'var(--font-mono)', fontSize:11, marginTop:6}}>⚠ {err}</div>}
    </div>
  );
}

// ============== STYLES ==============
const panelStyle = {
  position:'fixed', inset:'40px', zIndex:10000,
  background:'rgba(11,13,21,0.98)', border:'1px solid var(--blood)',
  boxShadow:'0 0 60px rgba(255,45,74,0.3), inset 0 0 80px rgba(0,0,0,0.5)',
  display:'flex', flexDirection:'column',
  fontFamily:'var(--font-ui)',
  clipPath:'polygon(14px 0,100% 0,100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
};
const headerStyle = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'14px 20px', borderBottom:'1px solid var(--blood)',
  background:'linear-gradient(90deg, rgba(255,45,74,0.1), transparent)',
};
const closeBtn = {
  background:'transparent', border:'1px solid var(--fg-2)', color:'var(--fg-2)',
  padding:'4px 10px', fontFamily:'var(--font-mono)', fontSize:11, cursor:'pointer', letterSpacing:'0.2em',
};
const tabsStyle = {
  display:'flex', gap:0, padding:'0 20px', borderBottom:'1px solid var(--border)',
};
const tabBtn = {
  background:'transparent', border:'none', padding:'10px 16px',
  fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.2em', cursor:'pointer',
};
const subTab = {
  background:'transparent', border:'1px solid var(--border)', padding:'4px 10px',
  fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.15em', cursor:'pointer',
};
const contentStyle = {
  flex:1, overflowY:'auto', padding:'18px 20px',
};
const footerStyle = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'12px 20px', borderTop:'1px solid var(--border)', background:'rgba(0,0,0,0.4)',
};
const btnPrimary = {
  background:'var(--blood)', color:'#000', border:'none',
  padding:'8px 16px', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:12,
  letterSpacing:'0.2em', cursor:'pointer',
};
const inputStyle = {
  background:'#000', color:'var(--fog-0)', border:'1px solid var(--border)',
  padding:'6px 10px', fontFamily:'var(--font-mono)', fontSize:12,
};
const delBtn = {
  background:'transparent', border:'1px solid var(--blood)', color:'var(--blood)',
  width:30, cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:14,
};
const addInline = {
  background:'transparent', border:'1px dashed var(--fg-2)', color:'var(--fg-2)',
  padding:'4px 10px', fontFamily:'var(--font-mono)', fontSize:10, cursor:'pointer',
  letterSpacing:'0.2em', marginTop:4,
};

window.AdminPanel = AdminPanel;
