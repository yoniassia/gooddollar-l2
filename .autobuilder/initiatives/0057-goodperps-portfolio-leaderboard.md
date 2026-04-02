---
id: goodperps-portfolio-leaderboard
title: "GoodPerps Portfolio & Leaderboard Pages"
parent: 0048-goodperps-perpetuals-dex
deps: [goodperps-advanced-trading]
split: false
depth: 1
planned: true
executed: false
---

# GoodPerps Portfolio & Leaderboard Pages

## Overview
Build two pages: `/perps/portfolio` showing all open positions, order history, trade history, funding payments, and realized P&L; and `/perps/leaderboard` showing top traders ranked by P&L.

## Research Notes
- Portfolio tabs: Positions | Open Orders | Trade History | Funding Payments
- P&L summary: total realized, total unrealized, net funding paid/received
- Leaderboard: ranked table with trader address (truncated), total P&L, win rate, total trades, top pair
- Time filter: 24h, 7d, 30d, All Time
- Mock data for both pages

## Architecture

```mermaid
graph TD
    A[/perps/portfolio page] --> B[PnLSummary]
    A --> C[Tab Navigation]
    C --> D[PositionsTab]
    C --> E[OpenOrdersTab]
    C --> F[TradeHistoryTab]
    C --> G[FundingPaymentsTab]
    H[/perps/leaderboard page] --> I[LeaderboardTable]
    H --> J[TimeFilter]
    K[lib/perpsData.ts - mock data] --> A
    K --> H
```

## Size Estimation
- **New pages/routes:** 2 (/perps/portfolio, /perps/leaderboard)
- **New UI components:** 5 (PnLSummary, LeaderboardTable, OpenOrdersTab, FundingPaymentsTab, TimeFilter)
- **API integrations:** 0 (mock data)
- **Complex interactions:** 0
- **Estimated LOC:** ~700

## One-Week Decision: YES
2 moderate pages, 5 components, 0 complex interactions, ~700 LOC. Both are data display pages with tabs and tables.

## Implementation Plan
- **Day 1:** Create mock portfolio + leaderboard data in `lib/perpsData.ts`
- **Day 2:** Build `/perps/portfolio/page.tsx` with PnLSummary, tab navigation, PositionsTab
- **Day 3:** OpenOrdersTab, TradeHistoryTab, FundingPaymentsTab
- **Day 4:** Build `/perps/leaderboard/page.tsx` with LeaderboardTable, TimeFilter
- **Day 5:** Responsive polish, empty states, tests

## Acceptance Criteria
- [ ] `/perps/portfolio` renders with mock portfolio data
- [ ] P&L summary: total realized P&L, total unrealized P&L, net funding
- [ ] Positions tab: open positions with pair, side, size, leverage, entry, mark, P&L, liq. price
- [ ] Open Orders tab: pending limit/stop orders with pair, type, side, price, size, cancel button
- [ ] Trade History tab: executed trades with pair, side, type, size, price, fee, P&L, timestamp
- [ ] Funding tab: funding payments with pair, amount, rate, timestamp
- [ ] `/perps/leaderboard` renders ranked traders table
- [ ] Leaderboard columns: rank, trader address (truncated), P&L, win rate, trades, top pair
- [ ] Time filter: 24h, 7d, 30d, All Time
- [ ] Empty states for all tabs and leaderboard
- [ ] Responsive layout for both pages
