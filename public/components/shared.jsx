// Shared building blocks for the dota2 hub
const { useState, useEffect, useRef, useMemo } = React;

// ====== TICKER MARQUEE ======
function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {doubled.map((it, i) => {
          const cls = it.type || (i % 4 === 0 ? 'alert' : i % 3 === 0 ? 'warn' : 'info');
          return <span key={i} className={cls}>{it.msg || it}</span>;
        })}
      </div>
    </div>
  );
}

// ====== AGENT TERMINAL — drip-feed log lines ======
function AgentTerminal({ enabled }) {
  const [lines, setLines] = useState([]);
  const idx = useRef(0);
  const lib = window.DISSES.terminal;

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const line = lib[idx.current % lib.length];
      idx.current += 1;
      const ts = new Date().toLocaleTimeString('en-GB');
      setLines((p) => {
        const next = [...p, { ...line, ts, id: idx.current }];
        return next.slice(-7);
      });
    };
    tick();
    const t = setInterval(tick, 1800);
    return () => clearInterval(t);
  }, [enabled]);

  return (
    <div className="agent-term">
      <div className="term-head">
        <span><span className="dot" style={{display:'inline-block', marginRight:6, verticalAlign:'middle'}}></span>SKOGAI :: SHAME-ENGINE v0.42</span>
        <span>STREAM ▸ LIVE</span>
      </div>
      {lines.map((l) => (
        <div className="term-line" key={l.id}>
          <span className="ts">[{l.ts}]</span>
          <span className={`lvl ${l.lvl}`}>{l.lvl}</span>
          <span className="msg">{l.msg}</span>
        </div>
      ))}
      <span className="term-cursor"></span>
    </div>
  );
}

// ====== TOAST DISSES ======
function ToastBurns({ enabled }) {
  const [toasts, setToasts] = useState([]);
  const idx = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const all = [];
    Object.entries(window.DISSES.byPlayer).forEach(([who, lines]) => {
      lines.forEach((line) => all.push({ who, line }));
    });
    const tick = () => {
      const t = all[Math.floor(Math.random()*all.length)];
      const id = ++idx.current;
      setToasts((p) => [...p.slice(-2), { ...t, id }]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 6000);
    };
    const first = setTimeout(tick, 2000);
    const t = setInterval(tick, 8000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [enabled]);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <div className="head">▸ INCOMING ROAST :: target={t.who}</div>
          {t.line}
        </div>
      ))}
    </div>
  );
}

// ====== SHAME METER ======
function ShameMeter({ value, max=100 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="shame-meter">
      <div className="row">
        <span style={{color:'var(--blood)', fontWeight:700, letterSpacing:'0.2em'}}>SHAME</span>
        <div className="bar"><div style={{ width: pct + '%' }}></div></div>
        <span style={{color:'var(--hazard)'}}>{Math.round(pct)}%</span>
      </div>
      <div style={{color:'var(--fog-2)', fontSize:9, marginTop:4, letterSpacing:'0.2em'}}>EVIDENCE COMPILED // SQUAD OFFLINE</div>
    </div>
  );
}

// ====== DONUT — winrate ring ======
function Donut({ pct, label, sub, color = '#ff2d4a', size = 120 }) {
  const r = size/2 - 10;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct/100);
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 1s var(--ease-cyber)' }} />
      </svg>
      <div className="pct">
        <div>{pct.toFixed(1)}%<small>{label}</small></div>
      </div>
    </div>
  );
}

// ====== SPARKLINE ======
function Spark({ data, color = '#ff2d4a' }) {
  const w = 240, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length-1)) * w;
    const y = h - ((v - min) / Math.max(1, (max-min))) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.15" />
    </svg>
  );
}

window.SkogComponents = { Marquee, AgentTerminal, ToastBurns, ShameMeter, Donut, Spark };
