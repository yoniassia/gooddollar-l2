---
id: goodpredict-create-portfolio
title: "GoodPredict Create Market & Portfolio Pages"
parent: 0047-goodpredict-prediction-markets
deps: [goodpredict-market-detail]
split: false
depth: 1
planned: true
executed: false
---

# GoodPredict Create Market & Portfolio Pages

## Overview
Build two pages: `/predict/create` for creating new prediction markets (question, resolution criteria, end date, category, initial liquidity) and `/predict/portfolio` for viewing user positions, P&L, pending resolutions, and claimable winnings.

## Research Notes
- Create market form: multi-step or single form with validation
- Portfolio shows mock positions: market question, side (YES/NO), shares, avg price, current price, P&L
- Pending resolutions: markets that ended but haven't resolved yet
- Claimable winnings: resolved markets where user won
- Tab navigation: Positions | Pending | History

## Architecture

```mermaid
graph TD
    A[/predict/create page] --> B[CreateMarketForm]
    B --> C[Question Input]
    B --> D[Resolution Criteria]
    B --> E[End Date Picker]
    B --> F[Category Selector]
    B --> G[Initial Liquidity Input]
    H[/predict/portfolio page] --> I[PortfolioSummary]
    H --> J[Tab Navigation]
    J --> K[PositionsTable]
    J --> L[PendingResolutions]
    J --> M[HistoryTable]
```

## Size Estimation
- **New pages/routes:** 2 (/predict/create, /predict/portfolio)
- **New UI components:** 5 (CreateMarketForm, PositionsTable, PendingResolutions, HistoryTable, PortfolioSummary)
- **API integrations:** 0 (mock data)
- **Complex interactions:** 0
- **Estimated LOC:** ~700

## One-Week Decision: YES
2 moderate pages, 5 components, 0 complex interactions, ~700 LOC. Both pages are form/table-based without complex interactions.

## Implementation Plan
- **Day 1:** Build CreateMarketForm component with validation, `/predict/create/page.tsx`
- **Day 2:** Create mock portfolio data, build PortfolioSummary + PositionsTable
- **Day 3:** Build `/predict/portfolio/page.tsx` with tabs, PendingResolutions, HistoryTable
- **Day 4:** Responsive polish, empty states, tests

## Acceptance Criteria
- [ ] `/predict/create` renders a market creation form
- [ ] Form fields: question, resolution criteria, end date, category dropdown, initial liquidity amount
- [ ] Form validation: required fields, end date must be future, minimum liquidity
- [ ] Success state: shows "Market Created" with link to view it
- [ ] `/predict/portfolio` renders with mock positions data
- [ ] Portfolio summary: total invested, current value, total P&L
- [ ] Positions tab: table with market question, side, shares, avg price, current price, P&L
- [ ] Pending tab: markets awaiting resolution with end date
- [ ] History tab: resolved positions with outcome and P&L
- [ ] Empty states for each tab when no data
- [ ] Responsive layout for both pages
