---
id: goodstocks-market-overview
title: "GoodStocks Market Overview Page"
parent: 0046-goodstocks-tokenized-equities
deps: []
split: false
depth: 1
planned: true
executed: true
---

# GoodStocks Market Overview Page

## Overview
Build the `/stocks` page — a market overview listing all available tokenized stocks with price, 24h change, volume, and market cap. Includes search/filter, sortable columns, and navigation integration into the Header. Uses mock data (same pattern as Explore page).

## Research Notes
- Follow the Explore page pattern (`/explore/page.tsx`) for the data table with sort/search
- Reuse `TokenIcon` component pattern for stock logos (use ticker initials as fallback)
- Mock data: AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL, META, JPM, V, DIS — realistic prices
- Add "Stocks" link to Header nav (desktop + mobile)
- Dark theme, `goodgreen` accent, alternating row shading

## Architecture

```mermaid
graph TD
    A[Header - add Stocks nav link] --> B[/stocks page]
    B --> C[StockTable]
    C --> D[StockRow - memoized]
    B --> E[Search Input]
    B --> F[Sort Controls]
    G[lib/stockData.ts - mock data] --> C
```

## Size Estimation
- **New pages/routes:** 1 (/stocks)
- **New UI components:** 3 (StockTable header, StockRow, StockIcon)
- **API integrations:** 0 (mock data only)
- **Complex interactions:** 0
- **Estimated LOC:** ~400

## One-Week Decision: YES
1 page, 3 components, 0 complex interactions, ~400 LOC. Well within limits. Follows established Explore page pattern closely.

## Implementation Plan
- **Day 1:** Create mock stock data layer (`lib/stockData.ts`), create `/stocks/page.tsx` with table, search, sort
- **Day 2:** Add `StockIcon` component, add Stocks to Header nav, responsive polish, tests

## Acceptance Criteria
- [ ] `/stocks` page renders a table of 10+ tokenized stocks with: ticker, name, price, 24h change, volume, market cap
- [ ] Table columns are sortable (price, change, volume, market cap)
- [ ] Search box filters stocks by ticker or name
- [ ] "Stocks" appears in the Header navigation (desktop and mobile)
- [ ] Clicking a stock row navigates to `/stocks/[ticker]`
- [ ] Responsive: works on mobile with horizontal scroll for extra columns
- [ ] Visual style matches Explore page (dark theme, alternating rows, goodgreen accent)
- [ ] Empty state shown when search matches nothing
