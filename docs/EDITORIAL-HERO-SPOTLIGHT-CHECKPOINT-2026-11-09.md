# Editorial Hero Spotlight — checkpoint 2026-11-09

## Goal
Give the current flagship novel a full editorial showcase in the homepage hero, rather than relying only on a small corner badge and a catalog sticker. Establish a reusable visual pattern for future AI Library hits.

## Implementation
- Replaced the generic decorative star illustration on the right side of the homepage hero with a large editorial spotlight for **«Пока нас не найдут»**.
- Reused the existing approved cover asset: `content/books/Пока нас не найдут_ тайны и страсть.png`.
- Added clear hierarchy: «В центре внимания · Выбор редакции», «Главная премьера», 18+, 2 книги, title, short hook, synopsis, genres and a prominent CTA to `poka-nas-ne-naydut.html`.
- Kept the library identity, intro copy, catalog actions and statistics on the left.
- Added responsive layouts: two-column editorial showcase on desktop; compact side-by-side cover and text composition on phones; extra narrow-screen tuning.
- Added reduced-motion handling and meaningful image alt text.
- The spotlight is a reusable editorial slot: future featured titles can take this position without redesigning the homepage.

## Scope / safety
- Only `index.html` and this checkpoint document are changed on this feature branch.
- No manuscript text, release schedule, catalog publication state, book metadata, reader behavior, storage or release automation changed.
- The spotlight links to the existing dedicated duology page; it does not change the book's release status.

## Validation
- Source markup and responsive CSS are committed on the feature branch.
- Automated CI and deployed visual inspection are pending.
- Do not merge to `main` until CI passes and the visual result is reviewed.

## Branch
`feature/editorial-hero-spotlight-2026-11-09`
