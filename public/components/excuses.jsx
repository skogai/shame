// EXCUSE-O-MATIC 9000 — generates certified post-loss excuses, then denies them.
// Reads window.DISSES.excuses when present (live KV); falls back to the
// built-in corpus below so the page works against stale KV / offline.

const EXCUSE_DEFAULTS = {
  deflections: [
    "I WAS LAGGING (180 PING, ALLEGEDLY)",
    "MY MOUSE DOUBLE-CLICKED",
    "I MISCLICKED THE TP",
    "THE SUN WAS IN MY EYES AT 02:40 AM",
    "I WAS BASICALLY PLAYING FROM MY PHONE",
    "MY CHAIR IS NOT ERGONOMIC",
    "I HAD NO VISION ALL GAME",
    "MY HAND FELL ASLEEP",
    "DISCORD WAS ECHOING",
    "I JUST GOT OFF WORK",
  ],
  scapegoats: [
    "KEVIN NEVER ROTATED",
    "SKOGIX INSTALOCKED BRISTLEBACK AGAIN",
    "ZCOPE ARROWED A TREE AT 22:14",
    "NAGASAKI 'MADE SPACE' IN THEIR FOUNTAIN",
    "JAGGER PICKED SAND KING (GAME 667)",
    "THE DRAFT WAS GRIEFED IN PICK PHASE",
    "THE MATCHMAKER HATES THE STACK",
    "OUR CARRY WAS JUNGLING SINCE MINUTE 4",
    "THE COURIER DIED WITH MY ITEMS",
    "SOMEONE PINGED MY ITEMS MID-FIGHT",
  ],
  copes: [
    "I WAS WINNING MY LANE THOUGH",
    "CHECK THE GRAPH AT MINUTE 20",
    "MY HERO GETS BUFFED NEXT PATCH",
    "WE WIN THAT IF IT GOES 80 MINUTES",
    "MY KDA DOESN'T SHOW THE SPACE I MADE",
    "I HAD THE MOST HERO DAMAGE (ON TOWERS)",
    "RANKED DOESN'T COUNT AFTER MIDNIGHT",
    "I WAS TESTING A BUILD FROM A 12K GAME",
    "THE REPLAY WILL VINDICATE ME",
    "IT'S A 4.5K LOBBY IN SPIRIT",
  ],
  verdicts: [
    "DENIED",
    "REJECTED — INSUFFICIENT COPE",
    "FILED UNDER: FICTION",
    "OVERRULED. THE LOG REMEMBERS.",
    "APPEAL SCHEDULED FOR NEVER",
    "PLAUSIBLE — WAIT, NO. DENIED.",
    "DENIED. AND THE PREVIOUS 9141 TOO.",
  ],
  kevinVerdict: "…PLAUSIBLE, ACTUALLY. CARRY ON, KEVIN.",
  signature: {
    skogix: [
      "The 22 deaths on Bristleback were strategic map pressure. Someone has to test their fountain.",
      "499 GPM is a lifestyle, not a statistic.",
      "I'm not hardstuck Guardian 4. The 3550 games are a longitudinal study.",
    ],
    zcope: [
      "The trees moved. All 678 arrows were on target when fired.",
      "21 deaths on Lina is just aggressive vision placement.",
      "4829 games isn't an addiction, it's a data set.",
    ],
    nagasaki: [
      "8.2 deaths a game is space creation. You're welcome.",
      "Dark Seer IS a tempo pick. The tempo is theirs, but it's a tempo.",
      "389 APM means I'm doing a lot. Define 'useful'.",
    ],
    kevin: [
      "I can't carry four grown men at 133 APM. Physically. The wrists.",
      "The 75-minute Venge game was performance art.",
      "Someone has to stand near the kills. 12.6 assists of pure presence.",
    ],
    jagger: [
      "Sand King has been nerfed every patch since 2012. Game 667 will be different.",
      "My APM was higher before they changed the map. In 2014.",
      "666 Sand King games isn't a rut. It's a religion.",
    ],
  },
  credibility: { skogix: 4, zcope: 2, nagasaki: 7, kevin: 31, jagger: 9 },
};

function ExcusePage() {
  const EX = (window.DISSES && window.DISSES.excuses) || EXCUSE_DEFAULTS;
  const squad = window.SQUAD || [];
  const [pid, setPid] = useState(squad[0] ? squad[0].id : 'skogix');
  const [reels, setReels] = useState([null, null, null]);
  const [locked, setLocked] = useState([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [ledger, setLedger] = useState([]);
  const timers = useRef([]);

  const pools = [EX.deflections, EX.scapegoats, EX.copes];
  const labels = ['DEFLECTION', 'SCAPEGOAT', 'COPE'];
  const player = squad.find((x) => x.id === pid) || {};
  const sigs = (EX.signature && EX.signature[pid]) || [];
  const cred = (EX.credibility && EX.credibility[pid]) != null ? EX.credibility[pid] : 0;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generate = () => {
    if (spinning) return;
    setSpinning(true);
    setVerdict(null);
    setLocked([false, false, false]);

    const final = pools.map(pick);
    const spin = setInterval(() => {
      setReels((prev) => prev.map((v, i) => pick(pools[i])));
    }, 70);

    [700, 1300, 1900].forEach((ms, i) => {
      timers.current.push(setTimeout(() => {
        setReels((prev) => { const n = [...prev]; n[i] = final[i]; return n; });
        setLocked((prev) => { const n = [...prev]; n[i] = true; return n; });
        if (i === 2) {
          clearInterval(spin);
          const v = pid === 'kevin' && Math.random() < 0.4
            ? (EX.kevinVerdict || pick(EX.verdicts))
            : pick(EX.verdicts);
          timers.current.push(setTimeout(() => {
            setVerdict(v);
            setSpinning(false);
            const ts = new Date().toLocaleTimeString('en-GB');
            setLedger((p) => [{ ts, pid, parts: final, verdict: v, id: Date.now() }, ...p].slice(0, 8));
          }, 450));
        }
      }, ms));
    });
    timers.current.push(spin);
  };

  const reelStyle = (i) => ({
    flex: 1, minWidth: 200, padding: '18px 14px', textAlign: 'center',
    background: locked[i] ? 'rgba(255,45,74,0.06)' : 'var(--bg-elev-1)',
    border: '1px solid ' + (locked[i] ? 'var(--blood)' : 'var(--border)'),
    boxShadow: locked[i] ? '0 0 16px rgba(255,45,74,0.25)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
  });

  return (
    <div>
      <div className="section-eyebrow">🧾 EXCUSE-O-MATIC 9000 // EVERY LOSS HAS A STORY. NONE OF THEM HOLD UP.</div>

      {/* player selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {squad.map((x) => (
          <button key={x.id} onClick={() => { setPid(x.id); setVerdict(null); }} style={{
            background: x.id === pid ? 'rgba(255,45,74,0.12)' : 'transparent',
            color: x.id === pid ? 'var(--blood)' : 'var(--fog-1)',
            border: '1px solid ' + (x.id === pid ? 'var(--blood)' : 'var(--border)'),
            padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            {x.nameShort || x.name}
          </button>
        ))}
      </div>

      {/* the machine */}
      <div style={{ border: '1px solid var(--border-strong)', padding: 20, background: 'var(--bg-elev-1)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--fg-2)', marginBottom: 14 }}>
          <span>SUBJECT :: {pid.toUpperCase()} // CREDIBILITY RATING: {cred}%</span>
          <span style={{ color: spinning ? 'var(--hazard)' : 'var(--fg-2)' }}>{spinning ? '▸ FABRICATING…' : 'IDLE'}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {reels.map((r, i) => (
            <div key={i} style={reelStyle(i)}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.3em', color: 'var(--fg-2)', marginBottom: 8 }}>{labels[i]}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: locked[i] ? 'var(--fg)' : 'var(--fog-1)', minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r || '— — —'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button onClick={generate} disabled={spinning} style={{
            background: spinning ? 'transparent' : 'var(--blood)',
            color: spinning ? 'var(--fg-2)' : '#fff',
            border: '1px solid var(--blood)', padding: '10px 28px',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14,
            letterSpacing: '0.25em', cursor: spinning ? 'wait' : 'pointer',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}>
            {spinning ? 'SPINNING…' : 'GENERATE EXCUSE'}
          </button>
          {verdict && (
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, letterSpacing: '0.15em',
              color: verdict.indexOf('PLAUSIBLE, ACTUALLY') >= 0 ? 'var(--acid)' : 'var(--blood)',
              border: '2px solid currentColor', padding: '6px 14px', transform: 'rotate(-2deg)',
              textShadow: '0 0 12px currentColor',
            }}>
              ▸ VERDICT: {verdict}
            </div>
          )}
        </div>
      </div>

      {/* signature excuses on file */}
      <div className="section-eyebrow">📁 SIGNATURE EXCUSES ON FILE // {pid.toUpperCase()}</div>
      <div className="shame-log" style={{ marginBottom: 24 }}>
        <div className="lhead"><span>$ cat /etc/excuses/{pid}.conf</span><span>ENTRIES: {sigs.length}</span></div>
        {sigs.map((s, i) => (
          <div className="shame-log-line" key={i}>
            <span className="ts">[exhibit {String.fromCharCode(65 + i)}]</span>{' '}
            <span className="lvl-WARN">SWORN</span> <span>"{s}"</span>
          </div>
        ))}
        <div className="shame-log-line">
          <span className="ts">[appendix]</span>{' '}
          <span className="lvl-CRIT">CRIT</span>{' '}
          <span>credibility audit: {cred}% :: {cred >= 30 ? 'squad record. the bar is a trench.' : cred >= 8 ? 'below a horoscope.' : 'below instrument error.'}</span>
        </div>
      </div>

      {/* credibility board */}
      <div className="section-eyebrow">📊 SQUAD CREDIBILITY INDEX // INDEPENDENTLY AUDITED BY THE AGENT</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {squad.map((x) => {
          const c = (EX.credibility && EX.credibility[x.id]) != null ? EX.credibility[x.id] : 0;
          return (
            <div className="stat-tile" key={x.id} style={{ borderColor: c >= 30 ? 'var(--acid)' : 'var(--blood)' }}>
              <div className="v" style={{ color: c >= 30 ? 'var(--acid)' : 'var(--blood)' }}>{c}%</div>
              <div className="l">{(x.nameShort || x.name).toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      {/* ledger */}
      {ledger.length > 0 && (
        <div>
          <div className="section-eyebrow">// EXCUSE LEDGER :: SESSION RECORD</div>
          <div className="shame-log">
            <div className="lhead"><span>$ tail -f /var/log/excuses.log</span><span>FILED: {ledger.length}</span></div>
            {ledger.map((e) => (
              <div className="shame-log-line" key={e.id}>
                <span className="ts">[{e.ts}]</span>{' '}
                <span className="lvl-ERR">{e.pid.toUpperCase()}</span>{' '}
                <span>"{e.parts[0]} + {e.parts[1]} + {e.parts[2]}" :: </span>
                <span style={{ color: e.verdict.indexOf('PLAUSIBLE, ACTUALLY') >= 0 ? 'var(--acid)' : 'var(--blood)' }}>{e.verdict}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.ExcusePage = ExcusePage;
