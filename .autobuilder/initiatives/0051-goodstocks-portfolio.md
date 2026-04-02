---
id: goodstocks-portfolio
title: "GoodStocks Portfolio Page"
parent: 0046-goodstocks-tokenized-equities
deps: [goodstocks-stock-detail]
split: false
depth: 1
planned: true
executed: true
---

# GoodStocks Portfolio Page

## Overview
Build the `/stocks/portfolio` page showing a user's synthetic stock holdings, P&L breakdown, collateral health indicator, and trade history. Uses mock portfolio data.

## Research Notes
- Portfolio displays mock holdings with quantity, avg cost, current value, unrealized P&L
- Collateral health indicator: green (>150%), yellow (120-150%), red (<120%)
- Total portfolio value, total P&L (absolute + percentage)
- Trade history table: recent trades with ticker, side, quantity, price, time, P&L
- Tab navigation: Holdings | History

## Architecture

```mermaid
graph TD
    A[/stocks/portfolio page] --> B[PortfolioSummary - total value + P&L]
    A --> C[CollateralHealth indicator]
    A --> D[Tab Navigation]
    D --> E[HoldingsTable]
    D --> F[TradeHistoryTable]
    G[lib/stockData.ts - mock portfolio] --> A
```

## Size Estimation
- **New pages/routes:** 1 (/stocks/portfolio)
- **New UI components:** 4 (PortfolioSummary, CollateralHealth, HoldingsTable, TradeHistoryTable)
- **API integrations:** 0 (mock data)
- **Complex interactions:** 0
- **Estimated LOC:** ~500

## One-Week Decision: YES
1 page, 4 components, 0 complex interactions, ~500 LOC. Straightforward data display page.

## Implementation Plan
- **Day 1:** Create mock portfolio data in `lib/stockData.ts`, build PortfolioSummary + CollateralHealth components
- **Day 2:** Build `/stocks/portfolio/page.tsx` with tab navigation, HoldingsTable, TradeHistoryTable
- **Day 3:** Responsive polish, empty states, tests

## Acceptance Criteria
- [ ] `/stocks/portfolio` renders with mock holdings data
- [ ] Portfolio summary card shows: total value, total P&L ($ and %), daily change
- [ ] Collateral health indicator with color coding: green >150%, yellow 120-150%, red <120%
- [ ] Holdings tab: table with ticker, shares, avg cost, current price, value, unrealized P&L
- [ ] History tab: table with recent trades (ticker, buy/sell, qty, price, time, P&L)
- [ ] Clicking a holding row navigates to `/stocks/[ticker]`
- [ ] Empty state when no holdings: "No positions yet" with CTA to browse stocks
- [ ] Responsive layout
