# UI checkpoint — shelf and premiere polish (2026-11-09)

## Scope

Repository: `MaiklLX/AI-Library`  
Working branch: `fix/ai-library-shelf-premiere-polish-2026-11-09`  
Base: `main` at `29a2f396ffaae050e3da7708679dd63bffee0784`  
Current branch HEAD after this checkpoint: `6eb2989292b26493ae87587885e92bdc7c1a5553`

This is an isolated UI correction. No novel manuscript, catalog publication status, release date, or release automation was changed.

## Changes

### 1. «Громче, чем тормоза» — remove duplicate shelf card

- The canonical book record is already `published`.
- The manually rendered skate/pre-release collection card is now suppressed whenever the canonical book is published.
- The normal published book card remains on the shelf.
- The separate pre-release showcase continues to be driven by actual `prerelease` / locked `scheduled` status; no fake release card is added for a published book.

### 2. «Пока нас не найдут» — correct premiere destination

- The premiere showcase now links to `poka-nas-ne-naydut.html`, not the generic single-book `premiere.html` page.
- The CTA says «Открыть дилогию · 2 книги».
- Legacy direct URLs of the form `premiere.html?book=poka-nas-ne-naydut` redirect to the dedicated duology page.
- The dedicated page already contains two volume cards, with separate countdowns:
  - Book I — 13 November 2026, 18:00 MSK.
  - Book II — 20 November 2026, 18:00 MSK.
- Desktop layout remains two columns; narrow mobile layout remains one column. Existing dates and timers were preserved.

### 3. Duology shelf card — visible special-edition treatment

- Removed the old grayscale/dimmed-cover treatment.
- Restored the cover's original color and contrast.
- Added a restrained gold border, glow, gold title badge, and gold edition stamp.
- The back-face status now reads «ЗАКРЫТАЯ ПРЕМЬЕРА · 18+».
- Kept the existing card flip behavior and dedicated-page destination.

## Validation performed

- Confirmed `content/catalog.json` still marks `gromche-chem-tormoza` as `published`.
- Confirmed the published-status guard is present before rendering the manual skate collection card.
- Confirmed the duology card uses the non-muted cover class and the gold-highlight CSS.
- Confirmed both the shelf/premiere showcase route and the legacy premiere-page redirect target the dedicated duology page.
- Confirmed `poka-nas-ne-naydut.html` contains exactly two volume cards and two countdown timestamps, and its desktop/mobile grid rules remain intact.
- This is static source validation. A live browser visual QA / device check has not yet been performed.

## Safety boundary

- `main` remains at `29a2f396ffaae050e3da7708679dd63bffee0784`.
- No merge, GitHub Pages deploy, public release, or production-site change was performed.
- No CI success is claimed for this branch.

## Files

- `index.html`
- `premiere.html`
- This checkpoint and `PROJECT_HANDOVER.md`

## Next step

Review the branch in a desktop and mobile browser preview. Only after explicit approval should it be merged to `main` and published.
