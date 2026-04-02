---
id: gooddollar-l2-explore-sparkline-charts
title: "Explore — Add 7-Day Sparkline Charts to Token Table"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

CoinGecko's token table includes a "Last 7 Days" sparkline chart column — a small inline line graph showing each token's 7-day price history. This is the single most visually impactful feature that separates a professional token explorer from a basic data table. Our Explore page has only textual columns (Price, 24h Change, Volume, Market Cap) with no visual price trend indicator. A trader scanning the table has no way to quickly see if a token is trending up, down, or sideways over the past week without clicking into each one.

## User Story

As a DeFi user browsing the Explore token list, I want to see a mini 7-day price chart in each row so that I can visually scan price trends across all tokens without clicking into each one.

## How It Was Found

Side-by-side competitor comparison: Opened CoinGecko's "Cryptocurrency Prices by Market Cap" table alongside our Explore page at `/explore`. CoinGecko has a "Last 7 Days" column on the far right with a small red/green line chart for each token. Our table lacks any visual chart element. This is the most visually obvious gap — CoinGecko's table immediately looks more informative and professional.

## Proposed UX

Add a "7d" column as the last data column (before the Swap button) in the token table:
- Show a small SVG sparkline (~80px wide × 32px tall) for each token
- The line color should be green if the 7d change is positive, red if negative
- Generate synthetic 7-day price data points (7 daily closes) for each token
- On mobile, hide this column (like Volume and Market Cap)
- The sparkline should be simple — just a polyline on a transparent background, no axes or labels

Design reference: CoinGecko's "Last 7 Days" column

## Acceptance Criteria

- [ ] A "7d" sparkline chart column appears in the Explore table (after Market Cap, before Swap)
- [ ] Each token row has a small SVG line chart showing 7-day price history
- [ ] Line is green for tokens with positive 7d change, red for negative
- [ ] Sparkline is hidden on mobile (below `sm` breakpoint)
- [ ] Sparkline data is generated deterministically per token (seeded random)
- [ ] All existing tests pass
- [ ] No layout regressions — table still looks clean and aligned

## Verification

- Run all tests and verify in browser with agent-browser
- Compare visual appearance against CoinGecko's sparkline column
- Check mobile responsiveness — sparkline column should be hidden

## Out of Scope

- Real-time sparkline data from an API
- Interactive charts (hover tooltips, click-to-expand)
- Adding sparklines to Stocks or other tables

## Overview (Planning)

Add a "7d" sparkline column to the Explore token table. Create a reusable `Sparkline` SVG component and generate synthetic 7-day price history data for each token in the market data utility.

## Research Notes

- `frontend/src/app/explore/page.tsx`: Client component with `TokenRow` memo'd component, uses `getTokenMarketData()` from `@/lib/marketData`
- `frontend/src/lib/marketData.ts`: Has `TokenMarketData` interface with price, change24h, volume24h, marketCap. Needs new `sparkline7d` field (array of 7 numbers)
- The table has a hidden "Swap" button column at the end. The sparkline goes before it.
- CoinGecko sparklines are ~80-100px wide with a simple polyline, no axes, no fill
- SVG sparkline can be rendered as an inline SVG with a `<polyline>` element

## Assumptions

- Generate 7 data points (one per day) for each token based on its current price and change24h
- Use a seeded pseudorandom approach: for each token, derive points from the current price with small random variations
- Sparkline is purely visual — no tooltip or interaction

## Architecture Diagram

```mermaid
graph TD
    A[marketData.ts] --> B[Add sparkline7d: number[] to TokenMarketData]
    A --> C[generateSparklineData fn]
    C --> D[Seeded random 7 daily price points]
    E[Sparkline.tsx component] --> F[SVG polyline]
    E --> G[Props: data, width, height, color]
    H[explore/page.tsx] --> I[Import Sparkline]
    H --> J[Add 7d column header]
    H --> K[Render Sparkline in TokenRow]
```

## One-Week Decision

**YES** — This is a ~2 hour task. One new component, one data utility update, one page column addition.

## Implementation Plan

### Phase 1: Generate sparkline data
- Add `sparkline7d: number[]` to `TokenMarketData` interface
- Add `generateSparklineData(price, change24h)` function that returns 7 price points
- Use the token's symbol as a seed for deterministic variation

### Phase 2: Create Sparkline component
- Create `frontend/src/components/Sparkline.tsx`
- Props: `data: number[]`, `width?: number`, `height?: number`, `positive?: boolean`
- Renders an SVG with a polyline, green if positive, red if negative

### Phase 3: Add column to Explore table
- Add "7d" header column (hidden on mobile)
- Render `Sparkline` in each `TokenRow`
- Pass sparkline data from token market data

### Phase 4: Tests
- Test Sparkline component renders SVG with correct color
- Update explore page tests if they check column count
