---
title: "GoodPredict — Prediction Markets"
parent: gooddollar-l2
planned: true
executed: false
split: true
priority: high
depends_on: []
---

# GoodPredict — Prediction Markets

## Goal
Build a Polymarket-style prediction market on the GoodDollar L2 where users bet on real-world events using G$/USDC, with UBI fee routing on every trade.

## Research Notes
- Polymarket UI patterns: card-based market listing, probability bars (YES green / NO red), category tabs
- Lightweight Charts can display probability over time
- Markets are binary YES/NO with prices 0-100¢ representing probability
- For v1 frontend: mock data layer with sample markets across categories
- Existing design system: dark theme, goodgreen accent, rounded cards, consistent with GoodSwap

## Architecture

```mermaid
graph TD
    A[/predict - Markets Browser] --> B[MarketCard Grid]
    A --> C[Category Tabs]
    A --> D[Search/Filter]
    E[/predict/marketId - Detail] --> F[Probability Chart]
    E --> G[Trade Panel YES/NO]
    E --> H[Market Info + Resolution]
    I[/predict/create] --> J[Market Creation Form]
    K[/predict/portfolio] --> L[Positions Table]
    K --> M[Claimable Winnings]
    N[Header Nav] --> A
    O[Mock Markets Data] --> A
    O --> E
    O --> K
```

## Size Estimation
- **New pages/routes:** 4 (/predict, /predict/[marketId], /predict/create, /predict/portfolio)
- **New UI components:** 8+ (MarketCard, ProbabilityBar, CategoryTabs, TradePanel, ProbabilityChart, CreateMarketForm, PositionsTable, MarketInfo)
- **API integrations:** 1 (mock data layer)
- **Complex interactions:** 2 (probability chart over time, trade panel with amount/shares calc)
- **Estimated LOC:** ~2500-3500

## One-Week Decision: NO
4 pages, 8+ components, 2 complex interactions, 2500+ LOC. Exceeds thresholds. Must split.

## Split Rationale
Split into 3 vertical slices:
1. **Markets Browser** — listing page with category filter, search, market cards, nav integration (~500 LOC)
2. **Market Detail** — individual market page with probability display and trade panel (~800 LOC)
3. **Create + Portfolio** — market creation form and portfolio page (~700 LOC)

## Children
- 0052-goodpredict-markets-browser
- 0053-goodpredict-market-detail
- 0054-goodpredict-create-portfolio
