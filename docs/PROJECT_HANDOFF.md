# AI Library — Project Handoff & Recovery Checkpoint

**Checkpoint date:** 2026-10-31  
**Repository:** `MaiklLX/AI-Library`  
**Default branch:** `main`

This document is the durable handoff point for continuing development in a new ChatGPT conversation. Update it at every meaningful milestone and before a conversation is likely to reach its limit.

## Product vision

AI Library is intended to become a polished cross-platform reading application, not merely a website:

- Android application experience.
- iOS application experience.
- Installable on iPhone from Safari using **Share → Add to Home Screen**.
- A future native-store distribution path may use a wrapper such as Capacitor, if/when needed.
- One shared product and codebase wherever practical, with platform-specific behavior handled deliberately.

## Highest product priority: OFFLINE FIRST

The central promise is that readers can download books directly onto their device and read them whenever and wherever they want, including with no internet connection.

Required capabilities:

1. Download a book's complete readable content and required assets to the device.
2. Open and read downloaded books fully offline, including after closing and reopening the app.
3. Preserve reading progress, bookmarks, favorites, and reader settings locally.
4. Provide a clear **Downloaded / Available offline** area.
5. Show download progress, file size where available, storage usage, retry and failure states.
6. Allow users to remove local downloads without deleting a server/catalogue copy or a separately stored personal book.
7. Keep local personal books separate from the shared server catalogue.
8. Reconcile/synchronize safely when connectivity returns; never silently overwrite local progress or delete a downloaded book.
9. Ensure the reader does not depend on a live API request once a book has been downloaded.

### Storage and platform considerations

- Treat the Service Worker Cache Storage as the place for the application shell and versioned static assets, not as the only book library.
- Evaluate IndexedDB (and, where useful and supported, OPFS) for book content, metadata, and offline state.
- Design explicit storage accounting, cleanup controls, migration/versioning, and recovery from partial downloads.
- Browser-managed storage can be evicted under device storage pressure, especially on iOS. Do not promise permanent retention solely because a book was downloaded through Safari. Detect missing local data, explain the situation, and offer re-download when online.
- If stronger durable storage or store distribution becomes necessary, evaluate a native wrapper and its platform storage APIs without abandoning the shared web foundation.

## Cross-platform requirements

### Android
- Installable PWA / standalone launch.
- Offline app shell and offline book reading.
- Touch gestures, responsive layouts, storage management, and update handling.

### iOS / Safari
- Add-to-Home-Screen installation flow.
- Standalone web-app display where supported.
- Safe-area handling (notches, Dynamic Island, home indicator).
- Reliable touch interactions and reader pagination/swipes.
- Test actual installed-from-Safari behavior, not only Safari browser tabs.
- Explain platform limitations honestly; PWA installation is not equivalent to an App Store native app.

### Desktop
- Preserve the existing browser experience and responsive layout.

## Existing project context and prior decisions

- The project has a shared server catalogue and server-side book generation infrastructure (Worker / D1 / Groq were previously brought online and tested in earlier work).
- Architectural decision: shared/generated books belong in the shared server catalogue; personal books remain local to the user's device. Do not merge these concepts accidentally.
- The reader has previously received fixes for mobile page-turn animation, touch interaction, cross-chapter page numbering, reading progress, and “Continue Reading”. These must be regression-tested before and after related changes.
- Existing search, filters, favorites, and reading progress should be preserved when integrating or changing catalogue rendering.
- Do not assume historical functionality is currently healthy without inspecting the current code and testing it.

## Recent merged visual milestones

- PR #35 — `hero-cosmic-star-v1`, merged to `main`; merge commit `97eacc3e29e4c885d9e9a940649673630cf246ea`.
- PR #36 — `hero-cosmic-depth-v2`, merged to `main`; merge commit `767e88dec4edb331690fafda495d3be8f0043ab9`.
- The hero work added layered cosmic atmosphere, orbit details, glow and motion refinements, plus reduced-motion and mobile CSS handling.
- These changes were merged, but a merge is not proof of successful visual testing on physical Android/iOS devices. Do not claim device validation until it has actually happened.

## Suggested development order

1. Continue measured visual polish without compromising readability, performance, or accessibility.
2. Inspect the current repository before every code change; never assume file contents or function locations from an earlier chat.
3. Audit the current reader, storage layer, service worker, manifest, and catalogue architecture.
4. Design and implement a robust local book-download/storage model.
5. Add a Downloaded / Offline Library view and download lifecycle UI.
6. Make the reader load downloaded books without network calls; test airplane mode and app relaunch.
7. Add PWA installation and platform-specific iOS/Android refinements.
8. Test synchronization, updates, storage pressure, partial downloads, and recovery.
9. Consider native Android/iOS packaging only after the shared offline-first experience is stable.

## Working protocol and recovery checkpoints

- Before significant work, fetch the latest relevant files from `main` and inspect current code.
- Make focused changes on a dedicated branch; avoid broad rewrites.
- Use a PR for reviewable milestones and merge only after checking the diff.
- Keep each checkpoint independently recoverable.
- After every meaningful milestone, update this document with:
  - what changed;
  - branch, PR, merge status, and commit SHA;
  - files touched;
  - checks actually performed and their results;
  - known defects and unverified assumptions;
  - exact next action.
- Before a chat ends or approaches its limit, update this document and leave a concise handoff summary in the conversation.
- Never describe a feature as tested on a physical device unless the user or a verified test has confirmed it.

## Audited implementation baseline (2026-10-31)

The current `main` branch already contains a substantial offline-book foundation. Do not rebuild it from scratch.

### Existing offline implementation
- `src/platform/runtime.js`: cross-platform detection and IndexedDB database `ai-library-platform`, with `books`, `metadata`, and `downloads` stores.
- `src/platform/library-store.js`: domain adapter for durable book, metadata, and download records.
- `src/platform/download-manager.js`: validates published book JSON, downloads complete book content on explicit user action, stores it in IndexedDB, restores ready downloads after restart, supports removal, storage estimates, and explicit persistent-storage requests.
- The replacement flow validates the new book before one IndexedDB record write, preserving the previous ready copy when fetching or validation fails.
- `index.html`: personal library has a dedicated **Доступно офлайн** shelf, download/remove/update actions, and merges locally downloaded published books with catalog metadata.
- `content/catalog.json`: metadata-only catalog; full book text is fetched on explicit read or download, not during ordinary catalog startup.
- `sw.js`: offline app-shell cache and network-first catalog/book requests with cached fallback. Current cache version after PR #38 is `v57`.
- Manifest currently declares standalone display, but installation and offline behavior still require real-device validation.

### Latest offline reliability milestone
- PR #38 — [metadata-only offline update checks](https://github.com/MaiklLX/AI-Library/pull/38), merged to `main`.
- Merge commit: `e00e2124552b2eab0f1b5bd5442b085dac0f5ed7`.
- Download records now retain `catalogRevision`.
- Checking for a new edition compares local and catalog revision metadata only; it does not fetch the full book body.
- Full book content is fetched only after the reader chooses to update/download.
- A downloaded book body whose revision does not match the catalog is rejected before storage, preserving the previous offline copy.
- Published catalog revisions are validated against the matching book JSON revision.
- PR validation passed on head SHA `f0a8e007676412faa30fcdfffb5c31ce34fbd396` (run [41122923081](https://github.com/MaiklLX/AI-Library/actions/runs/41122923081)).
- Main-branch validation and Pages deployment were queued after merge; verify their final results before calling this deployed.

### Known limitations / unverified items
- No physical Android or iPhone test has been confirmed in this checkpoint.
- Safari Add to Home Screen and standalone launch must be tested on an actual iPhone.
- Browser storage can be evicted, particularly on iOS; persistent-storage requests are best-effort, not a guarantee.
- Test interrupted/failed downloads, storage pressure, missing IndexedDB records, offline app relaunch, and update rollback on devices.
- Shared server-generated books and local personal books must remain separate; do not silently imply all shared books are downloaded.

## Updated next steps

1. Verify the main-branch validation and GitHub Pages deployment for merge commit `e00e2124552b2eab0f1b5bd5442b085dac0f5ed7`.
2. Perform a focused offline regression pass: download a published book, close/reopen the app, enable airplane mode, open and page through the book, verify progress, then reconnect and check for a revision update.
3. Audit the reader's local-first resolution path and failure messaging without changing pagination/gesture code unnecessarily.
4. Test PWA installation and standalone launch on Android and iPhone Safari, including safe areas and storage behavior.
5. Improve the offline library UI only where real testing reveals gaps (download progress, retry, storage usage, missing-copy recovery).
6. Consider Capacitor/native packaging only after the PWA and offline experience are stable.

This is a source-code and mocked-workflow checkpoint, not proof of physical-device behavior. Continue to distinguish automated checks, source inspection, and real-device testing.

## Community system planning checkpoint (2026-10-31)

- PR #39 merged: Offline Engine handoff documentation corrected and audited. Merge commit: `ae47ba6419432a118aaf553a75d7c013d9484197`.
- Main GitHub Pages deployment for Offline metadata-only update checks succeeded: run `41123103982`, commit `e00e2124552b2eab0f1b5bd5442b085dac0f5ed7`.
- PR #40 merged: `docs/COMMUNITY_SYSTEM_SPEC.md` records the approved community product plan. Merge commit: `94ed1821c8308ae80bf16ea74c6c4efafbaf60b3`.
- Agreed product: optional AI Library ID with unique nickname + password; guests retain public reading and downloads; daily contest features one book from one genre; one authenticated vote per account per contest day; positive and negative votes (+1/-1); permanent lifetime book rating and immutable vote history; daily contest results remain separate from lifetime rating.
- Reader Points/coins are separate from book rating. Server-authoritative append-only ledger; exclusive-book unlocks create durable account entitlements that survive device changes and local-download removal.
- Social actions require internet; offline reading and downloaded books remain independent and must not be blocked by account state.
- Critical discovery: the `AI-Library` GitHub repository contains no Worker source, Wrangler configuration, or D1 migration/schema files. The frontend calls `https://ai-library-generator.bymaikl.workers.dev/books`. Do not implement speculative endpoints or modify live API until the Worker source/deployment repository and existing D1 schema are located and audited.
- PR #40 validation passed: run `41128288334`; documentation-only.
- Next exact action: locate the source repository/deployment project for `ai-library-generator`, inspect its routes, D1 binding/schema, secrets, CORS and usage metrics, then design versioned migrations and tests. Keep current generation endpoints unchanged.
- No community feature has been implemented or deployed yet. No real-device offline test has been confirmed.


## Product direction update — community-authored library (2026-10-31)

- The user has decided to stop automatic/background generation of public-catalogue books because the current generated results are incomplete and do not meet the desired quality bar.
- The existing user-facing book creator is explicitly retained and should be treated as a core feature, not removed.
- Target lifecycle: private author draft → preview/completeness checks → explicit, free publication by the author → attributed public book → eligibility for ratings and competitions. **Publication is free in the initial release; no coin fee or other publication commission is charged.**
- Private drafting, preview, local save, export and publication remain free during the initial community rollout. Coins/XP are earned through separately approved, verifiable community and creator activities; they do not gate publication.
- Add a creator progression system: competition placements award verified author XP; XP/achievements unlock profile statuses. Coins remain a separate spendable currency; XP/status are non-spendable progression.
- Competition scoring needs refinement before implementation. A daily shortlist/ranked competition is likely needed if the product is to award top-place rewards; preserve lifetime book rating separately from daily event results.
- Do not delete existing catalogue books or personal drafts. Do not remove the user-initiated generation path if it powers the book creator.
- The automatic scheduled generation handler lives in the external Cloudflare Worker, which is not currently accessible. It has **not** been disabled. The Worker source must be inspected before changing scheduled behavior or generation routes.
- No application code, Worker code, catalogue records, or user data were changed in this product-direction checkpoint.
- Next: inspect the book creator page and its save/export behavior; then isolate the exact automatic-generation trigger(s) in the frontend and document the Worker-side scheduled handler when source access is restored. Implement UI/code changes only after confirming that manual creation remains intact.

## Creator economy proposal checkpoint (2026-10-31)

- Drafted a review-only coin / author XP / rank model in `docs/COMMUNITY_SYSTEM_SPEC.md`; it is explicitly a proposal, not approved production values.
- Proposal separates spendable coins from non-spendable lifetime author XP and rank. It discourages rewards for logins, page refreshes, raw reading time and voting.
- Illustrative starting values: 25-coin new-account grant; XP for approved publications and verified contest placements; ranks from Reader through Legend with configurable thresholds.
- Anti-abuse requirements: server-side reward verification, idempotent settlement, self-vote exclusion, contest minimum vote thresholds, auditable ledger, visible prices and refund rules.
- No frontend, Worker, D1 schema, catalogue or user data changed.
- Next: review and adjust the proposed numbers/rank names with the product owner; then refine contest shortlist, tie-breaks, minimum vote count, fee/refund timing and moderation policy before implementation.


## EPUB creator revenue-share decision (2026-10-31)

- Product owner approved an **80% author / 20% AI Library** split for each first paid EPUB purchase.
- Illustrative price: 3 coins → 2.4 coins credited to the author and 0.6 coins retained by the platform.
- A repeat download of an already purchased EPUB is free and creates no second debit or credit.
- Show price and split before confirmation; settle reader debit, author credit, platform commission and entitlement atomically on the server with idempotency protection.
- Coins are internal platform currency; no cash withdrawal or real-money payout is promised.
- Approved EPUB offer choices: **free**, or one of three paid tiers — **3, 5, or 10 coins**, selected by the author; arbitrary custom prices are not part of the initial model. A free EPUB has no debit, author credit or platform commission, and does not require registration. Repeat downloads remain free. Once a reader has acquired the free edition, that entitlement is permanent: it survives a later switch to paid, device changes, and removal of the local file. Repeat downloads remain free through the account when signed in; guest readers retain their original file or guest acquisition claim where supported. The new price applies only to readers who have not previously acquired the book. Refund policy and paid-settlement timing remain undecided. Private drafts, previews, local saving and an author's own draft export remain free; do not apply a blanket fee to free/public-domain books.
- No code or live wallet behavior has been implemented. Real purchases wait for Worker source/schema discovery and server-side transactional ledger support.


## EPUB price-tier decision (2026-10-31)

- The product owner approved fixed paid EPUB export tiers: **3, 5, or 10 internal coins**. The author selects one tier for their book.
- The approved 80/20 split applies to every tier:
  - 3 coins → 2.4 author / 0.6 platform.
  - 5 coins → 4 author / 1 platform.
  - 10 coins → 8 author / 2 platform.
- The product owner subsequently approved a **free EPUB option** alongside the paid tiers. Free acquisition creates no wallet transaction or platform commission and does not require registration; repeat downloads remain free. Readers who acquired a free edition retain a permanent entitlement even if the author later switches it to paid; it survives device changes and local-file removal. Repeat downloads remain free, and the new price applies only to readers who have not previously acquired the book.
- These are documented product rules only; no purchase UI, wallet, EPUB generation, or payment code has been implemented.


## Refund and author-settlement decision checkpoint (2026-10-31)

- Product owner approved objective-cause refunds for duplicate charges, platform-caused failed/unusable EPUB delivery, and paid purchases where promised access was not provided.
- A simple change of mind after successful delivery is not an automatic platform refund reason; mandatory consumer rights and applicable law always take precedence.
- Approved author settlement rule: the author's 80% share is initially **pending** and becomes available **7 calendar days after successful purchase**, unless a substantiated refund/reversal/dispute is open.
- Refund/reversal operations must be idempotent and auditable, using compensating ledger entries rather than editing/deleting the original purchase. A refund must not be processed twice.
- A refunded paid entitlement may be revoked subject to mandatory consumer rights and exceptions; a separate permanent free-acquisition entitlement from before a price change must not be revoked.
- These decisions are product specification only. No frontend, Worker, D1 schema, wallet, EPUB generator, purchase, refund, or settlement code was changed or deployed.
- Current working branch: `product/creator-progression-economy`; current review PR: [#43](https://github.com/MaiklLX/AI-Library/pull/43), still open and not merged at the time of this checkpoint.
- Files to keep synchronized: `docs/COMMUNITY_SYSTEM_SPEC.md` and this handoff document. PR body should summarize the approved policy.
- Next exact action: continue product review of unresolved dispute/evidence workflow and mandatory consumer-rights handling; separately locate/audit the external Cloudflare Worker source and D1 schema before any live wallet implementation. Do not merge PR #43 until remaining provisional rules are reviewed.


## Refund cost-allocation decision checkpoint (2026-10-31)

- Product owner approved cause-based allocation for refunds:
  - **Platform fault:** AI Library bears the refund cost; do not claw back the author's 80% share solely for a platform-caused delivery/access failure.
  - **Author/content fault:** cancel the author's pending 80% credit, or if already settled create a separate compensating debit/receivable against the author's coin account.
  - **Insufficient author balance:** transparently record the unrecovered amount and offset it against future author earnings; never silently erase it or conceal a negative adjustment. Limits, notice and appeal process remain open.
  - **Duplicate charge:** reverse only the duplicate transaction; do not credit the author for it and do not affect the original successful purchase.
- Refund cause, evidence, decision time, author/platform allocation, entitlement action and any outstanding recovery must be auditable. All reversals remain idempotent and use compensating ledger entries; never mutate the original purchase record.
- This decision supplements the previously approved 7-calendar-day pending author settlement and objective-cause refund policy. It does not change statutory consumer rights.
- Documentation only: no frontend, Worker, D1 schema, wallet or live refund/settlement behavior changed.
- Current branch: `product/creator-progression-economy`; PR [#43](https://github.com/MaiklLX/AI-Library/pull/43) remains open and unmerged.
- Next: specify dispute intake, evidence review, author notification/appeal, negative-balance limits and exceptional cases; audit the actual Cloudflare Worker and D1 source before implementation.

## Dispute workflow decision checkpoint (2026-10-31)

- Product owner approved a purchase-scoped dispute workflow: reader opens a case against a specific paid purchase, selects a reason, describes the issue and may attach evidence; each case has a unique ID and auditable status history.
- Author receives the case details and can respond with evidence or propose corrective re-delivery. Initial service targets: 5 calendar days for author response; 3–5 business days for platform review once ready; 7 calendar days for either party to appeal. These are internal targets only and never restrict statutory consumer rights.
- The platform records a reasoned decision and outcome (refund, no refund, corrected re-delivery, or justified partial compensation). Appeals should be reviewed at a second level/different moderator where practical; preserve the full decision history.
- A dispute affects only the relevant purchase and, where applicable, only its pending author share. Do not freeze unrelated author earnings or automatically revoke access merely because a complaint was opened.
- Refunds and author-share adjustments require a registered platform decision linked to the case. The only automatic exception is a mechanically confirmed duplicate charge: reverse only the duplicate transaction, never credit the author for it, and leave the original successful purchase untouched. Ambiguous cases require human review.
- Every financial adjustment remains idempotent and auditable through compensating ledger entries; preserve original transactions. Record evidence references, decision-maker, timestamps, allocation, entitlement action and any outstanding recovery.
- Mandatory consumer rights override internal workflow targets and product rules; legal review remains required before launch.
- Documentation only: no frontend, Worker, D1 schema, wallet, purchase or refund implementation was changed.
- Current branch: `product/creator-progression-economy`; PR [#43](https://github.com/MaiklLX/AI-Library/pull/43) remains open and must not be merged until remaining open items are reviewed.
- Next: specify evidence retention/access controls, abuse handling, author negative-balance limits and exceptional cases; locate and audit the deployed Cloudflare Worker and D1 schema before implementing financial operations.

## Author debt recovery decision checkpoint (2026-10-31)

- Product owner approved the author-debt recovery model:
  - Debt may arise only from a final, documented decision assigning a refund/reversal to author/content fault. Platform fault, duplicate charges, unresolved complaints and unsubstantiated allegations do not create author debt.
  - Author receives a reasoned notice with purchase/case reference, evidence summary, amount and calculation. The appeal window is **7 calendar days**. A timely appeal pauses recovery of the disputed amount until the appeal is decided.
  - After the decision is final, **50% of future author earnings** is applied to the outstanding debt. This is 50% of the author's 80% share, not half of the reader's gross payment. The other 50% is released under the normal seven-day pending settlement rule, subject to other valid holds.
  - When confirmed outstanding debt reaches **10 coins or more**, suspend new paid sales until repayment or documented review. This is a trigger, not a debt cap or automatic confiscation.
  - Existing reader entitlements and published books remain intact. Authors retain access to reading, drafts, editing, local saving and export; free publication may continue unless a separate moderation rule applies.
  - Recovery uses exact arithmetic and separate idempotent ledger entries; no mutation/deletion of original transactions, no whole-wallet freeze, and no offset against unrelated coin rewards.
  - Notify the author when the restriction begins and when it is lifted; lift automatically when the confirmed debt is fully repaid unless another documented restriction applies.
- Documentation only: no frontend, Worker, D1 schema, wallet, purchase or refund behavior was implemented.
- Current branch: `product/creator-progression-economy`; PR [#43](https://github.com/MaiklLX/AI-Library/pull/43) remains open and unmerged.
- Next: define evidence retention/access controls, abuse handling, exceptional cases and legal review; audit the deployed Cloudflare Worker and D1 schema before live financial implementation.



## Evidence privacy, retention and anti-abuse decision checkpoint (2026-10-31)

- Product owner approved dispute evidence limits: **90 days after case closure** for attachments; **5 MB maximum per file**; **3 files maximum per case**; evidence-access audit logs retained **6 months**.
- Active appeals, legal holds, statutory duties or documented legal requirements pause deletion only for relevant evidence. Financial/accounting records and the minimum case decision/audit trail follow separate applicable legal retention requirements; the 90-day attachment rule must not delete required financial records.
- Evidence belongs in private object storage, not D1. D1 holds compact references and metadata (case/file ID, object key, checksum, detected MIME type, size, timestamps and case link). Prefer checksums and narrow log excerpts over retaining a full EPUB.
- Accept relevant screenshots (JPEG/PNG/WebP), PDFs, EPUB integrity metadata/checksums, delivery/purchase/entitlement logs, book metadata and author responses. Validate actual MIME/content signatures; reject HTML, SVG, executables, archives and unsupported formats. Quarantine and scan attachments before staff preview; no public evidence URLs.
- Enforce case- and role-scoped access; authors receive only what is necessary to respond. Encrypt in transit/at rest, use short-lived signed URLs (proposed 5-minute default), and audit every view/download/export/permission change/deletion.
- Anti-abuse signals include duplicate cases/evidence, unusual claim frequency and suspicious account/device/payment patterns. Signals trigger rate limits or human review, not automatic fraud findings, complaint rejection, author debt or unrelated earnings holds. Preserve notice, response, reasoned decision and appeal rights.
- These are approved product policy targets, not implemented code. Legal review and selection/testing of object storage, malware scanning and access controls remain prerequisites.
- Documentation-only checkpoint: no Worker, D1 schema, object storage, wallet, dispute UI, purchase/refund behavior or user data changed.
- PR #43 remains open and unmerged; branch: product/creator-progression-economy. Do not merge without the product owner's separate approval.
- Next: complete legal/privacy review of retention and evidence handling; then continue backend source discovery and architecture planning before any live financial or dispute implementation.


## Release sequencing checkpoint — internal market deferred (2026-10-31)

- Product owner approved a staged rollout: do **not** launch the internal EPUB market in the initial release, even if its specifications and safeguards are designed ahead of time.
- Initial priorities: (1) coins, XP, achievements and progression; (2) user-authored book creation and publication workflow; (3) grow the audience and validate real usage.
- Deferred until the product has a meaningful audience: paid EPUB purchases, author revenue share/settlement, refunds, disputes, appeals, author-debt recovery, evidence handling/anti-abuse operations and moderator/admin console.
- Initial coins remain internal platform currency for explicitly approved community/creator actions. Do not imply cash value, cash-out, or active paid EPUB trading.
- Keep the market specification as future-phase design only. Do not expose purchase, payout or dispute functionality in the first release.
- This is a product sequencing decision only. No application/backend code or live financial behavior has been implemented by this checkpoint.
- PR #43 remains a documentation-only proposal and must remain open/unmerged until separately approved.

## Follow-up audit — creator flow and test deployment (2026-10-31)

- Re-inspected `book-creator.html` on `main` (blob SHA `475ec15b536ba44ca866df40ecb422de8b3cf9ae`). The current creator is a local-first tool: drafts/books are stored in browser `localStorage`, can be edited, previewed, imported/exported, and prepared as a catalogue package. The “Подготовить для каталога” action explicitly creates a package; it does not publish a book to the shared library.
- Existing personal books do not sync between devices. Preserve this current local draft workflow while designing authenticated publication as a separate, explicit next capability.
- The accessible GitHub repositories for the connected account were inspected; no `ai-library-generator` Worker source repository was found. The public app repository still contains no Worker source, Wrangler configuration or D1 schema. **Do not implement server-authoritative coins, XP rewards, user accounts or publication endpoints until the actual Worker project/schema is located and audited.**
- PR #43 remains open and unmerged. Its latest documentation commit is `861349b8190e3b671801dc079ec027fa914840ec`; the PR validation workflow completed successfully for this head.
- Deployment workflow inspection confirms GitHub Pages deploys only on pushes to `main`; pull requests run validation but do not receive a Pages preview URL. Do not use the production Pages site as a test deployment. A separate preview host/workflow must be designed without overwriting production.
- Next exact action: locate the Cloudflare Worker project (including any separate GitHub account/repository or Cloudflare source export), then inspect its routes, D1 schema, authentication and scheduled jobs. In parallel, plan a safe PR preview route. No application code or live Worker behavior was changed in this checkpoint.
