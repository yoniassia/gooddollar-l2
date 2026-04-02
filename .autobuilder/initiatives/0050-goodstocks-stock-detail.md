---
id: goodstocks-stock-detail
title: "GoodStocks Stock Detail Page"
parent: 0046-goodstocks-tokenized-equities
deps: [goodstocks-market-overview]
split: false
depth: 1
planned: true
executed: false
---

# GoodStocks Stock Detail Page

## Overview
Build the `/stocks/[ticker]` page — an individual stock detail view with a price chart (TradingView Lightweight Charts), market/limit order form (mock), stock info panel, and position summary. This is the core trading experience for a single stock.

## Research Notes
- TradingView Lightweight Charts (`lightweight-charts` npm) for the price chart — free, open-source, MIT
- Order form: market buy/sell with quantity input, limit orders with price + quantity
- Mock execution — orders display a success toast but don't actually transact
- Stock info: company name, sector, market cap, 24h volume, 52-week high/low
- UBI fee display: show "0.1% fee → 33% funds UBI" badge
- Back navigation to /stocks

## Architecture

```mermaid
graph TD
    A[/stocks/ticker page] --> B[PriceChart - TradingView LC]
    A --> C[OrderForm - market/limit]
    A --> D[StockInfoPanel]
    A --> E[PositionSummary - mock]
    F[lib/stockData.ts] --> A
    G[lib/chartData.ts - mock OHLC] --> B
    C --> H[UBI Fee Badge]
```

## Size Estimation
- **New pages/routes:** 1 (/stocks/[ticker])
- **New UI components:** 5 (PriceChart, OrderForm, StockInfoPanel, PositionSummary, TimeframeSelector)
- **API integrations:** 1 (TradingView Lightweight Charts library)
- **Complex interactions:** 1 (interactive price chart with timeframe switching)
- **Estimated LOC:** ~800

## One-Week Decision: YES
1 complex page, 5 components, 1 complex interaction (chart), ~800 LOC. Fits within one-week for a complex page.

## Implementation Plan
- **Day 1:** Install `lightweight-charts`, create mock OHLC data generator (`lib/chartData.ts`), build PriceChart component
- **Day 2:** Build `/stocks/[ticker]/page.tsx` layout, StockInfoPanel, TimeframeSelector
- **Day 3:** Build OrderForm (market/limit tabs, buy/sell toggle), UBI fee badge integration
- **Day 4:** PositionSummary component, responsive layout, 404 for invalid tickers
- **Day 5:** Tests, polish, edge cases

## Acceptance Criteria
- [ ] `/stocks/[ticker]` renders for valid tickers (e.g. /stocks/AAPL), 404 for invalid
- [ ] Price chart shows mock OHLC candlestick data using TradingView Lightweight Charts
- [ ] Timeframe selector (1D, 1W, 1M, 3M, 1Y) switches chart data
- [ ] Order form with Market/Limit tabs and Buy/Sell toggle
- [ ] Order form shows estimated cost, shares, and UBI fee (0.1% → 33% to UBI)
- [ ] Stock info panel shows: name, sector, price, 24h change, volume, market cap
- [ ] Mock position summary section (shows placeholder when no position)
- [ ] Responsive layout: chart above, info + order form below on mobile
- [ ] Back link to /stocks
