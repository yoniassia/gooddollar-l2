---
id: goodpredict-market-detail
title: "GoodPredict Market Detail Page"
parent: 0047-goodpredict-prediction-markets
deps: [goodpredict-markets-browser]
split: false
depth: 1
planned: true
executed: false
---

# GoodPredict Market Detail Page

## Overview
Build the `/predict/[marketId]` page — an individual prediction market view with probability price over time chart, YES/NO trade panel, order book summary, market info (resolution criteria, end date, source), and volume stats.

## Research Notes
- Probability displayed as 0-100% (equivalent to 0¢-100¢ per share)
- Chart shows probability over time using Lightweight Charts (area chart)
- Trade panel: select YES or NO, enter amount, see shares received and avg price
- Market info: question, resolution criteria, end date, resolution source, creator
- Volume stats: total volume, 24h volume, liquidity
- UBI fee: 1% on winnings → 33% to UBI pool

## Architecture

```mermaid
graph TD
    A[/predict/marketId page] --> B[ProbabilityChart - area chart]
    A --> C[TradePanel - YES/NO]
    A --> D[MarketInfoPanel]
    A --> E[VolumeStats]
    F[lib/predictData.ts] --> A
    G[lib/chartData.ts - probability history] --> B
    C --> H[UBI Fee Display]
```

## Size Estimation
- **New pages/routes:** 1 (/predict/[marketId])
- **New UI components:** 5 (ProbabilityChart, TradePanel, MarketInfoPanel, VolumeStats, OutcomeButton)
- **API integrations:** 1 (Lightweight Charts for probability chart)
- **Complex interactions:** 1 (interactive probability chart)
- **Estimated LOC:** ~750

## One-Week Decision: YES
1 complex page, 5 components, 1 complex interaction, ~750 LOC. Fits as a single complex page.

## Implementation Plan
- **Day 1:** Create mock probability history data, build ProbabilityChart (area chart with Lightweight Charts)
- **Day 2:** Build `/predict/[marketId]/page.tsx` layout, MarketInfoPanel, VolumeStats
- **Day 3:** TradePanel with YES/NO buttons, amount input, shares calculation, UBI fee display
- **Day 4:** 404 for invalid marketId, responsive layout, back navigation, tests
- **Day 5:** Polish, edge cases

## Acceptance Criteria
- [ ] `/predict/[marketId]` renders for valid market IDs, 404 for invalid
- [ ] Probability chart shows mock data over time as area chart (green fill)
- [ ] Trade panel: select YES or NO outcome, enter dollar amount, see estimated shares and cost
- [ ] UBI fee display: "1% fee on winnings → 33% funds UBI"
- [ ] Market info panel: question, resolution criteria, end date, resolution source
- [ ] Volume stats: total volume, 24h volume, total shares traded
- [ ] Current probability displayed prominently (e.g. "YES 67%")
- [ ] Responsive layout: chart on top, trade panel + info below on mobile
- [ ] Back link to /predict
