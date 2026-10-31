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
- Target lifecycle: private author draft → preview/completeness checks → explicit publication by the author for a clearly displayed coin fee → attributed public book → eligibility for ratings and competitions. The author-paid coin fee is confirmed; exact amount, moderation and refund/settlement rules remain open.
- Require explicit author confirmation before any coin debit. Private drafting, preview, local save and export remain free.
- Add a creator progression system: competition placements award verified author XP; XP/achievements unlock profile statuses. Coins remain a separate spendable currency; XP/status are non-spendable progression.
- Competition scoring needs refinement before implementation. A daily shortlist/ranked competition is likely needed if the product is to award top-place rewards; preserve lifetime book rating separately from daily event results.
- Do not delete existing catalogue books or personal drafts. Do not remove the user-initiated generation path if it powers the book creator.
- The automatic scheduled generation handler lives in the external Cloudflare Worker, which is not currently accessible. It has **not** been disabled. The Worker source must be inspected before changing scheduled behavior or generation routes.
- No application code, Worker code, catalogue records, or user data were changed in this product-direction checkpoint.
- Next: inspect the book creator page and its save/export behavior; then isolate the exact automatic-generation trigger(s) in the frontend and document the Worker-side scheduled handler when source access is restored. Implement UI/code changes only after confirming that manual creation remains intact.


## Product direction reset — offline-first library (2026-10-31)

The user has reprioritized the product. This section supersedes earlier creator-economy rollout assumptions where they conflict.

### Current product focus
- Prioritize a complete, polished AI Library website and cross-platform app experience (desktop, Android, iOS/PWA).
- Prioritize reliable offline use: app shell, local book downloads, offline reading after app restart, local reading progress/settings/favorites/bookmarks, storage visibility and safe recovery.
- The repository already contains an offline foundation: IndexedDB stores in `src/platform/runtime.js`, `src/platform/library-store.js`, and `src/platform/download-manager.js`; an offline shelf in `index.html`; and a Service Worker app shell/network fallback in `sw.js`. Audit and strengthen these components rather than rebuilding them.
- The current Service Worker cache version on main is `v57`. Review cache invalidation and app-shell assets carefully when making future changes.
- The first implementation step is to hide the public “Создать книгу” navigation action. Keep `book-creator.html` and its local-first implementation in the repository for future use; do not delete drafts, exports, or editor code. This is a navigation change, not a claim that the creator route is removed or secured.
- The project team will curate and add catalogue books, covers, descriptions and editorial content manually for now.

### Deferred, not cancelled
- Google OAuth and email OTP authentication.
- Coins, bonuses, XP, ranks, achievements, public author progression and community economy.
- User-facing self-service book creation/publication rollout.
- Backend v2 expansion and custom-domain/email-provider decisions.
- Preserve the design documents and open PRs as reference material. Do not merge or deploy them as part of the current offline-first milestone.

### Working priorities
1. Hide the creator CTA without disturbing catalogue, favorites or personal library navigation.
2. Audit and test the existing offline download lifecycle, including interrupted downloads, failed validation, update rollback, missing local data and storage-pressure messaging.
3. Verify that a downloaded book opens and remains readable after closing/reopening the installed app in airplane mode.
4. Preserve the reader's touch/page-turn behavior, pinch font resizing, cross-chapter page numbering, and desktop/Android behavior.
5. Improve installation guidance and platform-specific polish; evaluate native wrappers only after the PWA experience is reliable.
6. Populate and quality-check the catalogue with editorially curated books.

### Release discipline
- Work on dedicated branches and draft PRs. Keep `main` and production unchanged until the user explicitly approves merge/deployment.
- Do not claim physical-device validation unless it was actually performed.
- Keep the economy/authentication/backend work documented and recoverable; do not spend implementation effort on it until the user reprioritizes it.
