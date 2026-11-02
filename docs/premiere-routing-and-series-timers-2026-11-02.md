# AI Library — premiere routing and six-volume countdown repair

Date: 2026-11-02

## Findings
- The catalog normalizer prefixes public book IDs with `published-`. The home-page premiere renderer compared those normalized IDs to raw IDs, so both cards fell through to the same `series.html` route and generic six-volume CTA.
- The series-page renderer referenced `release` before defining it. This raised a runtime ReferenceError during the first volume render and stopped the loop, preventing all six volume cards from appearing.

## Changes
- Added a canonical ID helper for premiere rendering; the six-volume novel routes to `series.html`, while «Пока нас не найдут» routes to `premiere.html?book=poka-nas-ne-naydut` and uses its own CTA.
- Parse each volume's `releaseAt` before evaluating publication state or registering countdown timers.
- Keep the published emblem for Tome I and countdowns for scheduled Tomes II–VI; release dates and book/catalog/series metadata are unchanged.
- Bumped the service-worker app-shell cache from v87 to v88 to invalidate stale cached presentation code.
- Added regression assertions for canonical premiere routing, release-date initialization and cache version.

## Safety
- No manuscript or book-content files changed.
- No release schedule or volume metadata changed.
- Backup branch: `backup/series-routing-and-timers-2026-11-02`.

## Verification
- Inline scripts in `index.html`, `series.html` and `premiere.html` parse successfully.
- CI validation is required before merge; Pages deployment must be confirmed after merge.
