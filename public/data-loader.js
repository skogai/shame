// Data loader — synchronous fast-path when fallback is present and no worker URL.
// Only fetches when explicitly pointed at a worker (production with KV).
(function () {
  const FB = window.__FALLBACK_DATA__ || {};
  const WORKER = window.__WORKER_URL__;

  function hydrate(squad, disses, shame, match) {
    if (squad)  { window.SQUAD = squad.squad; window.SQUAD_STATS = squad.stats; }
    if (disses) { window.DISSES = disses; }
    if (shame)  {
      window.SHAME_FEEDERS = shame.feeders;
      window.SHAME_KDA = shame.kda;
      window.SHAME_DURATION = shame.duration;
      window.SHAME_FOUNTAIN = shame.fountain;
    }
    if (match) { window.MATCH = match; }
    window.__DATA_LOADED__ = true;
    window.dispatchEvent(new Event('data-loaded'));
  }

  // FAST PATH: no worker → use bundled fallback synchronously, no fetch, no await.
  if (!WORKER) {
    hydrate(FB.squad, FB.disses, FB.shame, FB.match);
    return;
  }

  // SLOW PATH: worker present → fetch live data with hard timeout, fall back if any fails.
  const FILES = ['squad','disses','shame','match'];
  Promise.all(FILES.map(name => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    return fetch(WORKER + '/data/' + name, { cache: 'no-store', signal: ctrl.signal })
      .then(r => { clearTimeout(t); if (!r.ok) throw 0; return r.json(); })
      .catch(() => FB[name] || null);
  })).then(([squad, disses, shame, match]) => hydrate(squad, disses, shame, match));
})();
