---
id: goodperps-advanced-trading
title: "GoodPerps Order Book & Advanced Trading"
parent: 0048-goodperps-perpetuals-dex
deps: [goodperps-trading-terminal]
split: false
depth: 1
planned: true
executed: true
---

# GoodPerps Order Book & Advanced Trading

## Overview
Add the order book depth visualization, recent trades feed, limit/stop-limit order types, and open positions panel to the perps trading terminal. These components enhance the basic terminal into a full trading experience.

## Research Notes
- Order book: bid (green) and ask (red) rows with price, size, cumulative size, depth bar visualization
- Recent trades: scrolling list of recent executions (price, size, side, time)
- Limit orders: price + size input, post-only option
- Stop-limit: trigger price + limit price + size
- Open positions panel: entry price, mark price, size, leverage, unrealized P&L, liquidation price, close button
- Margin mode toggle: cross vs isolated

## Architecture

```mermaid
graph TD
    A[/perps page - enhanced] --> B[OrderBook component]
    B --> C[Bid/Ask depth bars]
    A --> D[RecentTrades feed]
    A --> E[Enhanced OrderForm - limit/stop tabs]
    A --> F[OpenPositions panel]
    A --> G[MarginModeToggle]
    H[lib/perpsData.ts - order book mock] --> B
    H --> D
    H --> F
```

## Size Estimation
- **New pages/routes:** 0 (enhances existing /perps page)
- **New UI components:** 5 (OrderBook, RecentTrades, OpenPositions, MarginModeToggle, OrderTypeTabs)
- **API integrations:** 0 (mock data)
- **Complex interactions:** 1 (order book depth visualization with size bars)
- **Estimated LOC:** ~800

## One-Week Decision: YES
0 new pages, 5 components, 1 complex interaction, ~800 LOC. Component additions to existing page.

## Implementation Plan
- **Day 1:** Build OrderBook component with bid/ask rows, depth bars, spread indicator
- **Day 2:** RecentTrades feed (scrolling list), add to terminal layout
- **Day 3:** Add limit + stop-limit order types to OrderForm (tab navigation)
- **Day 4:** OpenPositions panel with P&L, liquidation price, close button; MarginModeToggle
- **Day 5:** Responsive adjustments, tests, polish

## Acceptance Criteria
- [ ] Order book shows bids (green) and asks (red) with price, size, and depth bar visualization
- [ ] Spread displayed between bids and asks
- [ ] Recent trades feed: scrolling list of recent trades with price, size, side (color-coded), timestamp
- [ ] Order form tabs: Market | Limit | Stop-Limit
- [ ] Limit order form: price input, size input, post-only toggle
- [ ] Stop-limit form: trigger price, limit price, size
- [ ] Open positions panel: list of positions with entry, mark price, size, leverage, P&L, liq. price
- [ ] Close position button (mock — shows confirmation)
- [ ] Margin mode toggle: Cross / Isolated
- [ ] All new components integrate into the existing /perps terminal layout
- [ ] Responsive on mobile
