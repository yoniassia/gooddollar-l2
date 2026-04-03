# E2E Delta Summary — 2026-04-03

## Pass Rate Trend

| Run | Timestamp | Total | Passed | Failed | Pass Rate |
|-----|-----------|-------|--------|--------|-----------|
| 1 | 2026-04-03T17:30:56Z | 12 | 9 | 3 | 75.0% |
| 2 | 2026-04-03T17:35:48Z | 12 | 9 | 3 | 75.0% |
| 3 | 2026-04-03T17:55:19Z | 12 | 10 | 2 | 83.3% |
| 4 | 2026-04-03T18:05:00Z | 20 | 18 | 2 | 90.0% |
| 5 | 2026-04-03T19:57:00Z | 20 | 19 | 1 | 95.0% |
| 6 | 2026-04-03T20:10:00Z | 24 | 23 | 1 | 95.8% |

## Current Failures (Run 6)

| Page | Check | Status | Ticket | Notes |
|------|-------|--------|--------|-------|
| explorer/address | transactions_visible | KNOWN BUG | [GOO-193](/GOO/issues/GOO-193) [GOO-194](/GOO/issues/GOO-194) | Blockscout infra issue — needs external deployment fix |

## New Tests Added (Run 6)

| Test | Page/Check | Result | Notes |
|------|------------|--------|-------|
| TEST 13 | `explore — token_list_loads` | ✅ PASS | ETH $3,012.45, USDC $1.00 visible; Total Market Cap shows $0 |
| TEST 14 | `lend — page_loads_with_content` | ✅ PASS | Detail: "NO DISCLAIMER (GOO-202)" — mock data visible |
| TEST 15 | `stable — page_loads_with_content` | ✅ PASS | gUSD vault UI renders |
| TEST 16 | `stocks — empty_oracle_graceful` | ✅ PASS | "Empty state handled" — oracle not seeded |

## Bugs Found (Run 6)

### GOO-202 — Lend page shows mock data without disclaimer (NEW — medium)
- **Evidence:** `frontend/src/lib/lendData.ts` comment: "All values are demo/devnet placeholders"
- **Specific values shown:** WETH $14.52M supplied, WBTC $17.14M supplied — all hardcoded
- **Comparison:** Stocks page has "Real oracle prices coming soon" disclaimer; Lend page has none
- **Assigned:** Frontend Engineer
- **Fix needed:** Either connect to on-chain GoodLendPool data, or add visible disclaimer

### GOO-203 — PriceOracle has no price feeds — stocks page empty (NEW — low)
- **Evidence:** Direct `eth_call` for `getPrice(string)` on all 12 tickers returns `0x` (no data)
- **Oracle address:** `0x0165878A594ca255338adfa4d48449f69242Eb8F` on chain 42069
- **Impact:** Stocks page shows empty table ("No stocks match your search")
- **Assigned:** Protocol Engineer
- **Fix needed:** Seed PriceOracle with Chainlink mock feeds for devnet tickers

## Bugs From Prior Runs (Status)

| Ticket | Title | Status |
|--------|-------|--------|
| [GOO-179](/GOO/issues/GOO-179) | Home page error element: FALSE POSITIVE | done |
| [GOO-180](/GOO/issues/GOO-180) | Explorer address transactions not rendering | done (QA complete) |
| [GOO-181](/GOO/issues/GOO-181) | Mobile horizontal scroll | done (fix already in code) |
| [GOO-192](/GOO/issues/GOO-192) | Mobile scroll dev task | done (already resolved) |
| [GOO-193](/GOO/issues/GOO-193) | Explorer SSR pre-fetch | blocked (Blockscout external) |
| [GOO-194](/GOO/issues/GOO-194) | Explorer "Something went wrong" | blocked (Blockscout external) |
| [GOO-202](/GOO/issues/GOO-202) | Lend mock data no disclaimer | todo |
| [GOO-203](/GOO/issues/GOO-203) | PriceOracle not seeded | todo |

## Mock Data Status (Updated)

| Module | Status |
|--------|--------|
| `perpsData.ts` | ✅ MOCKS REMOVED — uses on-chain hooks |
| `marketData.ts` | ✅ MOCKS REMOVED — uses CoinGecko + on-chain |
| `stockData.ts` | ⚠️ Mock functions deprecated (return empty) — oracle not seeded ([GOO-203](/GOO/issues/GOO-203)) |
| `lendData.ts` | 🚨 STILL MOCK — "demo/devnet placeholders" shown without disclaimer ([GOO-202](/GOO/issues/GOO-202)) |

## On-Chain Verification (New)

Devnet chain 42069, block ~22347, all 5 contracts deployed:
- GoodDollarToken: `0x5FbDB...aa3` — G$ total supply 1,000,000,000
- PriceOracle: `0x01658...Eb8F` — deployed but no feeds seeded
- PerpEngine: `0xa513E...853` — deployed
- MarketFactory: `0x8A791...318` — deployed
- SyntheticAssetFactory: `0x6101...788` — deployed

Explore page shows: G$ $0.0102, ETH $3,012.45, USDC $1.00 (via CoinGecko). Total Market Cap $0 (on-chain TVL not yet accounted).

## Pages Covered (24 tests across 16+ checks)

| Page | Tests | Status |
|------|-------|--------|
| `/` (home/swap) | 3 | ✅ All pass |
| `/stocks` | 3 | ✅ All pass (empty oracle noted) |
| `/predict` | 1 | ✅ Pass |
| `/perps` | 2 | ✅ All pass |
| `/bridge` | 2 | ✅ All pass |
| `/pool` | 2 | ✅ All pass |
| `/explore` | 1 | ✅ Pass |
| `/lend` | 1 | ✅ Pass (mock disclaimer missing — GOO-202) |
| `/stable` | 1 | ✅ Pass |
| Explorer home | 2 | ✅ All pass |
| Explorer `/address` | 2 | ❌ 1 fail (GOO-193/194), 1 pass |
| Mobile 375px | 1 | ✅ Pass |
| No-wallet state | 2 | ✅ All pass |
| Navigation | 1 | ✅ Pass |

## Pages NOT Yet Tested
- `/activity` — transaction history page
- Wallet connect flow (requires MetaMask interaction)
- Swap actual execution (requires wallet + tokens)
- Predict market creation/betting
- Bridge cross-chain flow
