---
id: gooddollar-l2-token-explore-page
title: "Token Explore Page with Prices, Volume, and Market Data"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

Uniswap has a rich "Explore" section where users can browse tokens with prices, 24h price change, volume, TVL, and market cap. Users can sort, search, and click through to detailed token pages. GoodSwap has zero data discovery — there's no way to browse what tokens exist, what they're worth, or what's trending. This makes GoodSwap feel like a demo rather than a real trading platform.

## User Story

As a DeFi user, I want to browse a list of tokens with their prices and market data, so that I can discover trading opportunities and understand the market before swapping.

## How It Was Found

Competitor comparison: Uniswap's Explore section includes:
- Token list table: # rank, name+icon+symbol, price, 24h change (colored), 24h volume, TVL, sparkline chart
- Sortable columns
- Search bar
- Tabs for different categories
- Click through to individual token pages with detailed charts

GoodSwap has no Explore page, no token data table, and no market data display whatsoever.

## Proposed UX

Add an "Explore" page accessible from the header navigation:

1. **Header nav update**: Add "Explore" link between "Swap" and "Pool" in the header
2. **Page layout**: Clean table/list showing tokens with market data
3. **Columns**: Rank (#), Token (icon + symbol + name), Price (USD), 24h Change (green/red with arrow), 24h Volume, and a mini sparkline-style indicator
4. **Data source**: Use mock data for now (hardcoded realistic market data for 15-20 tokens)
5. **Search**: Filter tokens by name/symbol at the top of the page
6. **Sort**: Click column headers to sort ascending/descending
7. **Responsive**: On mobile, collapse to show rank, token, price, and 24h change only
8. **Row action**: Click a token row to navigate back to swap with that token pre-selected

## Acceptance Criteria

- [ ] New "/explore" route exists and renders a token data table
- [ ] Header navigation includes "Explore" link (active state when on explore page)
- [ ] Table shows at least 15 tokens with: rank, icon, symbol, name, price, 24h change, volume
- [ ] 24h change is colored green (positive) or red (negative) with arrow icon
- [ ] Search bar filters tokens by name or symbol
- [ ] At least one column is sortable (price or 24h change)
- [ ] Clicking a token row navigates to "/" with query param to pre-select that token
- [ ] Mobile layout collapses to essential columns (rank, token, price, change)
- [ ] Page has consistent dark theme styling matching the rest of the app
- [ ] Loading skeleton shows while data "loads" (simulated 500ms delay)

## Verification

- Run all tests
- Verify in browser: navigate to /explore, check table renders, search works, sort works
- Test mobile layout
- Test clicking a token navigates to swap with pre-selection

## Out of Scope

- Real-time price data from APIs (future initiative)
- Individual token detail pages with full charts
- Pool explorer / liquidity data
- Favorites/watchlist functionality

---

## Planning

### Overview

Create a new "/explore" page showing a token market data table, inspired by Uniswap's Explore section. This adds data richness and discovery to GoodSwap, giving users a reason to browse before trading.

### Research Notes

- Uniswap's explore page shows: rank, token (icon+symbol+name), price, 24h change, 7d volume, TVL, and a sparkline
- Next.js App Router supports adding new routes by creating `app/explore/page.tsx`
- Need to update Header navigation to include "Explore" as an active link
- The token data can share the same TOKENS array used by TokenSelector (if expanded in 0026)
- Sortable table headers can use simple React state — no external table library needed
- Loading skeleton can use Tailwind's animate-pulse

### Assumptions

- Mock data for prices, changes, and volumes is acceptable
- The token list from initiative 0026 can be reused (but this initiative is independent — if 0026 isn't done yet, we define our own token list here)
- Sparkline charts are out of scope — just show the 24h change with color

### Architecture

```mermaid
graph TD
    A[Header] -->|nav link| B[/explore route]
    B --> C[ExplorePageLayout]
    C --> D[SearchBar]
    C --> E[TokenTable]
    E --> F[SortableHeader columns]
    E --> G[TokenRow x N]
    G -->|click| H[Navigate to /swap?token=SYMBOL]
    D -->|filter| E
```

### Size Estimation

- **New pages/routes**: 1 (/explore)
- **New UI components**: 2-3 (TokenTable, TokenRow, page-level search/sort)
- **API integrations**: 0 (mock data)
- **Complex interactions**: 1 (sortable columns, search filter, navigation with query params)
- **Estimated LOC**: ~500

### One-Week Decision: YES

One new page with a sortable data table. No complex interactions beyond sort/search. Under 1000 LOC. Fits in 2-3 days.

### Implementation Plan

**Day 1:**
- Create /explore route with page layout
- Define mock token market data (15+ tokens with price, 24h change, volume)
- Build TokenTable and TokenRow components
- Write tests for table rendering and sorting

**Day 2:**
- Add search filtering
- Add sortable column headers (price, 24h change)
- Add loading skeleton
- Update Header to include Explore link with active state

**Day 3:**
- Click-through to swap with pre-selected token (query param)
- Mobile responsive layout (collapse to essential columns)
- Verify all acceptance criteria
