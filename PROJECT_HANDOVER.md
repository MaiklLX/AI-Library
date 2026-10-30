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
- Last application feature commit: `102c77bb4531d10bb6ba0ad53beed9f5814d0eb2`
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

---
Last maintained: 2026-10-30.


## Visual audit — first source inspection (2026-10-30)

- The current visual identity is a dark charcoal/black base with muted gold accents, editorial serif headings and gradient book-card covers.
- Responsive rules already exist for desktop, tablet and mobile, including mobile navigation and a dedicated reader layout.
- The main stylesheet has accumulated several appended CSS revisions. The reader also has multiple versioned layout overrides. This is a regression risk: broad CSS cleanup or global typography/layout changes could undo carefully tuned page geometry and touch behavior.
- The first visual pass must therefore be scoped to the home/catalog and personal-library surfaces. Treat all `body.reader-open` rules and reader pagination/gesture code as protected until separately audited.
- No visual code was changed in this checkpoint. Next: create a clear token layer and make the first isolated home/catalog improvement; then validate at desktop/tablet/mobile widths and ask the user to check the actual device rendering before expanding the redesign.
