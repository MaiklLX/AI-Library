# AI Library — Project Handover

> Living handover document for continuing development across ChatGPT conversations.
> Update this file after every substantial milestone and before ending a long development session.

## Project identity

- Repository: https://github.com/MaiklLX/AI-Library
- Production site: https://maikllx.github.io/AI-Library/
- Primary branch: `main`
- Product: AI Library — a Russian-language digital book library with regularly published books.
- Product direction: a premium, polished reading platform across web, Android and iOS.

## Current verified checkpoint

- Checkpoint date: 2026-10-30
- Last application feature commit before visual work: `102c77bb4531d10bb6ba0ad53beed9f5814d0eb2`
- Commit message: `Add safe offline book update checks`
- CI run #214: success — https://github.com/MaiklLX/AI-Library/actions/runs/41106373241
- GitHub Pages deploy #197: success — https://github.com/MaiklLX/AI-Library/actions/runs/41106373175
- Current Service Worker cache: `v49`
- Current catalog schema: `version: 1`; catalog currently lists `avtomaticheskaya-polnoch` and `ty-v-moih-planah`.
- Handover documentation commit: `9d58da96b453e02725e7e7337d0b33200155ff6e`.
- CI run #215: success — https://github.com/MaiklLX/AI-Library/actions/runs/41108319275
- GitHub Pages deploy #198: success — https://github.com/MaiklLX/AI-Library/actions/runs/41108319331
- The handover document is committed and the documentation commit is deployed.

## Implemented capabilities

### Platform and durable storage
- Cross-platform runtime: `src/platform/runtime.js`.
- IndexedDB database: `ai-library-platform`; stores include `books`, `metadata`, and `downloads`.
- Domain storage adapter: `src/platform/library-store.js`.
- IndexedDB writes resolve after transaction completion.
- Existing user data must be preserved. Do not clear localStorage, IndexedDB, caches, or reading progress as a shortcut.

### Personal library
- `#myLibrary` section with recently read books and personal books.
- Reading progress is displayed in the library.
- Downloaded published books are listed separately.

### Offline books
- `src/platform/download-manager.js` validates downloaded book JSON and stores the book as one IndexedDB record.
- The previous ready copy is retained until a replacement is fetched, validated and committed.
- Downloaded books can be restored after restart and read without network access.
- Storage usage/quota and persistent-storage status are exposed in the personal library.
- Persistent storage is requested only after an explicit user action; browser support and approval are not guaranteed.

### Safe update checks
- Downloaded books have a non-destructive update check.
- The check compares the currently stored book with the latest published content; it does not replace the local copy.
- The user explicitly starts the replacement download.
- If fetching or validation fails, the previous offline copy remains intact.
- Offline startup uses the last locally cached published catalog and restored offline downloads.

## User-approved product principles

1. Build a real product, not just a site wrapped in an APK.
2. Support web, Android and iOS with a coherent experience.
3. Downloaded books must remain readable offline.
4. Internet is used for catalog updates, new books and explicit updates to downloaded books.
5. Never silently download full book contents on mobile data at startup.
6. Keep downloaded books in durable storage, separate from temporary Service Worker cache.
7. Preserve existing reading progress, personal books and user data.
8. Do not destabilize the reader, page-turn gestures, pagination or mobile layout.
9. Prefer free/open technologies and avoid mandatory paid APIs or subscriptions.
10. Work in small, reversible changes. Validate syntax, update validators, bump Service Worker cache when required, then check CI and deploy.
11. Do not claim a feature is tested or published until the corresponding checks have actually passed.

## Visual direction agreed with the user

The visual redesign is an explicit product priority, alongside finishing core reliability.

Desired direction:
- Premium, recognizable visual identity across web, phone and tablet.
- Beautiful editorial book presentation: covers, curated shelves, categories, recommendations and search.
- A refined “My Library” with book covers, reading progress, collections and download controls.
- Reader focused on comfort: typography, themes, font size, spacing and reliable page-turn interaction.
- Thoughtful motion, depth and restrained 3D details; effects must not reduce performance or accessibility.
- Mobile experience should be intentionally designed for Android and iOS, not merely a squeezed desktop layout.

Current observed visual foundation in `index.html`:
- Dark charcoal/black and muted gold palette.
- Serif editorial headings, hero section and decorative artwork.
- Book cards with genre-specific gradient covers.
- Existing responsive rules for tablets and phones, mobile genre scrolling and full-screen mobile reader.
- Several incremental visual CSS layers already exist (including hero animation and button feedback). Audit before adding more overrides; avoid stacking duplicate CSS patches without a clear design system.

## Roadmap

### Phase A — reliability and continuity
- [x] Cross-platform runtime and IndexedDB adapter.
- [x] Personal library.
- [x] Offline download manager.
- [x] Storage persistence status and explicit request.
- [x] Safe update check for downloaded books.
- [ ] Catalog-only update notification on startup (do not fetch every book body and do not auto-download).
- [ ] Real-device regression pass for offline launch, download, update and reader.

### Phase B — visual audit and design system
- [ ] Inspect the current production site and current source before changing visual code.
- [ ] Capture/record the existing desktop, tablet and mobile layout; identify visual defects and duplicated styles.
- [ ] Define tokens for colors, typography, spacing, radii, shadows, motion and focus states.
- [ ] Agree on a cohesive premium direction before broad redesign.
- [ ] Keep all changes incremental and reversible.

### Phase C — product screens
- [ ] Redesign home/catalog: hero, editorial shelves, discovery, categories, search and book cards.
- [ ] Redesign “My Library”: covers, progress, recent reading, personal books and offline management.
- [ ] Refine the reader without regressing pagination, page-turn gestures, numbering or offline behavior.
- [ ] Deliver intentional mobile and tablet layouts, safe-area handling and accessible touch targets.

### Phase D — app readiness
- [ ] Validate installability and offline behavior.
- [ ] Continue native Android/iOS packaging strategy without making the web reader dependent on network.
- [ ] Test on actual devices and document known platform limitations.

## Safe working protocol for every new chat

1. Read this file first.
2. Check the latest `main` branch SHA and recent GitHub Actions runs; do not assume this document is current.
3. Inspect the exact files/functions before editing.
4. Make one coherent, small change at a time.
5. Run syntax checks and project validators; add/update assertions for new behavior.
6. Bump the Service Worker cache version when cached app-shell assets change.
7. Commit and push without force-pushing; use the expected current branch SHA.
8. Verify CI and deployment by exact run IDs and commit SHA.
9. Update this handover with the new commit, checks, current state, remaining work and next concrete step.
10. Tell the user what changed, what passed, what is deployed, and what still needs real-device testing.

## Immediate next actions

1. Re-check the result of the documentation commit and its CI/deploy runs.
2. Resume from the latest `main` state.
3. Finish a safe catalog-only update indicator at startup, without downloading book bodies automatically.
4. Begin a structured visual audit of desktop/tablet/mobile screens before making large visual changes.
5. Preserve all existing reader behavior and user data.

## Important files

- `index.html` — current application shell, screens, reader and much of the UI.
- `sw.js` — Service Worker and app-shell cache version.
- `manifest.webmanifest` — install metadata.
- `src/platform/runtime.js` — platform detection and IndexedDB foundation.
- `src/platform/library-store.js` — durable storage adapter.
- `src/platform/download-manager.js` — offline downloads, safe updates and storage persistence.
- `content/catalog.json` — published book catalog.
- `content/books/*.json` — published book content.
- `scripts/validate.mjs` — repository validation and regression assertions.


## Visual system milestone 1 — editorial tokens and catalog polish (2026-10-30)

- Added a new isolated style layer at the end of the document head, marked `AI Library visual system: editorial tokens v1`.
- Defined reusable design tokens for charcoal surfaces, warm gold accents, muted text, soft borders, focus rings and editorial shadows.
- Applied the first restrained visual pass only to the home hero artwork and catalog controls: richer hero lighting, clearer catalog section separation, improved search/sort focus states, and keyboard-visible genre focus.
- Added reduced-motion handling for the new transitions.
- No reader selectors, reader pagination, page-turn gestures, IndexedDB, localStorage, book content or user data were changed.
- Updated Service Worker app-shell cache from `v49` to `v50` because `index.html` changed.
- Added release-validator assertions for the token layer, catalog focus treatments and cache version.
- Commits: visual layer `f2a3ac29080dfebb92adcc7be3f47efc57b13e55`; SW cache `131f1c7caf2a21d9b34f6ed80f1dba1a83b10e87`; validator `3efc3caf861c04a2d6175ae301851dbd99dc9083`.
- Final milestone commit: `5b3075c3e477c636afe1be90bbd3454c9d9a5155`.
- CI run #217: success — https://github.com/MaiklLX/AI-Library/actions/runs/41109826316
- GitHub Pages deploy #200: success — https://github.com/MaiklLX/AI-Library/actions/runs/41109826256
- Service Worker cache `v50` and validator assertions are included in the deployed commit.
- Next: verify CI and Pages deployment; then inspect screenshots/actual rendering at desktop, tablet and mobile widths before expanding the redesign. Do not proceed to the reader or broad CSS cleanup.


## Book-card action usability fix (2026-10-30)

- User reported that the primary "Читать" action had become too small and that "Скачать / Доступна офлайн" was awkward to use on book cards.
- Source audit found explicit compact rules shrinking the read button to 34px height and 10px text at tablet/mobile widths, then to 9px text below 380px. The download action had no equivalent dedicated sizing.
- Added a final isolated style layer in `index.html`: both actions now have balanced button dimensions, 48px desktop/very-small-screen minimum height and 46px at intermediate mobile widths, larger readable text, clear focus rings, and a prominent warm-gold primary "Читать" button. Download/offline remains secondary but readable and easy to tap.
- No card flip logic, click handlers, download manager behavior, reader code, book data, or storage was changed.
- Service Worker cache bumped from `v50` to `v51`; validator checks were added for the new layer and minimum touch target.
- Implementation commits: `c373874979a26c2eb87c061c57f7cfa59b875a63`, `d449c0e2f23e054865b4a9e135ef2f4db111266c`, `3cc228f9b6b61d9ec56a3eebeedd1b3e0f11d210`.
- The first CI attempt exposed a stale validator assertion still expecting cache `v50`; corrected it to `v51` in commit `2d0a509a24148ed9ed2b05a8db6be7f95b7793cc`. The final CI/deploy run for this corrected state is pending verification.
- Next: verify CI and Pages deployment, then user should test card flip and both buttons on an actual phone; adjust further only from observed behavior.


## Metadata-first catalog and on-demand book content (2026-10-30)

- Corrected startup behavior: `loadPublishedBooks()` now reads book display metadata from `content/catalog.json` only. It no longer fetches every full `content/books/*.json` body at launch.
- Expanded catalog entries with the fields needed for cards and prerelease presentation, plus `metadataOnly: true` and `chapterCount`; the catalog itself contains no chapter text.
- Full published book JSON is fetched only when the user explicitly opens a book. The existing download action continues to fetch and validate full content only after the user presses Download.
- Existing offline downloads remain usable: IndexedDB download records are merged over catalog metadata at startup, restoring their full chapter content for offline reading. The merge was corrected to prefer the downloaded record over metadata.
- Legacy published-book localStorage cache is converted to metadata-only records on fallback; downloaded content is not copied into the catalog cache.
- Preserved reading progress counts, personal-library recent books, and random discovery using metadata chapter counts.
- Service Worker app-shell cache bumped from `v51` to `v52`.
- Release validator now checks metadata-only catalog entries, startup mapping without book-body fetches, lazy fetch on read, and the updated cache version.
- Current implementation SHA: `712cc04c02676591525329cf3e19e818d24d7aea`.
- CI and Pages deployment for the final SHA: pending verification at the time of this checkpoint.
- Real-device follow-up: test opening a not-yet-downloaded book online, opening a downloaded book offline, progress restoration, random discovery, and confirm no full book JSON is requested on initial startup.
- Next: verify CI/deploy, then add a lightweight catalog-update notice based on metadata revision only (no automatic chapter fetches).

---
Last maintained: 2026-10-30.


## Visual audit — first source inspection (2026-10-30)

- The current visual identity is a dark charcoal/black base with muted gold accents, editorial serif headings and gradient book-card covers.
- Responsive rules already exist for desktop, tablet and mobile, including mobile navigation and a dedicated reader layout.
- The main stylesheet has accumulated several appended CSS revisions. The reader also has multiple versioned layout overrides. This is a regression risk: broad CSS cleanup or global typography/layout changes could undo carefully tuned page geometry and touch behavior.
- The first visual pass must therefore be scoped to the home/catalog and personal-library surfaces. Treat all `body.reader-open` rules and reader pagination/gesture code as protected until separately audited.
- This initial audit preceded the first visual implementation. The isolated token layer and home/catalog polish are now committed and deployed in the milestone above. Next: capture/inspect desktop, tablet and mobile rendering, then adjust only the affected home/catalog selectors.

## Metadata-first loading validation and release recovery (2026-10-30)

- Confirmed the metadata-first implementation on `main`: startup loads `content/catalog.json` metadata only; it does not fetch full book JSON bodies. Full text is fetched on explicit read, and the existing explicit download flow remains unchanged.
- The first release attempts exposed defects in newly added validator assertions (incorrect regular-expression escaping and checking the Service Worker cache version against the HTML document). These were corrected in `scripts/validate.mjs`; no reader, storage, download, or book-content behavior was changed during this recovery.
- Final validator correction commit: `2876c0aeba220fe12d16ce98ac80019b109f0948`.
- CI run #239 / ID `41113431453`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41113431453
- GitHub Pages deploy #222 / ID `41113431733`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41113431733
- Both checks completed successfully for the same `main` SHA. Service Worker cache remains `v52`.
- Earlier failed runs are superseded by the successful final runs above; do not treat their failures as the current release status.
- Next: add a lightweight catalog-update notice based on catalog metadata/revision only, with no automatic book-body fetches. Before coding, inspect current catalog fields and decide a stable revision/signature strategy. Then perform the structured desktop/tablet/mobile visual audit. Preserve reader interactions and all existing user data.

## Metadata-only catalog update notice (2026-10-30)

- Added a compact, dismissible catalog update notice immediately below the site header.
- On a successful catalog fetch, the app builds a deterministic snapshot from catalog metadata only: book ID, title, author, genre, status, revision, chapter count, description and release date.
- The first successful visit establishes a baseline without showing a false update alert. Later changes are classified as added, changed or removed catalog entries.
- The last-seen metadata signature is stored under the new dedicated key `ai-library-catalog-update-state-v1`; no existing library, reading-progress, personal-book or download storage keys are changed or cleared.
- Repeated identical updates are not announced again. Offline/error fallback does not run the comparison and does not display a false update.
- The notice uses textContent for the dynamic message, has an accessible status region and dismiss control, and explicitly states that book texts were not downloaded.
- No book-body fetch, download-manager, reader, pagination, offline-book or progress logic was added to or changed by this feature.
- Service Worker app-shell cache bumped from `v52` to `v53`.
- Release validator includes assertions for the metadata snapshot/check, notice UI, safe text rendering, no-book-body message and cache version.
- During validation, CI exposed three older validator assertions still pinned to `v52`; all were updated to `v53`. Earlier failed runs are superseded by the final checks for the current SHA.
- Implementation commits: `52b362570e1fe481e5d0c656529f477d1b152bb1` (notice), `e7b7f7f16d37c87ca2450f44d336d2baa6b728bb` (cache), `81dc7047cf5005f08f2bcbe4308abe10955481d0` (validator text check), `5768944798071f92c3c035f63e6a4063ed21bcca` (all cache assertions aligned).
- CI run `41116061883`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41116061883
- GitHub Pages deploy run `41116062025`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41116062025
- Both completed successfully on SHA `6fc78545258b2378daa55d828fbd535ae1d88006`.
- Next: verify the final CI/deploy runs, then perform the structured desktop/tablet/mobile visual audit. Keep reader interactions and all user data protected.

## My Library responsive shelf refinement (2026-10-30)

- Completed a source-level responsive audit of the existing home hero, catalog and personal library CSS at desktop, tablet and mobile breakpoints. The audit confirmed the catalog's responsive search/filter controls and two-column-to-one-column book grid, plus the library's one-column mobile behavior.
- Identified one clear desktop/tablet layout inefficiency: the third (offline downloads) shelf occupied only half of the two-column shelf grid, leaving a large unused half-row.
- Added isolated style block `my-library-desktop-grid-v2`: on widths 681px and above the offline shelf spans the full row and its book list uses two balanced columns; at 680px and below it explicitly returns to one column.
- No reader selectors, reader JS, touch handlers, pagination, download manager, storage keys, progress state or book content were changed.
- Added validator assertions for the desktop/tablet full-row shelf, two-column download list and mobile single-column fallback.
- Code commit: `c92f0ad6001c91811f43347bdd055929eb711e77`; validator commit: `953ef4fb341a70f8ae1a419f74e04329160f2338`.
- CI run `41116612010`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41116612010
- GitHub Pages deploy run `41116611952`: success — https://github.com/MaiklLX/AI-Library/actions/runs/41116611952
- Both checks completed successfully on SHA `953ef4fb341a70f8ae1a419f74e04329160f2338`.
- Note: this was a source/CSS structural audit, not a live screenshot-based device rendering test. Real device confirmation remains useful after deployment.
- Next: continue a conservative visual pass over the home hero/catalog and library controls. Keep reader layout and interaction code protected.

## Single-book catalog balance (2026-10-30)

- The published catalog currently contains one full published book; the catalog grid still reserved three desktop columns, leaving the only card visually stranded in a narrow left column.
- Added isolated style layer `catalog-single-book-balance-v1` in `index.html`: when the grid contains exactly one book card, it uses a centered, responsive column capped at 360px. As soon as more books are published, the selector stops matching and the existing three-/two-/one-column responsive grid remains in control.
- No book-card markup, flip interaction, read/download handlers, reader code, pagination, IndexedDB, localStorage, catalog data or user records were changed.
- Service Worker app-shell cache bumped from `v53` to `v54`.
- Added validator assertions for the isolated style, one-card selector and responsive column sizing; updated existing cache assertions to `v54`.
- This is a source-level layout correction; actual rendering on physical devices remains to be confirmed.
- Next: verify CI and GitHub Pages deployment on the final handover commit, then continue the home/catalog visual pass based on real-device feedback.

## Signature star metallic shimmer (2026-10-30)

- Added isolated CSS layer `ai-library-star-sheen-v1` for the four-point star in the header logo and the larger star in the home hero banner.
- Header mark receives a periodic diagonal metallic highlight, restrained gold glow and soft surface lighting. Hero star keeps its existing float motion while a slow gold/champagne gradient sheen travels across it.
- Motion is deliberately low-frequency and non-flashing; no JavaScript timers, event handlers, external assets or new dependencies were added.
- Both effects are disabled under `prefers-reduced-motion: reduce`.
- No reader styles or scripts, touch/pagination behavior, book cards, storage, downloads or user data were changed.
- Service Worker cache bumped from `v54` to `v55`; validator now checks both keyframes, the isolated layer and reduced-motion handling.
- Source-level validation only; visual appearance still needs confirmation on desktop and mobile after deployment.

### Validation follow-up

- The first CI attempt correctly blocked deployment because the newly added reduced-motion assertion used an over-escaped regular expression. The animation CSS itself was not the failing check.
- Replaced that assertion with two focused checks for the media query and the hero-star animation override. Validator fix commit: `83b6da2daae66bf047d3f93c6d0e05d6e0fe0361`.
- Re-run CI and Pages deployment on this commit before treating the visual change as published.

### Validator assertion adjustment (continued)

- A second CI run showed the escaped regular-expression delimiters were still over-escaped by the file-update string. Replaced both reduced-motion assertions with literal `includes()` checks, avoiding regex parsing entirely.
- Validator fix commit: `79333f0ba5fe13efd0c29a03909257252fd1ed78`. Re-check CI and deployment on the final handover commit.

## Signature star ambient light refinement (2026-10-30)

- Follow-up to the initial metallic shimmer, based on device feedback: the sheen was visible but too restrained, and the loop reset was noticeable.
- Replaced the isolated style layer with `ai-library-star-sheen-v2` in `index.html`.
- Header logo now combines a warmer radial core, layered gold glow, four subtle ambient points and a diagonal highlight that stays invisible at the exact same transform/opacity at the start and end of its 10.8-second cycle.
- The home-hero star now has a slowly rotating elliptical orbit, four softly pulsing light particles and a more expressive gold glow. The metallic gradient is held static so it no longer jumps back to its initial position on each cycle.
- Motion remains CSS-only, low-frequency and non-flashing. All new logo/star motion and pseudo-elements respect `prefers-reduced-motion: reduce`.
- Service Worker app-shell cache bumped from `v55` to `v56`; `scripts/validate.mjs` checks the new layer, animations, seamless logo-sheen endpoints, reduced-motion handling and cache version.
- No reader code, page navigation, touch handling, book content, storage, downloads or user data were changed.
- This is a source-level refinement; verify the visual intensity and layering on desktop and mobile after deployment.
- Latest feature implementation is on `main`; CI and Pages deployment must be checked on the final handover commit before calling it published.

### Validation follow-up

- The first enhanced-star CI run caught a stale validator assertion that expected the previous single-selector reduced-motion rule. The new CSS correctly disables the star and its pseudo-element layers together; the assertion has been updated to check the new grouped selector.
- Validator correction commit: `f7dd010f18f88bb58790af1fad84e27827314152`. Re-check CI and Pages deployment on the final handover commit.


## Offline Engine metadata-only update verification (2026-10-31)

- Audited the current `main` branch before changing code. Confirmed the offline foundation already exists: IndexedDB runtime, library storage adapter, download manager, personal-library offline shelf, metadata-first catalog, and Service Worker app-shell caching. Do not rebuild these modules from scratch.
- PR #38 merged: `e00e2124552b2eab0f1b5bd5442b085dac0f5ed7`.
- `src/platform/download-manager.js` now stores `catalogRevision` with each successful download.
- `checkForUpdate()` now fetches only `content/catalog.json` and compares the catalog revision with the revision stored in the local book. It no longer fetches the complete book JSON just to check whether an update exists.
- The full book body is still fetched only when the user explicitly downloads or updates a book.
- Before saving a downloaded body, the manager rejects a mismatch between `entry.revision` and `book.revision`; the previous ready offline copy is untouched because the IndexedDB write occurs only after validation.
- The validator now requires a revision on each published catalog entry, verifies catalog/book revision equality, and asserts that the update-check workflow does not fetch `entry.path`.
- Service Worker cache bumped from `v56` to `v57`.
- Mocked workflow checks passed: equal revisions report no update; changed revisions report an available update; update check makes exactly one request to `./content/catalog.json`; mismatched book revisions are rejected without a storage write; valid download records the expected revision.
- PR validation run #278 / ID `41122923081`: success on head SHA `f0a8e007676412faa30fcdfffb5c31ce34fbd396`.
- Main validation and GitHub Pages deploy were queued after merge; verify final conclusions before calling the merged version deployed.
- No reader pagination, touch gestures, personal-book data, or existing IndexedDB records were cleared or migrated.
- Physical-device offline testing remains outstanding.
- Next: verify main CI/Pages, then run the offline book lifecycle on Android and iOS Safari (download, relaunch, airplane mode, read, progress, reconnect, update).

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

- Stop automatic/background generation of public-catalogue books once the external Cloudflare Worker source is available and audited. The scheduled handler has not yet been disabled.
- Keep the existing user-facing Book Creator as a core feature. Its current workflow is user-driven: prepare a brief, work with ChatGPT, import/edit a manuscript, preview it, and save/export personal books locally. The inspected creator currently uses browser localStorage; it is not a server-backed multi-device author account.
- Target lifecycle: private draft → preview/completeness checks → explicit publication by the author for a clearly displayed coin fee → attributed public book → eligibility for community ratings/competitions. The author-paid fee is confirmed; exact amount, moderation and refund/settlement rules remain open.
- Require explicit author confirmation before any coin debit. Private drafting, preview, local save and export remain free.
- Separate spendable coins, permanent book ratings, author XP and profile statuses. Competition XP is granted only once after server-verified final standings.
- Do not delete existing public books or personal drafts. Do not remove any explicit user-initiated creation path if it is required by Book Creator.
- Worker-side scheduled generation remains pending because the Cloudflare dashboard/source is currently unavailable. No live generation behavior has been changed.
- PR #42 records this product direction in docs/COMMUNITY_SYSTEM_SPEC.md and docs/PROJECT_HANDOFF.md. Application and Worker code remain unchanged.
