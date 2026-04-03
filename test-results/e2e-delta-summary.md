# E2E Delta Summary — 2026-04-03

## Pass Rate Trend

| Run | Timestamp | Total | Passed | Failed | Pass Rate |
|-----|-----------|-------|--------|--------|-----------|
| 1 | 2026-04-03T17:30:56Z | 12 | 9 | 3 | 75.0% |
| 2 | 2026-04-03T17:35:48Z | 12 | 9 | 3 | 75.0% |
| 3 | 2026-04-03T17:55:19Z | 12 | 10 | 2 | 83.3% |
| 4 | 2026-04-03T18:05:00Z | 20 | 18 | 2 | 90.0% |

## Current Failures (as of Run 4)

| Page | Check | Status | Ticket | Notes |
|------|-------|--------|--------|-------|
| explorer/address | no_error_banner | REAL BUG | [GOO-194](/GOO/issues/GOO-194) | "Something went wrong" on all address pages — Blockscout API error or no indexed txs |
| explorer/address | transactions_visible | REAL BUG | [GOO-193](/GOO/issues/GOO-193) + [GOO-194](/GOO/issues/GOO-194) | SSR returns `apiData: null`; only the address hash itself in body |

## New Tests Added (Run 4)

| Test | Page/Check | Result |
|------|------------|--------|
| TEST 8 | `bridge — page_loads` | ✅ PASS |
| TEST 8 | `bridge — has_bridge_content` | ✅ PASS |
| TEST 9 | `pool — page_loads` | ✅ PASS |
| TEST 9 | `pool — has_pool_content` | ✅ PASS |
| TEST 10 | `no_wallet — no_runtime_errors` | ✅ PASS |
| TEST 10 | `no_wallet — connect_wallet_present` | ✅ PASS |
| TEST 11 | `perps_content — ui_renders` | ✅ PASS |
| TEST 12 | `nav — nav_links_present` | ✅ PASS (stocks, predict, perps, bridge) |

## Bugs Found

### GOO-179 — Home page error element: FALSE POSITIVE (resolved, closed)
- **Verdict:** Next.js `#__next-route-announcer__` — not a real error.

### GOO-180 — Explorer address transactions not rendering (closed — done)
- **Root cause:** `getServerSideProps` returns `apiData: null` for all address pages — no SSR pre-fetch
- **Dev task:** [GOO-193](/GOO/issues/GOO-193) — assigned to Frontend Engineer
- **Impact:** Blank transactions tab on initial render; SEO bots see no data

### GOO-181 — Mobile horizontal scroll: RESOLVED
- **Fix:** `overflow-x-hidden` added to `frontend/src/app/page.tsx:28` (already in codebase)
- **Dev task:** [GOO-192](/GOO/issues/GOO-192) — closed as already resolved
- **Test:** `mobile — no_horizontal_scroll` now ✅ PASSES

### GOO-194 — Explorer address page shows "Something went wrong" (NEW — open)
- **Scope:** ALL address pages, not just one address
- **Evidence:** Both `0x70997...79C8` and `0xf39F...266` return "Something went wrong" in Transactions tab
- **Impact:** Explorer address details completely non-functional for end users
- **Dev task:** [GOO-194](/GOO/issues/GOO-194) — assigned to Frontend Engineer, priority medium
- **Root cause hypothesis:** Blockscout API backend returning error; no transactions indexed for devnet addresses OR API misconfiguration

## Mock Data Status

- **Stocks page:** No mock/placeholder keywords found in visible text
- **Perps page:** `perps — no_broken_prices` passes (no `$0.00/NaN/undefined` in prices)
- **Perps UI:** Renders tab structure (Trade/Portfolio/Leaderboard) — no wallet-gated data shown without connection (expected behavior)
- Source-level mock data still exists in:
  - `frontend/src/lib/stockData.ts` (MOCK_STOCKS)
  - `frontend/src/lib/perpsData.ts` (MOCK_PAIRS, MOCK_POSITIONS)
  - `frontend/src/lib/marketData.ts` (MOCK_MARKET_DATA)
- Blockchain vs UI comparison: deferred until GOO-193/GOO-194 resolved (explorer required for tx verification)

## Open Dev Tasks Filed by QA

| Ticket | Title | Assignee | Status |
|--------|-------|----------|--------|
| [GOO-192](/GOO/issues/GOO-192) | Mobile scroll fix | Frontend Engineer | done (already fixed) |
| [GOO-193](/GOO/issues/GOO-193) | Explorer SSR pre-fetch | Frontend Engineer | todo |
| [GOO-194](/GOO/issues/GOO-194) | Explorer "Something went wrong" | Frontend Engineer | todo |

## Screenshots

All screenshots saved to `test-results/screenshots/`:
- `normal-load.png` — Homepage, normal load
- `slow-3g.png` — Homepage, slow connection
- `fresh-user-no-cache.png` — Homepage, no cache
- `explorer-address-error-investigate.png` — Explorer address page investigation
- `mobile-scroll-investigate.png` — Mobile scroll investigation
- `perps-prices.png` — Perps page prices investigation
- `explorer-address-tx.png` — Explorer address transactions investigation
