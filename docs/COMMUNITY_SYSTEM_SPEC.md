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


### Paid EPUB export and creator revenue share (approved product rule)

- A published community book may offer an optional downloadable EPUB export. The export action should live in the book's secondary-actions menu so the main catalogue card remains uncluttered.
- Authors choose either a **free EPUB** or one of three fixed paid price tiers: **3, 5, or 10 coins**. Arbitrary custom prices are not supported in the initial model.
- A free EPUB download creates no coin debit, author credit, or platform commission. It remains available without mandatory registration. Once a reader has acquired the free edition, that entitlement is permanent: it survives the author later switching the offer to paid, device changes, and removal of the local download. The reader can re-download it without charge through their account when signed in; guest readers retain their original file or guest acquisition claim where supported. A later price applies only to readers who have not previously acquired the book.
- For each first successful purchase, distribute **80% of the coin price to the book's author** and retain **20% as the AI Library platform commission**. This 80/20 split is approved product direction.
- Examples: at 3 coins, author receives 2.4 and AI Library 0.6; at 5 coins, author receives 4 and AI Library 1; at 10 coins, author receives 8 and AI Library 2. Use decimal-safe integer subunits or another exact representation; do not use imprecise floating-point arithmetic for ledger balances.
- The purchase confirmation must show the total price and the author/platform split before the user confirms.
- A successful purchase creates a durable account entitlement. Re-downloading the same EPUB is free and must not debit the reader or credit the author/platform again.
- Debit, entitlement creation, author credit and platform commission must settle atomically on the server with a unique idempotency key. The browser must never calculate or mutate authoritative balances.
- Keep author earnings and platform commission visible in auditable transaction history. Refunds/reversals, moderation removal, and settlement timing must have explicit rules before launch.
- Coins are an internal AI Library currency. This rule does **not** promise cash payouts or bank withdrawals; any future cash-out feature requires a separate product, legal, tax, and payment design.
- Do not charge for private drafts, previews, local saving, or an author's own draft export. Do not impose a blanket export fee on free/public-domain catalogue books without a separately approved policy.
- Generate a standards-compliant EPUB within the application/backend, including metadata, cover, chapter navigation and valid package structure; validate the resulting archive before offering it.
- No EPUB purchase or wallet UI should be wired to localStorage or a speculative API. Implementation requires an audited Worker source/schema, transactional ledger support, and server-side entitlement checks.


### EPUB refunds, reversals and author settlement (approved product rule, 2026-10-31)

- Refunds are eligible for objective transaction/delivery failures, including a duplicate charge, a failed or unusable EPUB delivery caused by the platform, or a paid purchase for which the reader did not receive the promised access.
- A reader simply changing their mind after successful delivery is not, by itself, an automatic platform refund reason. This rule must never override mandatory statutory consumer rights or other applicable legal obligations.
- Author revenue (80% of a paid purchase) is first recorded as **pending** rather than immediately spendable.
- The pending author amount becomes available **7 calendar days after the successful purchase**, provided no substantiated refund, reversal, or dispute is open. This is a product settlement delay, not a statement of the reader's statutory refund period.
- The platform's 20% commission and the author's 80% share must remain traceable to the original purchase. Refund/reversal processing must create compensating ledger entries; never edit or erase the original transaction.
- A refund for one purchase must be idempotent: repeated requests, retries, or concurrent processing must not issue multiple refunds or reverse the same author/platform amounts more than once.
- When a refund is granted, the paid entitlement may be revoked, subject to mandatory consumer rights and any applicable exception. Do not revoke a separate permanent free-acquisition entitlement that predates the paid offer.
- The purchase, entitlement, author pending credit, platform commission, and any later refund/reversal must be represented by server-authoritative, auditable, transactionally consistent records. No client-side balance changes.
- Exact dispute handling, evidence review, exceptional cases, and legal implementation details must be finalized before launch. No live refund or settlement behavior is implemented by this documentation change.


### Refund cost allocation by cause (approved product rule, 2026-10-31)

- Every refund must be assigned a recorded cause after review: platform fault, author/content fault, or duplicate/technical payment operation. The classification and supporting evidence must be auditable.
- **Platform fault:** when AI Library caused the failed or unusable EPUB delivery or failed to provide paid access, AI Library bears the refund cost. The author's 80% share is not clawed back solely because of a platform-caused failure; any pending author credit remains payable under the normal settlement rules unless a separate author fault is established.
- **Author/content fault:** when the refund is justified by an author-controlled defect or failure, reverse the author's 80% share attributable to that purchase. If it is still pending, cancel the pending credit; if already settled, record a separate compensating debit/receivable against the author's coin account. Do not silently edit the original ledger entry or take the balance below zero without recording the resulting recoverable amount.
- If the author has insufficient available coins, record the unrecovered amount as a transparent negative adjustment/debt and offset it against future author earnings. Do not hide the debt or silently discard it. The precise limits, notice and appeal procedure remain to be designed before launch.
- **Duplicate charge:** reverse only the duplicate payment transaction. It must not create an author credit or commission, and it must not reverse or affect the separate original successful purchase.
- A refund/reversal must never be applied twice. Use an idempotency key and immutable compensating ledger entries linked to the exact purchase and refund case.
- The refund case must record who/what caused the failure, evidence/reason, decision timestamp, amounts allocated to author/platform, entitlement action, and any outstanding recovery amount.
- These are approved product allocation rules, not live implementation. Mandatory consumer rights and legal review take precedence; disputed fault classification, author notice/appeal, and negative-balance limits must be specified before launch.

## Dispute review and appeal workflow (approved product policy, 2026-10-31)

- A reader can open a report from a specific paid purchase. The intake captures a structured reason, description, purchase reference, and optional supporting evidence (for example, screenshots or a relevant file).
- Initial reason categories: duplicate charge; EPUB failed to download; EPUB is corrupted/unusable; paid access was not provided; material mismatch with the book description; other.
- Every case receives a unique ID and an auditable status history. Suggested statuses: new, awaiting author response, under platform review, decision issued, appeal, closed.
- A dispute is scoped to the affected purchase. Do not freeze the author's whole wallet or unrelated earnings. If the disputed author share is still pending, only that share may remain pending while the case is reviewed.
- Notify the author with the case ID, reason, reader's description/evidence, and response deadline. The author may respond with an explanation, evidence, or a corrective re-delivery proposal.
- Proposed service target: 5 calendar days for the author's response. No response is not an automatic admission of fault; the platform may decide using the available evidence and must record its reasoning.
- A platform moderator reviews purchase and entitlement records, delivery/download diagnostics where available, EPUB integrity, listing description, reader evidence, and the author's response. Proposed review target: 3–5 business days after the case is ready for review.
- A decision must record the reason and evidence considered and select an outcome: refund, no refund, corrected re-delivery, or (only where supported and justified) partial compensation. Notify both parties with a concise explanation.
- Both reader and author may appeal within a proposed 7 calendar days, supplying new evidence or identifying a review error. A different moderator or second review level should handle the appeal where practical. Preserve the original decision and append the appeal outcome; never overwrite the audit history.
- Refunds and author-share adjustments require a registered platform decision tied to the case. The only proposed automatic exception is a mechanically confirmed duplicate charge: the system may reverse only the duplicate transaction when ledger evidence proves it is an extra charge for the same purchase. It must not credit the author for the duplicate or affect the original successful purchase. Ambiguous cases go to human review.
- All wallet effects use idempotent compensating ledger entries. Preserve original purchase and ledger records. Record the case ID, reason classification, evidence references, decision-maker, timestamps, amounts allocated to author/platform, entitlement action, and any outstanding author recovery.
- Do not automatically revoke a paid entitlement merely because a complaint was opened. Entitlement changes occur only after a valid decision and remain subject to mandatory consumer rights. A prior permanent free-acquisition entitlement is never revoked by a later paid-price change or a dispute about a separate paid acquisition.
- These internal targets do not limit mandatory statutory consumer rights or external dispute deadlines. Legal review is required before launch.
- The 5-day author response, 3–5-business-day review, and 7-day appeal windows are approved initial product service targets; they are not waivers or restrictions of legal rights.
