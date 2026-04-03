---
id: gooddollar-l2-cross-product-navigation-links
title: "Add Cross-Product Discovery Links Between Related Assets"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

Each product section (Explore, Stocks, Perps, Predict) operates as a completely isolated silo. When viewing ETH on the Explore page, there's no link to the ETH-USD perpetual futures market. When viewing BTC-USD on Perps, there's no link to swap BTC on the Explore page. When on the Stocks page, there's no mention that crypto assets are available to trade on other sections.

This means users who discover one product section may never discover the rest. The platform has 4 rich trading products, but a user who starts on Stocks might never realize they can also trade perpetual futures on crypto.

## User Story

As a GoodDollar user viewing an asset in one section, I want to see links to the same or related assets in other sections, so that I can discover the full platform and trade across different products without manually navigating.

## How It Was Found

User journey test: "User researches a stock and compares it" + "User explores prediction markets"
1. Viewed MSFT on `/stocks/MSFT` — no cross-references to any other section
2. Viewed BTC-USD on `/perps` — no link to swap BTC on Explore
3. Viewed the election prediction market — no links to related assets
4. Each section is a dead end for cross-platform discovery

## Proposed UX

Add subtle "Also available on" or "Trade on" cross-links in key locations:

1. **Perps page**: Below the pair info bar, show a small link "Swap BTC →" linking to `/?buy=WBTC` for assets that exist on the Explore page
2. **Explore token detail page** (once built): If the token has a perps market, show "Trade BTC-USD Perps →" linking to `/perps`
3. **Stock detail page**: Show a "Trade crypto assets →" link in a subtle banner below key stats, linking to `/explore`

Keep the cross-links small and unobtrusive — they should enhance discovery without cluttering the interface.

## Acceptance Criteria

- [ ] Perps page shows a small "Swap [TOKEN]" link for the selected pair's base asset
- [ ] Stock detail page shows a subtle link to explore crypto assets
- [ ] Cross-links use consistent styling (small text, muted color, arrow icon)
- [ ] Links navigate to the correct destination
- [ ] Cross-links do not clutter the existing layout

## Research Notes

- Perps page is at `frontend/src/app/perps/page.tsx` — the `PairInfoBar` component (line 112-144) shows mark price, 24h change, volume, funding, next, OI
- The selected pair has `baseAsset` (e.g. "BTC") and `quoteAsset` (e.g. "USD")
- Token symbols on explore are e.g. "WBTC" for Bitcoin, "ETH" for Ether
- Stock detail page is at `frontend/src/app/stocks/[ticker]/page.tsx` — ends after the "Your Position" card
- Need a mapping from perps base assets to explore token symbols: BTC→WBTC, ETH→ETH, SOL→SOL, LINK→LINK, G$→G$
- Cross-links should be small, non-intrusive, and use the app's existing text styling

## Architecture

```mermaid
graph TD
    A[Perps PairInfoBar] -->|"Swap BTC →"| B[/?buy=WBTC]
    C[Stock Detail] -->|"Explore Crypto →"| D[/explore]
    E[Explore Token Detail] -->|"Trade ETH-USD Perps →"| F[/perps]
```

## One-Week Decision

**YES** — Adding a few small link elements to existing pages. Under 1 day of work.

## Implementation Plan

1. Add a small "Swap [TOKEN] →" link below the `PairInfoBar` on the perps page, mapping base asset to explore token symbol
2. Add a subtle "Explore crypto assets →" banner link at the bottom of the stock detail page (below Your Position)
3. Style cross-links consistently: small text (text-xs), muted color (text-gray-400 hover:text-goodgreen), arrow icon

## Verification

- Run all tests and verify in browser with agent-browser

## Out of Scope

- Algorithmic "related assets" recommendations
- Deep linking between specific prediction markets and assets
- Redesigning the navigation bar
- Adding cross-product search
