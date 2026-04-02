---
title: "GoodPerps — Perpetual Futures DEX"
parent: gooddollar-l2
planned: false
executed: false
priority: high
depends_on: []
---

# GoodPerps — Perpetual Futures DEX

## Goal
Build a Hyperliquid-style perpetual futures exchange on the GoodDollar L2 with up to 50x leverage, on-chain order book, and UBI fee routing on every trade.

## Requirements

### Smart Contracts (Solidity/Foundry)
- **PerpEngine** — Core matching engine: manages positions, margin, P&L settlement
- **OrderBook** — On-chain CLOB for limit/market/stop orders per trading pair
- **MarginVault** — Holds user margin (USDC/G$), tracks cross-margin and isolated-margin modes
- **FundingRate** — Calculates and applies funding rate every 8 hours (long/short balance)
- **Liquidator** — Liquidates positions below maintenance margin, insurance fund absorbs, excess → UBI pool
- **InsuranceFund** — Socialized loss protection, funded by liquidation fees
- **PriceOracle** — Chainlink price feeds for mark price (prevents manipulation)
- **UBIFeeHook** — 0.05% taker / 0.02% maker, 33% of all fees → UBI pool

### Frontend Pages
- **/perps** — Trading terminal: TradingView advanced chart, order book (bid/ask depth), recent trades, position panel, order entry (market/limit/stop-limit), account summary (equity, margin, P&L)
- **/perps/[pair]** — Per-pair trading view (e.g. /perps/BTC-USD, /perps/ETH-USD, /perps/G$-USD)
- **/perps/portfolio** — All open positions, pending orders, trade history, funding payments, realized P&L
- **/perps/leaderboard** — Top traders by P&L

### Supported Pairs (v1)
- BTC-USD, ETH-USD, G$-USD, SOL-USD, LINK-USD
- More pairs added by governance

### Key Features
- Up to 50x leverage (configurable per pair)
- Cross-margin and isolated-margin modes
- Real-time order book with depth visualization
- Funding rate display (countdown to next payment)
- Position management: TP/SL, trailing stop, reduce-only
- Liquidation price calculator
- Mark price vs last price display
- PnL in real-time (unrealized + realized)

### Design
- Professional trading terminal (dark theme, multi-panel layout)
- TradingView Pro chart integration
- Order book heatmap
- Mobile: simplified single-panel view with swipe between chart/orders/positions
- Consistent with GoodSwap design system

## Success Criteria
- Users can open/close long and short positions with leverage
- Order book matches limit orders correctly
- Funding rate settles every 8 hours
- Liquidations trigger correctly at maintenance margin
- UBI fees route to pool on every trade
- All contract tests pass
- Responsive trading terminal
