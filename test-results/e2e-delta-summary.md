# E2E Delta Summary — 2026-04-03

## Pass Rate Trend

| Run | Timestamp | Total | Passed | Failed | Pass Rate | Notes |
|-----|-----------|-------|--------|--------|-----------|-------|
| 1 | 2026-04-03T17:30:56Z | 12 | 9 | 3 | 75.0% | Initial run |
| 2 | 2026-04-03T17:35:48Z | 12 | 9 | 3 | 75.0% | |
| 3 | 2026-04-03T17:55:19Z | 12 | 10 | 2 | 83.3% | |
| 4 | 2026-04-03T18:05:00Z | 20 | 18 | 2 | 90.0% | +8 new tests |
| 5 | 2026-04-03T19:57:00Z | 20 | 19 | 1 | 95.0% | |
| 6 | 2026-04-03T20:10:00Z | 24 | 23 | 1 | 95.8% | +4 new tests (explore/lend/stable/stocks) |
| 7 | 2026-04-03T22:05:00Z | 24 | 22 | 2 | 91.7% | Oracle redeployed (GOO-203 done) |
| 8 | 2026-04-03T22:25:00Z | 25 | 19 | 6 | 76.0% | +1 JS bundle test; GOO-209 detected |

## Current Failures (Run 8)

| Page | Check | Status | Root Cause | Ticket |
|------|-------|--------|------------|--------|
| js_bundle | client_js_loads | 🚨 CRITICAL | 5 JS+CSS chunks return 404 on goodswap.goodclaw.org | [GOO-209](/GOO/issues/GOO-209) |
| mobile | no_horizontal_scroll | 🚨 BLOCKER | Layout CSS 404 → Tailwind responsive classes don't load → desktop nav renders at 375px | [GOO-209](/GOO/issues/GOO-209) |
| stocks | empty_oracle_graceful | Symptom | JS 404 → wagmi never runs → oracle reads never fire | [GOO-209](/GOO/issues/GOO-209) |
| explorer | page_loads | Transient | Timeout (explorer may be temporarily slow) | monitor |
| explorer/address | no_error_banner | Known bug | Blockscout "Something went wrong" | [GOO-194](/GOO/issues/GOO-194) |
| explorer/address | transactions_visible | Known bug | SSR returns no tx data | [GOO-193](/GOO/issues/GOO-193) |

## 🚨 CRITICAL: GOO-209 — Frontend JS/CSS chunks 404

**Root cause confirmed via Playwright console analysis:**
- All `_next/static/chunks/*.js` return `404` with HTML content (not JS)
- `_next/static/css/app/layout.css` returns `404` (Tailwind CSS not loaded)
- 24 console errors: "Refused to execute script... MIME type text/html"
- **0 RPC calls made** — wagmi never initializes

**Symptoms caused by GOO-209:**
1. Client-side wallet connect broken
2. wagmi contract reads don't run → stocks/perps show empty data
3. Tailwind responsive CSS missing → desktop nav renders on mobile (scroll overflow)
4. All interactive features (swap, predict, bridge) non-functional

**Fix:** Rebuild frontend (`npm run build`) and redeploy to goodswap.goodclaw.org. Assigned to Frontend Engineer.

## New Tests Added (Run 8)

| Test | Page/Check | Result | Notes |
|------|------------|--------|-------|
| TEST 13 | `js_bundle — client_js_loads` | ❌ FAIL | Correctly detects GOO-209 (5 chunks 404) |

## Previously Found Bugs (Status)

| Ticket | Title | Status |
|--------|-------|--------|
| [GOO-179](/GOO/issues/GOO-179) | Home page error element: FALSE POSITIVE | done |
| [GOO-180](/GOO/issues/GOO-180) | Explorer address transactions SSR root cause | done |
| [GOO-181](/GOO/issues/GOO-181) | Mobile horizontal scroll (hero glow div) | done (fix in code) |
| [GOO-192](/GOO/issues/GOO-192) | Mobile scroll dev task | done (already resolved) |
| [GOO-193](/GOO/issues/GOO-193) | Explorer SSR pre-fetch | blocked (Blockscout external) |
| [GOO-194](/GOO/issues/GOO-194) | Explorer "Something went wrong" | blocked (Blockscout external) |
| [GOO-202](/GOO/issues/GOO-202) | Lend mock data no disclaimer | todo → FE Engineer |
| [GOO-203](/GOO/issues/GOO-203) | PriceOracle not seeded | **done** — redeployed with 12 tickers |
| [GOO-209](/GOO/issues/GOO-209) | **CRITICAL: JS/CSS chunks 404** | todo → FE Engineer |

## On-Chain Verification (Run 8)

All 6 contracts deployed on chain 42069 (block ~26036):
- GoodDollarToken: 1,000,000,000 G$ total supply
- StocksPriceOracle: **12 tickers seeded** — AAPL $178.72, TSLA $248.50, NVDA $875.30, etc.
- PerpEngine, MarketFactory, SyntheticAssetFactory, CollateralVault: all DEPLOYED
- `https://rpc.goodclaw.org` = `localhost:8545` (same chain, same data)

## Mock Data Status

| Module | Status |
|--------|--------|
| `perpsData.ts` | ✅ MOCKS REMOVED |
| `marketData.ts` | ✅ MOCKS REMOVED |
| `stockData.ts` | ✅ Oracle seeded (GOO-203 fixed), but GOO-209 prevents client reads |
| `lendData.ts` | ⚠️ STILL MOCK — disclaimer added (GOO-202 partial fix) |

## Test Coverage (25 tests)

| Category | Tests | Passing |
|----------|-------|---------|
| Homepage | 3 | 3 |
| Navigation | 1 | 1 |
| Stocks | 3 | 3 (client data unavailable due to GOO-209) |
| Predict | 1 | 1 |
| Perps | 2 | 2 |
| Bridge | 2 | 2 |
| Pool | 2 | 2 |
| Explore | 1 | 1 |
| Lend | 1 | 1 |
| Stable | 1 | 1 |
| No-wallet state | 2 | 2 |
| Explorer home | 2 | 1 (transient timeout) |
| Explorer address | 2 | 0 (GOO-193/194) |
| Mobile responsive | 1 | 0 (GOO-209) |
| JS bundle integrity | 1 | 0 (GOO-209) |
