---
title: "GoodPerps — Perpetual Futures DEX"
parent: gooddollar-l2
planned: true
executed: false
split: true
priority: high
depends_on: []
---

# GoodPerps — Perpetual Futures DEX

## Goal
Build a Hyperliquid-style perpetual futures exchange on the GoodDollar L2 with up to 50x leverage, on-chain order book, and UBI fee routing on every trade.

## Research Notes
- Hyperliquid UI: professional multi-panel trading terminal, dark theme, order book heatmap
- TradingView Advanced Charts for the charting component
- Order book: bid/ask depth visualization with color-coded bars
- For v1 frontend: mock data layer simulating real-time order book and trades
- Leverage selector, margin mode toggle (cross/isolated), position management
- Existing design system: dark theme, goodgreen accent, consistent with GoodSwap

## Architecture

```mermaid
graph TD
    A[/perps - Trading Terminal] --> B[TradingView Chart]
    A --> C[Order Entry Form]
    A --> D[Account Summary]
    A --> E[Pair Selector]
    F[Order Book Component] --> G[Bid/Ask Depth Viz]
    H[Recent Trades Feed] --> A
    I[/perps/portfolio] --> J[Open Positions]
    I --> K[Order History]
    I --> L[Trade History + P&L]
    M[/perps/leaderboard] --> N[Top Traders Table]
    O[Header Nav] --> A
    P[Mock Trading Data] --> A
    P --> F
    P --> H
    P --> I
```

## Size Estimation
- **New pages/routes:** 4 (/perps, /perps/[pair], /perps/portfolio, /perps/leaderboard)
- **New UI components:** 10+ (TradingTerminal, OrderBook, OrderEntry, PairSelector, LeverageSlider, PositionPanel, RecentTrades, AccountSummary, LeaderboardTable, MarginModeToggle)
- **API integrations:** 2 (TradingView widget, mock trading data)
- **Complex interactions:** 4 (TradingView chart, real-time order book, leverage/margin calc, position management)
- **Estimated LOC:** ~3500-5000

## One-Week Decision: NO
4 pages, 10+ components, 4 complex interactions, 3500+ LOC. Massively exceeds all thresholds. Must split.

## Split Rationale
Split into 3 vertical slices of increasing depth:
1. **Trading Terminal** — core /perps page with chart, basic market order entry, pair selector, nav integration (~1000 LOC)
2. **Order Book + Advanced Trading** — order book depth viz, limit/stop orders, recent trades, position panel (~800 LOC)
3. **Portfolio + Leaderboard** — portfolio page and leaderboard page (~700 LOC)

## Children
- 0055-goodperps-trading-terminal
- 0056-goodperps-advanced-trading
- 0057-goodperps-portfolio-leaderboard
