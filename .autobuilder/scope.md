# GoodDollar L2 — Autobuilder Scope

## Vision
One chain where AI agents do everything in finance — and every transaction funds UBI for humans. See docs/VISION.md for the full picture.

## Active Workstreams

### 1. GoodSwap — DEX & Cross-Chain Swaps (PRIORITY: HIGH)
**Status:** Frontend live, Uniswap V4 hook deployed, no real swaps yet
**Next:**
- [ ] Deploy Uniswap V4 pool factory + router on devnet
- [ ] Create initial liquidity pools (G$/ETH, G$/USDC, ETH/USDC)
- [ ] Connect frontend to real on-chain swap execution
- [ ] Li.Fi / bridge aggregator integration for cross-chain swaps
- [ ] Price feed integration (CoinGecko API → on-chain oracles)
**Research:** Study Uniswap V4 hooks, Li.Fi SDK, 1inch aggregator

### 2. GoodPerps — Perpetual Futures (PRIORITY: HIGH)
**Status:** Frontend live, PerpEngine + MarginVault + FundingRate deployed
**Next:**
- [x] Backend order matching service (off-chain order book → on-chain settlement)
- [ ] Connect to Hyperliquid API for external liquidity/price feeds
- [ ] Connect to dYdX, GMX for additional liquidity routing
- [x] Implement oracle price feeds (Pyth/Chainlink) — PerpPriceOracle.sol with keeper push + staleness/deviation
- [ ] Frontend → real contract interaction
**Research:** Study Hyperliquid architecture, dYdX v4 chain, GMX v2, Pyth Network

### 3. GoodPredict — Prediction Markets (PRIORITY: HIGH)
**Status:** Frontend live, MarketFactory + ConditionalTokens deployed
**Next:**
- [x] Backend CLOB matching engine for YES/NO order books
- [x] Connect to Polymarket API for external liquidity/odds
- [x] Backend → on-chain contract interaction (MarketFactory settlement)
- [x] Oracle/resolution system (UMA, Chainlink, manual) — OptimisticResolver.sol with bonded propose/dispute/finalize
- [ ] Market creation flow (frontend → contract)
- [ ] Frontend → real contract interaction
**Research:** Study Polymarket CLOB, Gnosis Conditional Tokens, UMA oracle

### 4. GoodLend — Lending & Borrowing (PRIORITY: HIGH — NEW)
**Status:** Core contracts deployed on devnet, 18 tests passing
**Next:**
- [x] Fork Aave V3 core contracts (Pool, PoolConfigurator, Oracle, etc.)
- [x] Adapt for UBI fee routing (interest spread → UBIFeeSplitter)
- [x] Deploy lending pool with G$, ETH, USDC markets
- [ ] Frontend: supply/borrow UI
- [x] Interest rate models (variable + stable)
- [x] Flash loan support
- [ ] Liquidation bot
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
- [ ] Frontend: vault management UI
- [ ] Liquidation bot
**Research:** Study MakerDAO (DSS), Liquity, RAI, crvUSD, GHO (Aave)

### 6. GoodStocks — Tokenized Equities (PRIORITY: MEDIUM)
**Status:** Frontend live, SyntheticAssetFactory + CollateralVault + PriceOracle deployed
**Next:**
- [ ] Real price oracle integration (Chainlink/Pyth for stock prices)
- [ ] Create initial synthetic stocks (sAAPL, sTSLA, sGOOG, sNVDA)
- [ ] Frontend → real contract interaction
- [ ] Portfolio tracking
**Research:** Study Synthetix V3, Mirror Protocol (Terra), dHedge

### 7. GoodBridge — Cross-Chain Bridge (PRIORITY: MEDIUM)
**Status:** L1/L2 bridge contracts done, frontend stub
**Next:**
- [ ] Working bridge UI (deposit/withdraw G$, ETH, USDC)
- [ ] Fast withdrawal via liquidity providers
- [ ] Multi-chain support via Li.Fi SDK
**Research:** Study OP Stack standard bridge, Across Protocol, Stargate

### 8. Chain Infrastructure (PRIORITY: ONGOING)
**Status:** Anvil devnet live, Blockscout indexing
**Next:**
- [ ] Contract verification on Blockscout (all 12 contracts)
- [ ] Subgraph / indexer for each protocol
- [ ] RPC load balancing
- [ ] Monitoring & alerting
- [ ] Move from Anvil to full OP Stack (op-geth + op-node + op-batcher)

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

## Principles
1. **Fork the best, adapt for UBI** — Don't reinvent. Clone proven codebases, add UBI fee routing.
2. **External liquidity first** — Connect to existing protocols before building our own liquidity.
3. **AI agents are the primary users** — Optimize for programmatic access, not just human UIs.
4. **Every fee funds UBI** — Non-negotiable. 33% of every protocol fee → UBI pool.
5. **Ship working demos, then harden** — Get things visible fast, then make them production-grade.
