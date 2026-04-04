# GoodDollar L2 — Autobuilder Scope

## Vision
One chain where AI agents do everything in finance — and every transaction funds UBI for humans. See docs/VISION.md for the full picture.

## Active Workstreams

### 1. GoodSwap — DEX & Cross-Chain Swaps (PRIORITY: HIGH)
**Status:** Frontend live, Uniswap V4 hook deployed, no real swaps yet
**Next:**
- [x] Deploy Uniswap V4 pool factory + router on devnet
- [x] Create initial liquidity pools (G$/ETH, G$/USDC, ETH/USDC) — GoodPool x*y=k AMMs deployed with UBI fee routing
- [x] Connect frontend to real on-chain swap execution — useGoodSwap hook + GoodPoolABI wired
- [x] Li.Fi / bridge aggregator integration for cross-chain swaps — LiFiBridgeAggregator.sol with escrow + UBI fees + keeper completion
- [x] Price feed integration (CoinGecko API → on-chain oracles) — SwapPriceOracle.sol + backend/swap-oracle keeper
**Research:** Study Uniswap V4 hooks, Li.Fi SDK, 1inch aggregator

### 2. GoodPerps — Perpetual Futures (PRIORITY: HIGH)
**Status:** Frontend live, PerpEngine + MarginVault + FundingRate deployed
**Next:**
- [x] Backend order matching service (off-chain order book → on-chain settlement)
- [x] Connect to Hyperliquid API for external liquidity/price feeds — HyperliquidRouter + SmartOrderRouter with book walking, simulation mode
- [x] Connect to dYdX, GMX for additional liquidity routing — GmxV2Router + DydxV4Router + multi-venue SOR
- [x] Implement oracle price feeds (Pyth/Chainlink) — PerpPriceOracle.sol with keeper push + staleness/deviation
- [x] Frontend → real contract interaction (openPosition + closePosition wired via usePerps hooks)
**Research:** Study Hyperliquid architecture, dYdX v4 chain, GMX v2, Pyth Network

### 3. GoodPredict — Prediction Markets (PRIORITY: HIGH)
**Status:** Frontend live, MarketFactory + ConditionalTokens deployed
**Next:**
- [x] Backend CLOB matching engine for YES/NO order books
- [x] Connect to Polymarket API for external liquidity/odds
- [x] Backend → on-chain contract interaction (MarketFactory settlement)
- [x] Oracle/resolution system (UMA, Chainlink, manual) — OptimisticResolver.sol with bonded propose/dispute/finalize
- [x] Market creation flow (frontend → contract) — create/page.tsx calls MarketFactory.createMarket
- [x] Frontend → real contract interaction — usePredictTrade wired in [marketId] page (approve + buy YES/NO)
**Research:** Study Polymarket CLOB, Gnosis Conditional Tokens, UMA oracle

### 4. GoodLend — Lending & Borrowing (PRIORITY: HIGH — NEW)
**Status:** Core contracts deployed on devnet, 18 tests passing
**Next:**
- [x] Fork Aave V3 core contracts (Pool, PoolConfigurator, Oracle, etc.)
- [x] Adapt for UBI fee routing (interest spread → UBIFeeSplitter)
- [x] Deploy lending pool with G$, ETH, USDC markets
- [x] Frontend: supply/borrow UI — lend/page.tsx with useGoodLend wagmi hooks, blends on-chain rates
- [x] Interest rate models (variable + stable)
- [x] Flash loan support
- [x] Liquidation bot — backend/liquidator/ with LendLiquidator engine
**Research:** Study Aave V3 codebase, Compound V3, Morpho, Euler

### 5. GoodStable — Decentralized Stablecoin (PRIORITY: MEDIUM — NEW)
**Status:** Core contracts deployed on devnet, 27 tests passing
**Next:**
- [x] Fork MakerDAO/DAI CDP mechanics
- [x] gUSD stablecoin contract (mint by depositing collateral)
- [x] Collateral types: ETH, G$, USDC (with different ratios)
- [x] Stability fee → UBI pool
- [x] Liquidation engine (surplus → UBI)
- [x] Peg stability module (PSM)
- [x] Frontend: vault management UI — stable/page.tsx with VaultPanel per ilk, deposit/withdraw/mint/repay
- [x] Liquidation bot — backend/liquidator/ with StableLiquidator engine
**Research:** Study MakerDAO (DSS), Liquity, RAI, crvUSD, GHO (Aave)

### 6. GoodStocks — Tokenized Equities (PRIORITY: MEDIUM)
**Status:** Frontend live, SyntheticAssetFactory + CollateralVault + PriceOracle deployed
**Next:**
- [x] Real price oracle integration (Chainlink/Pyth for stock prices) — PriceOracle deployed with manual prices + backend/stocks-keeper for live Yahoo Finance feeds
- [x] Create initial synthetic stocks (sAAPL, sTSLA, sGOOG, sNVDA) — 12 stocks deployed via DeployGoodStocks, 4 seeded with positions
- [x] Frontend → real contract interaction — useMintSynthetic/useRedeemSynthetic wired in stocks/[ticker]
- [x] Portfolio tracking — stocks/portfolio page with holdings, trade history, collateral health, P&L
**Research:** Study Synthetix V3, Mirror Protocol (Terra), dHedge

### 7. GoodBridge — Cross-Chain Bridge (PRIORITY: MEDIUM)
**Status:** L1/L2 bridge contracts done, frontend stub
**Next:**
- [x] Working bridge UI (deposit/withdraw G$, ETH, USDC) — native L2 tabs + Li.Fi cross-chain
- [x] Fast withdrawal via liquidity providers — FastWithdrawalLP.sol deployed, 21 tests, useFastWithdrawal hook
- [x] Multi-chain support via Li.Fi SDK — MultiChainBridge.sol router + backend/bridge-keeper + useMultiChainBridge hook
**Research:** Study OP Stack standard bridge, Across Protocol, Stargate

### 8. Chain Infrastructure (PRIORITY: ONGOING)
**Status:** Anvil devnet live, Blockscout indexing
**Next:**
- [x] Contract verification on Blockscout — 15/16 verified (ConditionalTokens factory-created, unverifiable)
- [x] Subgraph / indexer for each protocol — backend/indexer/ with SQLite + REST API (GOO-210)
- [x] RPC load balancing — backend/rpc-balancer with weighted-least-connections, health checks, failover, metrics
- [x] Monitoring & alerting — backend/monitor/ with CLI checks + daemon API (GOO-211)
- [x] OP Stack L1 contracts (L2OutputOracle, OptimismPortal, SystemConfig, L1StandardBridge) — deployed + verified + 25 tests
- [x] Move from Anvil to full OP Stack runtime (op-geth + op-node + op-batcher docker-compose) — init-and-start.sh + healthcheck + .env + 9 migration tests (GOO-214)

## Research Queue (Study Open Source Projects)

### DEX / Swaps
- Uniswap V4 (https://github.com/Uniswap/v4-core) — hooks architecture
- SushiSwap (https://github.com/sushiswap/v3-core) — multi-chain
- 1inch (aggregation protocol)
- Li.Fi SDK (https://github.com/lifinance/sdk) — cross-chain swaps

### Perpetuals
- Hyperliquid (study API, order book, clearing system)
- dYdX v4 (https://github.com/dydxprotocol/v4-chain) — cosmos chain for perps
- GMX v2 (https://github.com/gmx-io/gmx-synthetics) — synthetic perps
- Drift Protocol (Solana perps)

### Prediction Markets
- Polymarket (CLOB API, conditional tokens)
- Gnosis Conditional Tokens (https://github.com/gnosis/conditional-tokens-contracts)
- Augur (https://github.com/AugurProject)
- UMA Optimistic Oracle (https://github.com/UMAprotocol/protocol)

### Lending
- Aave V3 (https://github.com/aave/aave-v3-core) — MOST IMPORTANT
- Compound V3 (https://github.com/compound-finance/comet)
- Morpho (https://github.com/morpho-org/morpho-blue) — peer-to-peer lending
- Euler V2 (modular lending)

### Stablecoins
- MakerDAO DSS (https://github.com/makerdao/dss) — DAI mechanics
- Liquity (https://github.com/liquity/dev) — no-governance stablecoin
- crvUSD (https://github.com/curvefi/curve-stablecoin) — LLAMMA
- GHO (Aave's stablecoin)
- RAI (https://github.com/reflexer-labs/geb) — non-pegged stable

### Tokenized Assets
- Synthetix V3 (https://github.com/Synthetixio/synthetix-v3)
- dHedge (https://github.com/dhedge)

### 9. Governance (PRIORITY: HIGH — NEW)
**Status:** Contracts deployed, frontend live
**Next:**
- [x] VoteEscrowedGD (veG$) — Curve-style vote-escrowed locking
- [x] GoodDAO — propose/vote/queue/execute governance
- [x] Deploy script + 29 tests passing
- [x] Frontend: /governance page with lock/unlock/delegate/proposals UI (GOO-219)
- [x] Governance analytics (voting activity, proposal history charts) — /governance/analytics page with 7 viz components + 16 tests (GOO-221)
- [x] Timelock contract (separate from DAO for multi-sig execution) — GoodTimelock.sol: role-based proposers/executors, batch ops, predecessor chains, 1-day delay, 14-day grace, verified on Blockscout (GOO-220)

### 10. Agent SDK (PRIORITY: HIGH — NEW)
**Status:** v0.1.0 published, 25 tests passing
**Next:**
- [x] Core SDK package (@gooddollar/agent-sdk) with viem client
- [x] Protocol modules: perps, predict, lend, stocks, swap, ubi
- [x] Contract addresses + ABIs exported
- [x] Unit tests (25 passing)
- [x] Integration tests against live devnet — 28 tests across all 6 modules (chain, tokens, perps, predict, lend, stocks, swap, UBI, writes)
- [x] Publish to npm — build fixed for viem v2, dist clean, prepublishOnly + .npmignore + metadata ready (GOO-225)
- [x] Agent examples (trading bot, arbitrage) — examples/trading-bot.ts + examples/arbitrage-agent.ts
- [x] Multi-agent orchestration helpers — AgentSwarm, SignalBus, PortfolioAggregator, Strategies + 26 tests (GOO-224)

### 11. UBI Impact Dashboard (PRIORITY: HIGH — NEW)
**Status:** Contract deployed + verified, SDK module added, 21 tests passing
**Next:**
- [x] UBIRevenueTracker contract — per-protocol fee accounting, daily snapshots, dashboard aggregator
- [x] Deploy with 7 protocols registered + seeded stats (GOO-226)
- [x] Verify on Blockscout
- [x] SDK: UBIRevenueTrackerABI + address exported
- [x] Frontend: /ubi-impact page — per-protocol fee breakdown, UBI flow visualization, historical charts
- [x] Backend: revenue-tracker keeper — periodic on-chain fee reporting from each protocol
- [x] SDK: `sdk.ubi.getDashboard()` + `sdk.ubi.getProtocolBreakdown()` convenience methods

### 12. GoodYield — Auto-Compounding Vaults (PRIORITY: HIGH — NEW)
**Status:** Core contracts deployed on devnet, VaultFactory verified, 27 tests passing
**Next:**
- [x] ERC-4626 GoodVault with pluggable strategies + UBI performance fees
- [x] LendingStrategy (deposits into GoodLend for supply yield)
- [x] StablecoinStrategy (deposits into StabilityPool for liquidation gains)
- [x] VaultFactory with strategy whitelist + TVL tracking
- [x] 27 comprehensive tests (deposit, withdraw, harvest, fees, migration, emergency, factory)
- [x] Deploy VaultFactory on devnet + verify on Blockscout
- [x] Frontend: /yield page with vault browser, deposit/withdraw, APY display
- [x] SDK: yield module with vault discovery + deposit/withdraw helpers
- [x] Harvest keeper (auto-compound on schedule) — backend/harvest-keeper with discovery, decision engine, execution + 18 tests (GOO-242)
- [x] Deploy initial vaults: ETH-Lending, gUSD-Stability, G$-Lending — DeployInitialVaults.s.sol + 22 Solidity tests (GOO-242)
**Research:** Study Yearn V3 (https://github.com/yearn/yearn-vaults-v3), ERC-4626 standard

### 13. Agent Registry & Leaderboard (PRIORITY: HIGH — NEW)
**Status:** Contract deployed + verified, 23 tests passing, frontend live, SDK updated
**Next:**
- [x] AgentRegistry contract — register agents, record activity, leaderboard queries
- [x] Deploy with 5 demo agents + seeded trading activity (GOO-243)
- [x] Verify on Blockscout
- [x] 23 Solidity tests (registration, activity, leaderboard, admin, P&L)
- [x] Frontend: /agents page — leaderboard with rank badges, dashboard stats, SDK CTA
- [x] SDK: AgentRegistryABI + address exported
- [x] Navigation: Header desktop + mobile menu links
- [x] Agent detail page (/agents/[address]) with per-protocol breakdown
- [x] Integration with protocol contracts (auto-report activity from swaps/perps/etc.) — activity-reporter keeper: polls 5 protocols, 28 tests (GOO-245)
- [ ] Agent registration frontend (connect wallet → register your bot)

## Principles
1. **Fork the best, adapt for UBI** — Don't reinvent. Clone proven codebases, add UBI fee routing.
2. **External liquidity first** — Connect to existing protocols before building our own liquidity.
3. **AI agents are the primary users** — Optimize for programmatic access, not just human UIs.
4. **Every fee funds UBI** — Non-negotiable. 33% of every protocol fee → UBI pool.
5. **Ship working demos, then harden** — Get things visible fast, then make them production-grade.


### ~~CRITICAL: Remove All Mock Data~~ ✅ DONE
**Status:** All 500 lines of mock data replaced with on-chain hooks (GOO-135)
**Completed:** 2026-04-03
**New hooks:**
- useOnChainPerps.ts — PerpEngine + MarginVault reads
- useOnChainStocks.ts — SyntheticAssetFactory + PriceOracle + CollateralVault reads
- useOnChainMarketData.ts — CoinGecko live prices via usePriceFeeds
**Files cleaned:** stockData.ts, perpsData.ts, marketData.ts, predictData.ts (types + formatters only)

### ~~Prediction Markets Mock → On-Chain~~ ✅ DONE (GOO-215)
**Status:** All mock prediction data replaced with on-chain hooks
**Completed:** 2026-04-03
**What was done:**
- Deployed 10 prediction markets with seeded YES/NO liquidity via SeedPredictMarkets.s.sol
- Built useOnChainPredict.ts hook (reads MarketFactory + ConditionalTokens)
- Stripped MOCK_MARKETS/MOCK_POSITIONS/MOCK_RESOLVED from predictData.ts
- Updated all predict pages + portfolio to use on-chain data
- predictData.ts is now types + utilities only (no mock data)
