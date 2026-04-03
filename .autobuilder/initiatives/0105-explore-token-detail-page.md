---
id: gooddollar-l2-explore-token-detail-page
title: "Explore — Add Token Detail Pages with Chart and Key Stats"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

The Explore page lists 18 tokens with prices, change percentages, volume, and market cap — but clicking any token row simply redirects to the swap page (`/?buy=TOKEN`). There is no token detail page where a user can research a token before deciding to trade it. The research step of the "explore → research → trade" user journey is completely missing.

By comparison, CoinGecko and CoinMarketCap offer rich token detail pages with price charts, supply breakdowns, descriptions, and contract addresses. A user who wants to learn about a token before swapping it has no way to do so on GoodDollar.

## User Story

As a DeFi user browsing tokens on GoodDollar L2, I want to click on a token from the Explore list and see a detail page with a price chart, key stats, and a quick trade action, so that I can research a token before committing to a swap.

## How It Was Found

User journey test: "New user explores the app"
1. Navigated to `/explore`
2. Clicked the ETH token row
3. Was redirected to `/?buy=ETH` — the swap page — with no intermediate research step
4. No way to see ETH's price chart, supply info, or description from the Explore section

## Proposed UX

Create a `/explore/[symbol]` detail page for each token with:
- Token header: icon, name, symbol, current price, 24h change
- Price chart with timeframe selector (1D, 1W, 1M, 3M, 1Y) — reuse existing `PriceChart` component
- Key stats grid: Market Cap, 24h Volume, Circulating Supply, Max Supply, All-Time High, All-Time Low
- A prominent "Swap [TOKEN]" CTA button linking to `/?buy=TOKEN`
- "← Back to Explore" breadcrumb link

The token row click on the Explore page should navigate to `/explore/[symbol]` instead of `/?buy=TOKEN`. The "Swap" button in the table should remain as a shortcut directly to the swap page.

## Acceptance Criteria

- [ ] Clicking a token row on `/explore` navigates to `/explore/[symbol]`
- [ ] Token detail page shows token name, symbol, icon, current price, and 24h change
- [ ] Price chart renders with 5 timeframe options (1D, 1W, 1M, 3M, 1Y)
- [ ] Key stats grid shows at least Market Cap, Volume, and Supply data
- [ ] "Swap [TOKEN]" CTA button links to `/?buy=TOKEN`
- [ ] "← Back to Explore" link navigates back to `/explore`
- [ ] Table "Swap" button still links directly to swap (shortcut)
- [ ] Page renders correctly on mobile (375px width)

## Research Notes

- Explore page is at `frontend/src/app/explore/page.tsx`, uses `getTokenMarketData()` from `@/lib/marketData.ts`
- Token data comes from `@/lib/tokens.ts` (18 tokens) combined with mock market data in `@/lib/marketData.ts`
- Currently `handleRowClick` does `router.push('/?buy=${symbol}')` — need to change to `/explore/${symbol}`
- The "Swap" button in the table row also calls `onRowClick` — need to make it a separate handler
- PriceChart component exists at `@/components/PriceChart`, dynamically imported with `next/dynamic`
- `getChartData(symbol, timeframe, basePrice)` from `@/lib/chartData.ts` generates mock OHLC data
- Need to add `getTokenBySymbol(symbol)` function to `@/lib/marketData.ts`
- Token descriptions need to be added to marketData.ts (short 1-2 sentence descriptions)

## Architecture

```mermaid
graph TD
    A[/explore page] -->|click row| B[/explore/symbol page]
    A -->|click Swap button| C[/?buy=SYMBOL swap page]
    B --> D[getTokenBySymbol from marketData.ts]
    B --> E[getChartData from chartData.ts]
    B --> F[PriceChart component]
    B --> G[Key Stats Grid]
    B -->|Swap CTA| C
    B -->|Back link| A
```

## One-Week Decision

**YES** — One new page component, minor data function additions, and a route change. Under 2 days of work.

## Implementation Plan

1. Add `getTokenBySymbol(symbol)` to `@/lib/marketData.ts` and add `description` field to `MOCK_MARKET_DATA`
2. Create `frontend/src/app/explore/[symbol]/page.tsx` with:
   - Token header (icon, name, symbol, price, change)
   - PriceChart with timeframe selector
   - Key stats grid (Market Cap, Volume, 1h/24h/7d changes)
   - "Swap [TOKEN]" CTA button
   - "← Back to Explore" breadcrumb
3. Update `handleRowClick` in `explore/page.tsx` to navigate to `/explore/${symbol}`
4. Make the table "Swap" button navigate to `/?buy=${symbol}` directly (not through handleRowClick)

## Verification

- Run all tests and verify in browser with agent-browser

## Out of Scope

- Real-time price updates / WebSocket feeds
- Social media links or community data
- Token contract address display
- Adding new tokens to the listing
