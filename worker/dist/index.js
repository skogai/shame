var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var ALLOWED_KEYS = /* @__PURE__ */ new Set(["squad", "disses", "shame", "match"]);
var CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
  "access-control-max-age": "86400"
};
function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json", ...CORS, ...init.headers || {} }
  });
}
__name(json, "json");
function auth(req, env) {
  const h = req.headers.get("authorization") || "";
  const token = h.replace(/^Bearer\s+/i, "");
  return token && token === env.ADMIN_PASSWORD;
}
__name(auth, "auth");
var index_default = {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts[0] === "auth" && req.method === "POST") {
      try {
        const body = await req.json();
        if (body.password === env.ADMIN_PASSWORD) return json({ ok: true });
        return json({ ok: false }, { status: 401 });
      } catch {
        return json({ ok: false }, { status: 400 });
      }
    }
    if (parts[0] === "data" && parts[1] && req.method === "GET") {
      const key = parts[1];
      if (!ALLOWED_KEYS.has(key)) return json({ error: "unknown key" }, { status: 404 });
      const v = await env.SHAME_KV.get(key);
      if (!v) return json({ error: "not set" }, { status: 404 });
      return new Response(v, {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=5",
          // edge-cache 5s so updates show fast
          ...CORS
        }
      });
    }
    if (parts[0] === "data" && parts[1] && req.method === "PUT") {
      if (!auth(req, env)) return json({ error: "unauthorized" }, { status: 401 });
      const key = parts[1];
      if (!ALLOWED_KEYS.has(key)) return json({ error: "unknown key" }, { status: 404 });
      const body = await req.text();
      try {
        JSON.parse(body);
      } catch {
        return json({ error: "invalid json" }, { status: 400 });
      }
      await env.SHAME_KV.put(key, body);
      return json({ ok: true, key, bytes: body.length });
    }
    if (parts[0] === "list" && req.method === "GET") {
      if (!auth(req, env)) return json({ error: "unauthorized" }, { status: 401 });
      const out = {};
      for (const k of ALLOWED_KEYS) {
        const v = await env.SHAME_KV.get(k);
        out[k] = v ? JSON.parse(v) : null;
      }
      return json(out);
    }
    return json({ ok: true, service: "shame.skogai.se admin api" });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
