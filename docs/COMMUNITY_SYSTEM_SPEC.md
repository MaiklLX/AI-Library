# AI Library — Community, Rating & Reader Economy Specification

**Status:** Product direction approved; technical discovery in progress  
**Date:** 2026-10-31  
**Repository:** `MaiklLX/AI-Library`

This document records the agreed community features before implementation. It is a specification, not a claim that registration, ratings, contests, points, or unlocks are already implemented.

## Product principles

- Reading, the public catalogue, and already-downloaded books remain available without an account.
- Accounts are optional and exist for community participation, voting, points, and cross-device identity.
- The application remains Offline First. Social actions require connectivity; they must never block offline reading.
- The community system must not destabilize the reader, book downloads, personal books, or existing generation API.
- Prefer the existing Cloudflare infrastructure and free-tier-compatible design; measure actual usage before promising capacity.
- Server-side rules are authoritative. The browser must never decide balances, vote eligibility, or entitlements.

## Agreed feature set

### 1. AI Library ID

- Registration uses a unique nickname and password; no email is mandatory for the initial version.
- Nicknames are normalized consistently and protected by a database uniqueness constraint.
- Passwords are never stored or logged in plaintext. Use a modern password-hashing scheme supported by the selected Worker runtime (prefer Argon2id/scrypt where practical; otherwise use a carefully configured PBKDF2-HMAC-SHA-256 implementation and review its parameters against current guidance).
- Login issues a revocable session credential. Store only a hash of long-lived session tokens server-side.
- Apply login/registration rate limits, generic authentication errors, input validation, and safe session expiry/revocation.
- Explain clearly that without an email or recovery factor, a forgotten password cannot be recovered. A later optional email recovery flow can be added.
- Do not use GitHub repository files as a user database or publish account data in the repository.
- Guest users can browse, read, and download public books without registering.

### 2. Daily book contest

- Each contest day features one selected book from one genre.
- The featured book and genre are selected/published once for the contest day and remain stable for that day.
- Each authenticated account may cast exactly one vote per contest day.
- The vote is either positive (+1) or negative (-1). A second vote, retry, or concurrent duplicate request must not create another vote.
- The server validates the contest date and eligibility. A database uniqueness constraint is required; UI-only checks are insufficient.
- Contest results are public. The daily result and historical contest record remain available.
- Define one canonical contest timezone and date-boundary rule before implementation. Avoid client-clock authority.

### 3. Permanent book rating

- A book's rating is cumulative and is never reset when a new contest starts.
- Positive votes add one point; negative votes subtract one point.
- Preserve the vote ledger and contest history. Do not rely only on a mutable counter as the source of truth.
- Expose at least: net score, positive vote count, negative vote count, total votes, and historical contest participation.
- Keep the permanent community rating separate from the daily contest result. A daily feature/result must not overwrite lifetime score.
- Negative ratings do not automatically hide, delete, or restrict a book.

### 4. Reader Points / coins

- Coins are a separate system from book rating and reader reputation.
- The server owns the balance and an append-only transaction ledger (earn, spend, adjustment/refund).
- Rewards are granted only after a server-verified eligible action; never trust a client-supplied balance or reward amount.
- Do not reward repeated button presses, duplicate requests, or positive/negative vote direction.
- Initial reward values, daily caps, and eligible actions remain to be designed and documented before enabling payouts.

### 5. Exclusive book unlocks

- The server validates the price and balance and performs debit plus entitlement creation atomically.
- Entitlements belong to the account and are restored after login on another device.
- A purchased/unlocked book can be downloaded to the device and then read offline.
- Removing a local download must not remove the server-side entitlement.
- Public books and existing personal books must retain their current behavior.

## 5. User-authored books and creator economy

The product direction is to stop automatic/background book generation as a way of filling the public catalogue. Automatically generated low-quality or incomplete books should not be published just to make the catalogue look active. This does **not** mean deleting existing books or disabling the user's existing book-creation tool.

The user-facing book creator is retained as a core product feature and becomes the primary creation path:
- A user can create and edit a book as a personal draft.
- Drafts are private to their author until they explicitly submit them for publication.
- Before submission, the creator should offer a preview and basic completeness/format validation (title, author attribution, description, genre, cover, chapter structure and readable content).
- Publication in the shared library is paid by the author in coins; this is an agreed product rule, not an optional possibility. The exact fee amount and any size-based pricing remain undecided.
- Show the exact fee before the action and require the author's explicit confirmation before debiting the balance. Do not charge for private drafting, preview, local saving or export.
- The rejection/refund policy, moderation workflow and timing of final settlement still need to be specified before implementation. A rejected manuscript should not silently consume the author's publication fee.
- Published books are attributed to their creator and become eligible for community ratings and selected competitions.
- Publishing must not silently replace or delete the author's local draft. A published copy and a personal working draft have distinct lifecycle states.
- Add reporting/moderation and clear content, copyright, plagiarism and safety rules before opening publication to all users.

### Creator progression, XP and status

Keep these systems distinct:
- **Coins** are a spendable economy: publication fees and future exclusive unlocks.
- **Book rating** is community feedback and remains cumulative.
- **Author XP** measures verified creator achievements and competition results; it is not spendable.
- **User status/rank** is a progression label unlocked by XP thresholds and/or explicitly defined achievements.

Competition rewards should be awarded once, after the competition closes and the final result is server-verified. Rank-based XP can reward authors whose books place in the daily "Book of the Day" competition or other explicitly defined rating events. Replays, duplicate settlement jobs, self-voting, vote manipulation and multiple accounts must not create duplicate rewards. Store reward events in an auditable ledger with unique idempotency keys. Publish the reward table and status thresholds before launch; do not invent balances or grant XP from client-side UI events.

### Draft reward economy and creator ranks (proposal, not yet approved)

The following is a balanced starting proposal for product review. Values are illustrative and must not be wired into production until explicitly approved.

#### Coins: spendable currency

- Give a new verified account a one-time welcome grant (proposal: **25 coins**) so a new author can try the publication flow without first grinding activity.
- Keep the publication fee visible before confirmation. Consider one simple base fee at launch rather than complicated per-chapter pricing; decide the exact amount after estimating moderation and storage costs.
- Coins may be earned through a small set of capped, verifiable contributions: accepted creator challenges, approved community contributions, and verified contest placements.
- Do **not** award coins for opening the app, refreshing pages, raw reading minutes, repeated clicks, or casting a positive/negative vote. These are too easy to automate or manipulate.
- Do not make daily login streaks the main source of currency. The system should reward quality and contribution, not compulsive attendance.
- Every grant, reward, debit, refund and administrative adjustment must create an immutable ledger entry with a unique idempotency key. The server calculates amounts and enforces caps.
- Show a clear transaction history: date, reason, amount, and resulting balance. Never allow a client to submit its own reward amount.

#### Author XP: non-spendable progression

Proposed XP events:
- First book approved for publication: **+40 XP**, once per author.
- Additional approved book: **+20 XP**, subject to a reasonable anti-spam cooldown/quality gate.
- Daily contest placement: **1st +100 XP, 2nd +60 XP, 3rd +30 XP** after verified settlement.
- Monthly/community special contest: separately announced reward table; do not silently multiply daily rewards.
- No XP for voting, logging in, opening a book, or submitting an unreviewed manuscript.
- XP is never spent, transferred, purchased, or removed for ordinary activity. Fraudulent awards may be reversed only through an auditable administrative correction.

#### Proposed profile ranks

| Rank | Lifetime author XP | Meaning |
|---|---:|---|
| Reader | 0 | Default community identity |
| New Author | 40 | First approved publication |
| Author | 150 | Consistent contribution |
| Established Author | 400 | Several quality contributions |
| Recognized Author | 900 | Strong community results |
| Master Author | 1,800 | Sustained high-quality work |
| Legend | 3,500 | Exceptional long-term contribution |

- Rank thresholds use lifetime XP and never fall when XP is spent (XP is not spendable).
- A contest win can accelerate progress, but cannot be bought with coins.
- Keep rank names and thresholds configurable server-side so balancing does not require a frontend rewrite.
- Cosmetic profile frames, badges and author-page presentation are suitable rank rewards. Avoid pay-to-win voting power, extra votes, or rating multipliers.

#### Anti-abuse and fairness

- Award XP and coin rewards only after server-side verification and one-time settlement.
- Exclude self-votes; detect suspicious vote clusters and repeated account/device patterns without treating one signal as automatic proof.
- Use minimum eligible vote counts and deterministic tie-breakers for contest placements.
- Apply publication cooldowns and quality checks; do not grant repeat first-publication rewards.
- Do not let a paid publication fee guarantee acceptance, positive reviews, XP or a rank.
- Provide an accessible path for new authors to earn enough coins; publication must not become an opaque paywall.
- Publish all prices, reward values, contest rules and refund conditions before users commit coins.

### Competition model — design refinement required

The earlier single-featured-book daily contest is not sufficient by itself to determine a ranked winner among multiple authors. The competition design must be refined to define:
- whether each daily event contains a shortlist of several eligible books in one genre;
- how users cast their limited daily vote and whether negative votes remain part of this particular competition;
- tie-breaking, minimum-vote thresholds, contest timezone and close/settlement time;
- whether lifetime book ratings and event standings are separate (they should be);
- how books enter a contest and whether the same book can re-enter.

Until these rules are finalized, keep the already agreed permanent +/- book-rating principles, but do not implement XP payouts or claim a competition winner based on an undefined scoring model.

### Automatic generation policy

- Disable automatic/scheduled generation and automatic insertion of generated books into the public catalogue once the owning Worker source is available and audited.
- Do not remove the manual book creator or the existing user-facing workflow.
- Do not delete existing published books, personal drafts, or database records as part of this change.
- Keep the current generation endpoint untouched until its callers and dependencies are audited. If it powers the user-facing creator, it must remain available for explicit user-initiated creation.
- The Cloudflare Worker source is currently outside this repository, so the scheduled handler cannot safely be disabled from this repository alone. Record this as a pending backend action, not a completed change.

## Proposed data model (logical)

Names are illustrative; adapt to the actual existing D1 schema after inspecting the deployed Worker source.

- `users`: id, normalized_nickname (unique), password_hash, created_at, status.
- `sessions`: id, user_id, token_hash, created_at, expires_at, revoked_at.
- `daily_contests`: contest_date (unique), genre_id, book_id, published_at, status.
- `votes`: id, contest_date, user_id, book_id, direction (+1/-1), created_at; unique(user_id, contest_date).
- `book_rating_totals` (optional materialized aggregate): book_id (unique), score, positive_count, negative_count, total_votes, updated_at. The vote ledger remains authoritative and aggregates must be rebuildable.
- `point_transactions`: id, user_id, amount, reason, idempotency_key (unique per user/action), created_at.
- `book_entitlements`: user_id, book_id, transaction_id, unlocked_at; unique(user_id, book_id).

All balance, vote, and entitlement mutations must be transactional and idempotent.

## API and load principles

- Keep the existing public catalogue and reading/download paths independent of authentication.
- Cache public contest metadata and aggregate rating responses; never cache private profile, session, balance, or entitlement responses in a shared cache.
- Keep reads lightweight and avoid API calls on page turns or ordinary reader interactions.
- Use explicit, narrow CORS allowlists for the production site origins. Do not use wildcard origins with credentials.
- Apply server-side request validation, rate limits, bounded payloads, and abuse logging that does not record passwords or session secrets.
- Use database constraints for uniqueness and atomic transactions for vote, point, and unlock operations.
- Measure the current Worker request volume and D1 usage before estimating supported daily active users.
- Keep social API failures non-blocking for the catalogue and reader.

## Offline behavior

- Public reading and downloaded books continue to work without an account or network.
- Registration, login, voting, coin balance refresh, and book unlocking require a connection.
- Do not silently queue a vote across a date boundary; if offline, explain that voting is unavailable until reconnection. A later explicit queued-vote design would need a trusted server timestamp and duplicate protection.
- Account data must never be stored in the public static catalogue or Service Worker app-shell cache.
- Do not store passwords in localStorage or IndexedDB. Session storage design must be reviewed for the actual cross-origin deployment topology and browser privacy behavior.

## Critical prerequisite: locate and audit the existing Worker source

The current `AI-Library` repository tree contains no Worker source, Wrangler configuration, or D1 schema/migrations. The frontend currently references:

`https://ai-library-generator.bymaikl.workers.dev/books`

Before changing the live API:
1. Locate the GitHub repository or deployment source that owns `ai-library-generator`.
2. Inspect the deployed Worker routes, existing D1 bindings/schema, secrets, CORS behavior, and current request volume.
3. Confirm that the same Worker/database can safely host community endpoints, or decide whether to create a separate Worker/database.
4. Never guess binding names, database IDs, secrets, or deployed schema.
5. Add versioned migrations and tests before deploying schema changes.

Do not implement frontend registration against a speculative endpoint.

## Delivery sequence

1. **Backend discovery and baseline:** locate Worker source; document current routes, bindings, schema, quotas, and deployment workflow.
2. **Architecture + migrations:** add users/sessions schema and tests without changing existing generation routes.
3. **AI Library ID:** registration, login, logout, session validation, password security, rate limiting.
4. **Daily contest + permanent ratings:** one vote per account per day, +/-1, immutable ledger, public cached aggregates, contest history.
5. **Reader Points:** finalize reward rules; implement transactional ledger and idempotency.
6. **Exclusive books:** transactional unlocks and cross-device entitlements.
7. **Frontend integration:** account/profile, daily contest, book rating, points, and treasury screens; preserve existing visual system and mobile layout.
8. **Hardening:** abuse tests, concurrent duplicate vote tests, timezone boundary tests, rate-limit tests, offline regression, and measured Cloudflare usage.

## Acceptance criteria

- A guest can browse, read, and download books exactly as before.
- Two different accounts can register; a duplicate normalized nickname is rejected.
- Passwords and session credentials are not stored in plaintext.
- A user can log in from a second device and recover their account data.
- One account cannot cast more than one vote for the same contest day, including through parallel/replayed requests.
- Positive and negative votes affect permanent score exactly once.
- Daily contest history and lifetime rating survive new contest days.
- Rating totals can be reconstructed from the vote ledger.
- Coin balance cannot be changed by editing frontend state or replaying an earning request.
- An unlock cannot debit twice or grant an entitlement without a matching debit.
- Private account data never enters public caches or static catalogue files.
- Existing generation, catalogue, reader, and offline-download flows pass regression tests.
