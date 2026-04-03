---
id: gooddollar-l2-unified-portfolio-overview
title: "Add Unified Portfolio Overview Page Aggregating All Product Positions"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

Users currently must visit three separate portfolio pages to see all their positions:
- `/stocks/portfolio` — stock holdings
- `/predict/portfolio` — prediction market positions
- `/perps/portfolio` — perpetual futures positions

There is no single "Portfolio" or "Dashboard" page that aggregates all positions, shows a combined total value, and provides a quick overview of cross-product P&L. A DeFi user switching between products would expect a unified view of "all my positions" in one place, not three separate tabs buried under each product section.

## User Story

As a user with positions across multiple products (Stocks, Predict, Perps), I want a single portfolio overview page that shows all my positions and combined P&L, so that I can quickly assess my total exposure without visiting three separate pages.

## How It Was Found

During UX flow testing (Journey: "User checks their portfolio"):
1. Visited `/stocks/portfolio` — saw stock holdings
2. Visited `/predict/portfolio` — saw prediction positions
3. Visited `/perps/portfolio` — saw perps positions
4. No way to see all three together or get a combined total value
5. The main navigation has no "Portfolio" or "Dashboard" link — portfolios are sub-tabs within each product

## Proposed UX

Add a top-level portfolio page accessible from the header navigation (add a "Portfolio" icon/link near the "Recent Activity" button, or replace one of the nav items).

**Page layout:**
1. **Summary cards** at the top:
   - Total Portfolio Value (sum of all products)
   - Total Unrealized P&L (sum of all products)
   - Number of active positions
2. **Three sections** below, each showing a compact summary:
   - **Stocks** — Top holdings with value and P&L, "View All →" link to `/stocks/portfolio`
   - **Predictions** — Active positions with current value, "View All →" link to `/predict/portfolio`
   - **Perps** — Open positions with unrealized P&L, "View All →" link to `/perps/portfolio`
3. Each section shows 3-5 positions max with a link to the full portfolio page.

**Route:** `/portfolio`

**Navigation:** Add a portfolio icon button in the header (next to the Recent Activity clock icon), or add "Portfolio" to the main nav between existing items.

## Acceptance Criteria

- [ ] New `/portfolio` route exists and renders a unified portfolio overview
- [ ] Summary cards show total value, total P&L, and position count aggregated across all products
- [ ] Stocks section shows top holdings with P&L and "View All →" link
- [ ] Predictions section shows active positions with P&L and "View All →" link
- [ ] Perps section shows open positions with P&L and "View All →" link
- [ ] A link/icon in the header provides access to the portfolio page
- [ ] Page follows existing dark theme and card-based layout
- [ ] Responsive layout works on smaller viewports

## Verification

- Run full test suite
- Verify in browser with agent-browser

## Out of Scope

- Real wallet data integration (use existing mock data from each product's portfolio)
- Historical portfolio chart or performance graph
- Transaction history across products
- Settings or customization

## Planning

### Overview

Create a new `/portfolio` route that aggregates data from the existing mock data sources (stockData, predictData, perpsData) and displays a unified portfolio overview. Add a portfolio icon to the header next to the activity button.

### Research Notes

- Stock data: `getPortfolioSummary()` returns `{ totalValue, unrealizedPnl, pnlPercent, ... }`, `getPortfolioHoldings()` returns holdings array
- Predict data: `getPredictPortfolioSummary()` returns `{ totalInvested, currentValue, unrealizedPnl }`, `getUserPositions()` returns positions
- Perps data: `getAccountSummary()` returns `{ equity, balance, ... }`, `getOpenPositions()` returns positions
- Header: `ActivityButton` sits in the header right section — portfolio icon goes next to it
- All data functions are already importable from their respective lib files

### Architecture Diagram

```mermaid
graph TD
  A[/portfolio Route] --> B[PortfolioPage Component]
  B --> C[Summary Cards - Total Value / P&L / Positions]
  B --> D[Stocks Section - Top Holdings]
  B --> E[Predictions Section - Active Positions]
  B --> F[Perps Section - Open Positions]
  D -->|View All →| G[/stocks/portfolio]
  E -->|View All →| H[/predict/portfolio]
  F -->|View All →| I[/perps/portfolio]
  J[Header] -->|portfolio icon| A
  
  B -.->|imports| K[stockData]
  B -.->|imports| L[predictData]
  B -.->|imports| M[perpsData]
```

### One-Week Decision

**YES** — This is a new page that composes existing data. No new APIs or data sources. Approximately 2-3 days of work including tests.

### Implementation Plan

1. Create `frontend/src/app/portfolio/page.tsx` with the unified portfolio view
2. Import summary functions from stockData, predictData, and perpsData
3. Render summary cards (total value, total P&L, active positions count)
4. Render three sections with top 3 positions each + "View All →" links
5. Add a portfolio icon button to the Header component (next to ActivityButton)
6. Update Header to highlight the portfolio link when on `/portfolio`
7. Write tests for the new page
8. Verify in browser
