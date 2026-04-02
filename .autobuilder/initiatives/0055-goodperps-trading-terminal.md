---
id: goodperps-trading-terminal
title: "GoodPerps Trading Terminal Page"
parent: 0048-goodperps-perpetuals-dex
deps: []
split: false
depth: 1
planned: true
executed: true
---

# GoodPerps Trading Terminal Page

## Overview
Build the `/perps` page — the core perpetual futures trading terminal with a TradingView chart, pair selector (BTC-USD, ETH-USD, etc.), basic market order entry form with leverage selector, and account summary panel. Includes Header nav integration. This is the MVP trading experience.

## Research Notes
- Hyperliquid-style multi-panel layout: chart takes ~60% of screen, side panels for order entry + account
- TradingView Lightweight Charts for candlestick chart with volume overlay
- Pair selector dropdown: BTC-USD, ETH-USD, G$-USD, SOL-USD, LINK-USD
- Market order form: Long/Short toggle, size input, leverage slider (1x-50x), margin required display
- Account summary: balance, equity, unrealized P&L, margin used, available margin
- UBI fee display: "0.05% taker fee → 33% funds UBI"

## Architecture

```mermaid
graph TD
    A[Header - add Perps nav link] --> B[/perps page]
    B --> C[PairSelector]
    B --> D[TradingView Chart]
    B --> E[MarketOrderForm]
    B --> F[AccountSummary]
    E --> G[LeverageSlider]
    E --> H[Long/Short Toggle]
    I[lib/perpsData.ts - mock data] --> B
    J[lib/chartData.ts - mock OHLC] --> D
```

## Size Estimation
- **New pages/routes:** 1 (/perps) — with dynamic pair via query param or sub-route
- **New UI components:** 6 (PairSelector, MarketOrderForm, LeverageSlider, LongShortToggle, AccountSummary, PairInfoBar)
- **API integrations:** 1 (TradingView Lightweight Charts)
- **Complex interactions:** 1 (interactive candlestick chart)
- **Estimated LOC:** ~900

## One-Week Decision: YES
1 complex page, 6 components, 1 complex interaction, ~900 LOC. This is the maximum for a single complex page but achievable since the chart component is already patterned from GoodStocks.

## Implementation Plan
- **Day 1:** Create mock perps data layer (`lib/perpsData.ts` — pairs, prices, account), pair selector
- **Day 2:** Build `/perps/page.tsx` multi-panel layout, integrate TradingView chart (reuse pattern from stocks)
- **Day 3:** MarketOrderForm with LeverageSlider (1x-50x), Long/Short toggle, margin calculation
- **Day 4:** AccountSummary panel, PairInfoBar (mark price, 24h change, funding rate), Header nav
- **Day 5:** Responsive layout (stacked on mobile), tests, polish

## Acceptance Criteria
- [ ] `/perps` page renders a multi-panel trading terminal layout
- [ ] Pair selector with 5 pairs: BTC-USD, ETH-USD, G$-USD, SOL-USD, LINK-USD
- [ ] TradingView candlestick chart with volume overlay, timeframe selector
- [ ] Market order form: Long (green) / Short (red) toggle
- [ ] Leverage slider from 1x to 50x with visual indicator
- [ ] Order form shows: size, margin required, estimated liquidation price, fees
- [ ] UBI fee badge: "0.05% taker → 33% funds UBI"
- [ ] Account summary: balance, equity, margin used, available margin
- [ ] Pair info bar: mark price, 24h change %, 24h volume, funding rate countdown
- [ ] "Perps" appears in Header navigation (desktop + mobile)
- [ ] Responsive: stacked layout on mobile (chart → order → account)
