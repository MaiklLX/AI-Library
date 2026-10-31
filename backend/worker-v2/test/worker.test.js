import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const allowedOrigin = "https://maikllx.github.io";

test("health endpoint reports the isolated scaffold", async () => {
  const response = await worker.fetch(new Request("https://api.example/health", {
    headers: { Origin: allowedOrigin }
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "ai-library-api-v2");
  assert.equal(body.status, "scaffold");
  assert.deepEqual(body.deployedFeatures, []);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("version endpoint advertises only implemented routes", async () => {
  const response = await worker.fetch(new Request("https://api.example/v1"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.endpoints, { health: "GET /health" });
});

test("unimplemented routes are not represented as successful placeholders", async () => {
  for (const path of ["/books", "/v1/books", "/v1/auth", "/v1/publish", "/v1/wallet"]) {
    const response = await worker.fetch(new Request("https://api.example" + path));
    assert.equal(response.status, 404, path);
  }
});

test("unknown browser origins are rejected", async () => {
  const response = await worker.fetch(new Request("https://api.example/health", {
    headers: { Origin: "https://evil.example" }
  }));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("preflight accepts the production origin", async () => {
  const response = await worker.fetch(new Request("https://api.example/v1", {
    method: "OPTIONS",
    headers: { Origin: allowedOrigin }
  }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
});

test("non-GET requests are rejected", async () => {
  const response = await worker.fetch(new Request("https://api.example/health", {
    method: "POST"
  }));
  assert.equal(response.status, 405);
});
