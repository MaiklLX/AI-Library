# AI Library — scheduled six-volume release gate

Date: 1 November 2026  
Candidate branch: `release/scheduled-six-volume-reader-v4-main-sync-2026-11-01`  
Draft PR: [#84](https://github.com/MaiklLX/AI-Library/pull/84). Current code candidate is mergeable; production `main` remains unchanged.  
Base: current `main` at `3efd0b726351ea5f70e3b589c0cd91211996c515`.

## Release payload

| Volume | Reader ID | Chapters | State | Release |
|---|---|---:|---|---|
| I · Тишина между щелчками | `ty-v-moih-planah-tom-01` | 16 | scheduled | 2 Nov 2026, 18:00 MSK |
| II · Внутренний маршрут | `ty-v-moih-planah-tom-02` | 18 | scheduled | 9 Nov 2026, 18:00 MSK |

Volume I is editorially complete and accepted: 16 chapters, 25,498 words. Its manuscript is not reopened. Volume II contains 18 chapters, 24,211 words. The series teaser remains separate from volume I's reader ID.

## Full schedule

- I — 02 Nov 2026, 18:00 MSK
- II — 09 Nov 2026, 18:00 MSK
- III — 16 Nov 2026, 18:00 MSK
- IV — 23 Nov 2026, 18:00 MSK
- V — 30 Nov 2026, 18:00 MSK
- VI — 07 Dec 2026, 18:00 MSK

## Release gate implementation

- Central `isBookReleaseLocked` guard blocks scheduled books until `releaseAt`.
- Catalog discovery, genres, random discovery, saved progress, continue-reading, direct reader launch, and the reader modal use the guard.
- An already-open catalog refreshes when a scheduled release boundary is crossed.
- The series page requires matching reader ID, metadata entry, chapter count, path, and `releaseAt` before it exposes the reading link.
- Service worker cache was advanced from the current main version v80 to v81; current main app-shell changes were retained.

## Validation status

- The previous candidate passed 16/16 structural checks and 18/18 time-boundary checks.
- This rebased candidate is based on current main, which had advanced 11 commits beyond the former PR base. The release changes were reapplied as focused patches; the Service Worker cache was advanced to v81 rather than reverting current main's v80.
- GitHub Actions `Validate AI Library` passed on code HEAD `8f3c3ed461834975fd7758d4619622d836bfc1fe`: run [#41274760088](https://github.com/MaiklLX/AI-Library/actions/runs/41274760088), job `validate` completed successfully. A later QA-documentation-only update will receive its own CI run.
- Real browser verification on mobile and desktop remains outstanding.
- GitHub Pages serves pre-positioned JSON files by direct URL. The client-side guard controls the site UI but does not provide strict confidentiality against direct requests before release. A Worker/gateway or publication of book bodies at release time is required for strict server-side blocking.
- Do not merge into production `main` without the user's explicit approval.
