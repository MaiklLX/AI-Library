const ALLOWED_ORIGINS = new Set([
  "https://maikllx.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
]);

function corsHeaders(origin) {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600"
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function json(data, status, origin) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders(null) });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ ok: false, error: "origin_not_allowed" }, 403, null);
    }

    if (request.method !== "GET") {
      return json({ ok: false, error: "method_not_allowed" }, 405, origin);
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "ai-library-api-v2",
        status: "scaffold",
        deployedFeatures: []
      }, 200, origin);
    }

    if (url.pathname === "/v1") {
      return json({
        ok: true,
        version: 1,
        service: "ai-library-api-v2",
        status: "scaffold",
        endpoints: {
          health: "GET /health"
        }
      }, 200, origin);
    }

    return json({ ok: false, error: "not_found" }, 404, origin);
  }
};
