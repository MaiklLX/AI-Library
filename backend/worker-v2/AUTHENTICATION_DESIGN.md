# Authentication design — API v2

Status: proposed design based on the user's approval of Google sign-in + email OTP. This document is not implementation or deployment authorization.

## 1. Decisions already approved

- Offer two sign-in methods: Google and email one-time passcode (OTP).
- Keep authentication server-side in the isolated `ai-library-api-v2` Worker.
- Do not expose OAuth client secrets, email API credentials, OTP values, session secrets or signing keys to the browser.
- Do not connect API v2 to the production website or change the legacy Worker until the auth flow is implemented, tested and explicitly approved.

## 2. Critical hosting/origin constraint

The current public site is `https://maikllx.github.io/AI-Library/`; the v2 Worker is not deployed and its eventual `workers.dev` origin is a different site. A browser session cookie shared across those unrelated sites is not a safe baseline: browser privacy controls, especially on iOS Safari, can restrict third-party cookies.

**Preferred topology before production authentication:**
- Put the public app on a first-party custom domain, for example `https://app.<owned-domain>/` (exact hostname to be chosen after confirming domain ownership and hosting).
- Expose the Worker at a sibling hostname such as `https://api.<owned-domain>/` using a Cloudflare Worker Custom Domain.
- Keep both under the same registrable domain, HTTPS-only, and use a host-only API session cookie. Do not set a broad parent-domain cookie unless a reviewed need exists.

Cloudflare documents Worker Custom Domains as direct Worker hostnames with Cloudflare-managed DNS records and certificates: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

Until a first-party site/API topology is confirmed, do not implement cookie-based production sessions against the current GitHub Pages + workers.dev cross-site pairing. Do not silently fall back to long-lived bearer tokens in localStorage.

## 3. Google sign-in

Use the OAuth 2.0 Authorization Code flow handled by the Worker, not the legacy implicit flow.

- Request only `openid email profile` unless a later feature requires additional Google API scopes.
- Generate and validate cryptographically random `state` and `nonce`; use PKCE (S256).
- Register an exact HTTPS callback URL after the API hostname is finalized.
- Exchange the authorization code on the Worker; keep the client secret in a Cloudflare secret.
- Verify the ID token signature and its `iss`, `aud`, `exp`, and `nonce` claims before trusting identity.
- Use Google's stable `sub` as the provider subject. Treat email as an attribute, not the primary identity key.
- Do not request offline access or store Google refresh tokens when the product only needs sign-in.
- Do not merge accounts solely because two providers report the same email. Require an authenticated account-linking flow.

Google's web-server OAuth documentation requires exact redirect URI matching and state validation: https://developers.google.com/identity/protocols/oauth2/web-server

## 4. Email OTP

- Generate a cryptographically random, short-lived numeric code; store only a keyed hash or secure hash of the code, never the plaintext.
- Bind each challenge to the normalized email and a one-time challenge identifier.
- Initial proposed policy: 10-minute expiry, one active challenge per email, 60-second resend cooldown, maximum 5 verification attempts per challenge. Tune limits after abuse testing.
- Rate-limit sends and verification attempts by email, IP/network and challenge; add anti-automation controls without revealing whether an account exists.
- Invalidate the challenge after successful verification, expiry, too many attempts, or replacement by a newer challenge.
- Use a generic response for unknown and known addresses to reduce account enumeration.
- Do not log OTPs, full email bodies, credentials or session tokens.

### Email delivery provider

Preferred first option: Cloudflare Email Sending binding, **only if** an owned sending domain can be onboarded and verified in the user's Cloudflare account. This keeps delivery close to the Worker and avoids introducing another vendor. Cloudflare requires a domain configured with Cloudflare DNS and sender authentication records: https://developers.cloudflare.com/email-service/get-started/send-emails/

Fallback: Resend from the Worker, with a verified sending domain and API key stored as a Cloudflare secret. Cloudflare publishes a Worker + Resend integration guide: https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/

Provider selection is pending account/domain verification; no provider is configured.

## 5. Session and browser protections

Once the site and API share a first-party registrable domain:
- Create an opaque, cryptographically random session identifier; store only its hash server-side.
- Set a host-only cookie on the API host with `HttpOnly; Secure; SameSite=Lax; Path=/` and a reviewed lifetime. Do not set `Domain=`.
- Rotate the session identifier after authentication and privilege changes.
- Revoke sessions on logout, account deletion, suspicious activity and credential recovery.
- Protect state-changing requests with Origin validation and a CSRF token (double-submit or synchronizer token); use strict CORS allowlists as an additional control, not as CSRF protection.
- Apply idle and absolute session expiry. Provide a way to view/revoke active sessions in a later account-security feature.
- Never store a long-lived session token in localStorage.

If the app remains on GitHub Pages while the API is on workers.dev, stop and redesign before shipping sessions; do not assume Safari will accept third-party cookies.

## 6. Account data and privacy

Before D1 migrations:
- Define account deletion, export, retention and moderation-audit requirements.
- Decide whether email changes require re-verification.
- Define account-linking and recovery rules.
- Minimize stored profile fields; no date of birth, phone number or unrelated Google data is needed for initial sign-in.
- Store provider identity as (provider, provider_subject), with unique constraints; store verified email separately.
- Never store Google passwords (the app never receives them).

## 7. Proposed implementation sequence

1. Confirm a custom domain and decide whether the app can move from GitHub Pages to Cloudflare Pages (or another first-party hosting arrangement).
2. Confirm that the domain is managed in Cloudflare and whether Cloudflare Email Sending can onboard it; otherwise select Resend.
3. Register Google OAuth client with the final exact callback URL.
4. Review the D1 schema for users, provider identities, OTP challenges, sessions and audit events.
5. Implement unit tests for OAuth state/nonce/PKCE, token verification, OTP expiry/replay/attempt limits, rate limits, session rotation/revocation, CSRF and CORS.
6. Deploy the isolated Worker to a staging hostname only; test on iOS Safari, Android and desktop.
7. Integrate the website in a separate PR after staging tests and explicit approval.

## 8. Not yet authorized or implemented

No OAuth endpoints, OTP endpoints, D1 schema, email binding, custom domain, secrets, cookies, account tables or production deployment are implemented by this design document.
