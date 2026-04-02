---
title: "GoodPredict — Prediction Markets"
parent: gooddollar-l2
planned: false
executed: false
priority: high
depends_on: []
---

# GoodPredict — Prediction Markets

## Goal
Build a Polymarket-style prediction market on the GoodDollar L2 where users bet on real-world events using G$/USDC, with UBI fee routing on every trade.

## Requirements

### Smart Contracts (Solidity/Foundry)
- **MarketFactory** — Creates binary outcome markets (YES/NO tokens as ERC-20)
- **ConditionalTokens** — CTF-style conditional token framework for outcome tokens
- **CLOB (Central Limit Order Book)** — On-chain order book for trading outcome tokens (or AMM-based if simpler)
- **MarketResolver** — Oracle-based resolution (UMA optimistic oracle or admin multisig for v1)
- **UBIFeeHook** — 1% on winnings, 33% → UBI pool
- **LiquidityPool** — LP incentives for market makers

### Frontend Pages
- **/predict** — Market browser: trending markets, categories (crypto, politics, sports, tech, culture), search/filter
- **/predict/[marketId]** — Market detail: outcome prices as probabilities (e.g. YES 67¢), price chart over time, order book depth, trade panel (buy YES/NO), comments/discussion, resolution source
- **/predict/create** — Create new market: question, resolution criteria, end date, initial liquidity
- **/predict/portfolio** — User's positions, P&L, pending resolutions, claimable winnings

### Key Features
- Markets displayed as probability percentages (like Polymarket)
- Real-time price updates
- Category filtering (crypto, politics, sports, AI, world events)
- Market creation with initial liquidity deposit
- Resolution with proof/source link
- Leaderboard (top predictors)
- Share market to social

### Design
- Clean, Polymarket-inspired UI
- Cards for markets with probability bars
- Green/red for YES/NO pricing
- Charts showing probability over time
- Mobile-first responsive

## Success Criteria
- Users can create, trade, and resolve prediction markets
- Probability display updates in real-time
- UBI fees correctly route on settlements
- At least 10 sample markets seeded
- All contract tests pass
