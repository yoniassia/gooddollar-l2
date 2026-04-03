# E2E Delta Summary — 2026-04-03

## Pass Rate Trend

| Run | Timestamp | Total | Passed | Failed | Pass Rate |
|-----|-----------|-------|--------|--------|-----------|
| 1 | 2026-04-03T17:30:56Z | 12 | 9 | 3 | 75.0% |
| 2 | 2026-04-03T17:35:48Z | 12 | 9 | 3 | 75.0% |

## Current Failures (as of this iteration)

| Page | Check | Status | Notes |
|------|-------|--------|-------|
| home | no_errors | FALSE POSITIVE | Next.js `#__next-route-announcer__` (role=alert, empty text, hidden) — not a real error. See GOO-179. |
| explorer/address | transactions_visible | REAL FAILURE | `0x...` address hashes not present in body text on initial load. Investigated in GOO-180. |
| mobile | no_horizontal_scroll | REAL FAILURE | `body.scrollWidth > window.innerWidth + 10` at 375px viewport. Investigated in GOO-181. |

## New Tests Added This Iteration

None added this iteration — investigation focused on root-causing existing failures.

## Bugs Found

### GOO-179 — Home page error element: FALSE POSITIVE (resolved)
- **Element:** `<div id="__next-route-announcer__" role="alert" aria-live="assertive">` — Next.js accessibility infrastructure
- **Verdict:** Not a real error. The element is visually hidden (1×1px, clipped), empty text, injected by Next.js on every page for screen-reader route announcements.
- **Test fix needed:** Exclude `#__next-route-announcer__` and require visible + non-empty text for `[role="alert"]` matches.
- **Issue:** [GOO-179](/GOO/issues/GOO-179) — marked done.

### GOO-180 — Explorer address transactions not rendering
- **Check:** `transactions_visible` (regex `/0x[a-f0-9]{8,}/i` on `body.innerText`)
- **Observation:** The explorer address page loads without error but transaction hashes are not present in page text at `networkidle`. Likely a delayed/async fetch or the address has no transactions on this devnet.
- **Status:** Being investigated in separate heartbeat run.

### GOO-181 — Mobile horizontal scroll
- **Check:** `body.scrollWidth > window.innerWidth + 10` at 375px width
- **Observation:** Some element(s) overflow their container at 375px iPhone viewport.
- **Status:** Being investigated in separate heartbeat run.

## Mock Data Status

- **Stocks page:** No mock/placeholder keywords found in visible text (1410 chars body)
- **Perps page:** No `$0.00/NaN/undefined` in visible prices
- Source-level mock data still exists in:
  - `frontend/src/lib/stockData.ts` (MOCK_STOCKS — unverified if used in production build)
  - `frontend/src/lib/perpsData.ts` (MOCK_PAIRS, MOCK_POSITIONS)
  - `frontend/src/lib/marketData.ts` (MOCK_MARKET_DATA)
- Further blockchain comparison (cast call vs UI values) needed in a future iteration.

## Screenshots

All screenshots saved to `test-results/screenshots/`:
- `normal-load.png` — Homepage, normal load, no errors
- `slow-3g.png` — Homepage, slow connection, no errors
- `fresh-user-no-cache.png` — Homepage, no cache, no errors
