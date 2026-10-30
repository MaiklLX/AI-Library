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

## State at this checkpoint

This checkpoint records the agreed product direction and recovery protocol. It does **not** assert that offline book downloads, PWA installation, or native packaging are already implemented. The next implementation step should begin with an audit of the current `main` branch to locate the existing book model, reader loading path, persistence layer, service worker, and manifest. Then propose a minimal offline-first implementation plan based on the actual code.
