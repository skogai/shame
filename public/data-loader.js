// Data loader — fetches JSON, hydrates window.* globals, signals ready.
// In dev (file://), falls back to embedded defaults if fetch fails.
(async function () {
  const BASE = (window.__WORKER_URL__ || "") + "/data";
  // const BASE = window.__DATA_BASE__ || 'data/';
  // const FILES = ['squad', 'disses', 'shame', 'match'];
  // const FB = window.__FALLBACK_DATA__ || {};

  // Race fetch against a 1.5s timeout — never hang the boot
  async function load(name) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch(BASE + name + ".json", {
        cache: "no-store",
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) throw new Error(name + " http " + r.status);
      return await r.json();
    } catch (e) {
      console.warn("[data-loader]", name, "using fallback:", e.message);
      return FB[name] || null;
    }
  }

  const [squad, disses, shame, match] = await Promise.all(FILES.map(load));

  if (squad) {
    window.SQUAD = squad.squad;
    window.SQUAD_STATS = squad.stats;
  }
  if (disses) window.DISSES = disses;
  if (shame) {
    window.SHAME_FEEDERS = shame.feeders;
    window.SHAME_KDA = shame.kda;
    window.SHAME_DURATION = shame.duration;
    window.SHAME_FOUNTAIN = shame.fountain;
  }
  if (match) window.MATCH = match;

  window.__DATA_LOADED__ = true;
  window.dispatchEvent(new Event("data-loaded"));
})();
