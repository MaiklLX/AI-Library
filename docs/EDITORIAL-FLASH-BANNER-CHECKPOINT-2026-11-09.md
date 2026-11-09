# Editorial Flash Banner — checkpoint 2026-11-09

## Goal
Turn the homepage hero into a reusable flagship advertising space for AI Library titles. The visual sequence begins with the library's signature gold star, then a restrained gold flash reveals the cover of a highlighted book.

## Implementation
- Reduced the oversized homepage headline and refined its type scale for desktop and mobile.
- Added the existing AI Library four-point star mark directly below the headline as a compact animated signature.
- Reworked the featured cover area into an animated logo-to-cover reveal: glowing star, gold light sweep, then the selected book cover in the existing gold-framed editorial banner.
- Added reduced-motion behavior: show the selected cover statically and disable decorative motion.
- Registered «Пока нас не найдут» as the first editorial feature using `data-editorial-featured`.
- Added a reusable feature selector: any shelf card marked with `data-editorial-featured` is automatically collected for the banner. If multiple cards are marked, the banner rotates through them; it reads cover, title, synopsis, genres, target link, age and format from each card's metadata.
- Added validator assertions for the mark, flash, rotation controller, featured-card registration and reduced-motion support.

## Scope / safety
- Changes are limited to `index.html`, `scripts/validate.mjs`, and this checkpoint.
- No manuscript, release schedule, publication status, reader, offline storage, or catalog metadata was changed.
- Future highlighted cards can join the banner by adding `data-editorial-featured` and optional `data-editorial-age`, `data-editorial-format`, and `data-editorial-hook` attributes to their shelf card.

## Validation
- Static markup and selector checks are included in `scripts/validate.mjs`.
- Automated CI and deployed visual inspection are pending.

## Branch
`feature/editorial-spotlight-logo-flash-2026-11-09`
