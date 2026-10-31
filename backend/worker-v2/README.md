# AI Library API v2 — isolated backend foundation

This directory is a **new, isolated Cloudflare Worker project**. It does not replace or modify the currently deployed `ai-library-generator` Worker.

## Why v2 is isolated

The public site already consumes the legacy Worker at `https://ai-library-generator.bymaikl.workers.dev` for its existing generation and shared-book features. Its source code and deployed D1 schema have not yet been located, so the legacy service must be treated as a black box.

The v2 service is deliberately named `ai-library-api-v2`. It can be deployed and tested independently later, without taking over the legacy URL or its routes.

## Current scope

Implemented in this foundation:
- `GET /health` — liveness response.
- `GET /v1` — API version/capability discovery.
- Explicit CORS allowlist for the production GitHub Pages origin and local development.
- Automated tests for routes, methods and CORS.

Not implemented yet:
- Accounts, authentication and sessions.
- Author profiles and public author pages.
- Book draft sync, submission, moderation and publication.
- XP, achievements, coin wallets or reward ledger.
- D1 bindings, schema migrations, scheduled jobs or object storage.

These are intentionally not stubbed as successful endpoints. The API returns 404 until a feature is actually implemented.

## Safety boundaries

- Do not change, delete, rename or redeploy the legacy `ai-library-generator` Worker as part of this project.
- Do not point the website at v2 until its feature is implemented, tested and explicitly approved.
- Never put provider/API credentials in browser code, Git, Wrangler variables or test fixtures. Use Cloudflare secrets at deployment time.
- No coin or XP award may be trusted from a client-supplied amount, action, book ID or event. Rewards must be derived and settled server-side after verified events.
- Publication remains free. No publication fee, coin debit, commission or paid gate.
- Coins and XP are not cash and have no cash-out feature.
- Do not create financial purchase, settlement, refund or dispute endpoints in the initial release.
- Preserve the current local-first Book Creator workflow; server sync/publication will be an explicit opt-in addition.

## Local checks

Requires Node.js 22+.

```sh
npm test
```

## Cloudflare deployment status

This project is **not deployed**. Before first deployment:
1. Create a separate Worker named `ai-library-api-v2`.
2. Review the account, domain, privacy and authentication decisions.
3. Add D1 only after the data model and migration have been reviewed.
4. Configure production secrets using `wrangler secret put`; never commit them.
5. Deploy to the new Worker URL, smoke-test it, and only then consider a site integration PR.

The current production Worker and GitHub Pages site remain untouched.
