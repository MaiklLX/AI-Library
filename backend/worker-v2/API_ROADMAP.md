# API v2 implementation roadmap

This is a staged contract, not a claim that these endpoints already exist.

## Phase 0 — foundation (current)
- Health and version discovery.
- CORS allowlist and automated tests.
- Isolated Worker project; no production bindings or deployment.

## Phase 1 — identity and author profile
The user has approved Google sign-in plus email one-time passcode (OTP) as the initial sign-in options. This is an architecture decision, not an implementation or deployment authorization.

The detailed proposal is in [AUTHENTICATION_DESIGN.md](./AUTHENTICATION_DESIGN.md). The key blocking decision is the first-party hosting topology: the current GitHub Pages site and a future workers.dev API are cross-site, which is a poor baseline for reliable Safari cookie sessions. Prefer a custom app domain and sibling API subdomain before implementing cookie sessions.

Before implementation, confirm:
- Owned custom domain and app hosting migration/arrangement.
- Exact Google OAuth callback URL and allowed origins.
- Whether Cloudflare Email Sending can verify the sending domain; otherwise select Resend.
- Secure HttpOnly + Secure + SameSite=Lax host-only session cookie, with CSRF protection.
- OTP expiry, resend cooldown, attempt limits and abuse/rate limiting.
- Session expiry/revocation, account recovery and account deletion/export.

Provider secrets must remain server-side; never ship them to the browser. No auth endpoints, secrets, D1 schema or production routing are configured yet. The browser must never receive a provider secret. Define account deletion/export, session expiry/revocation, CSRF protections where cookies are used, rate limits and abuse handling.

Planned resource groups:
- `/v1/auth/*` — sign-in callback/session lifecycle.
- `/v1/me` — authenticated account profile.
- `/v1/authors/me` — author profile settings.

## Phase 2 — private drafts and free publication
- Create/update/list/delete the signed-in author's drafts.
- Revision numbers and optimistic concurrency to prevent overwriting newer edits.
- Explicit submit-for-review action.
- Moderation state and reasoned decisions.
- Free publication to the shared catalogue after approval.
- Author can continue editing locally and export at any time.
- Server validation, size limits, safe text handling and audit events.

No publication fee, coin debit, commission or paid gate.

## Phase 3 — community progression
- XP is non-spendable and awarded only from server-verified events.
- Coin ledger is append-only and idempotent; no client-selected reward amount.
- Achievements are derived from verified activity.
- Self-voting, repeated events, duplicate submissions and other abuse are controlled server-side.
- No cash value or cash-out.

## Explicitly deferred
Paid EPUB sales, author revenue share, purchase/refund/dispute workflows, author debt recovery and moderator financial tooling are not part of the initial backend release.

## Data and privacy decisions required before D1
- Account provider and stable account subject identifier.
- Data retention, deletion/export and moderation audit policy.
- Book visibility states and moderation roles.
- Maximum book/cover sizes and content validation rules.
- Whether full book bodies belong in D1 or object storage.
- Backup and recovery objectives.

No D1 schema is included until these decisions are settled. This avoids locking the project into an unsafe or expensive data model prematurely.
