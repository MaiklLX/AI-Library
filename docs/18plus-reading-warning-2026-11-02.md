# AI Library — 18+ reading warning checkpoint

Date: 2026-11-02

## Finding
The published Tome I has `ageRating: "18+"` and the `18+` genre tag, but the public reader opening workflow did not contain an age-confirmation dialog. The book details only displayed the age marker; this was not a reader interstitial.

## Change
- Added a dark graphite-and-gold age warning dialog with a clear 18+ emblem, explanatory copy, explicit confirmation ("Мне есть 18 лет · читать") and back action.
- Trigger it for books with `ageRating: "18+"`, a `genres` entry equal to `18+`, or an 18+ marker in the genre text.
- Place the check in the shared `openBookById` workflow after content is loaded and immediately before the reader opens. This covers series Tome I direct launch, Continue Reading, and other guarded entry points.
- Show the warning on each new attempt to open an 18+ work; no persistent acceptance flag is stored.
- Preserve focus, support Escape/backdrop cancellation and keep keyboard focus within the dialog.
- Update the pending direct-reader launch visibility so the age warning can be displayed before the reader itself.
- Bump Service Worker cache to v89 and add validation assertions.

## Safety
- No book content, manuscript, catalog metadata, genre tags, release status or release schedule changed.
- Backup branch: `backup/18plus-reading-warning-2026-11-02`.

## Verification
- All seven inline scripts in `index.html` pass JavaScript syntax parsing.
- Regression assertions cover age metadata detection, the dialog actions and the warning-before-reader ordering.
- CI and Pages deployment must pass before release.
