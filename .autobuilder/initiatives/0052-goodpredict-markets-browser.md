---
id: goodpredict-markets-browser
title: "GoodPredict Markets Browser Page"
parent: 0047-goodpredict-prediction-markets
deps: []
split: false
depth: 1
planned: true
executed: false
---

# GoodPredict Markets Browser Page

## Overview
Build the `/predict` page — a Polymarket-inspired market browser showing prediction markets as cards with probability bars, category filtering, search, and trending/newest sorting. Uses mock market data. Includes Header nav integration.

## Research Notes
- Polymarket UI: card grid with question title, probability bar (YES green / NO red), volume, end date
- Categories: Crypto, Politics, Sports, AI & Tech, World Events, Culture
- Sort options: Trending, Newest, Highest Volume, Ending Soon
- Each card shows: question, YES probability %, volume, end date, category badge
- Add "Predict" link to Header nav (desktop + mobile)

## Architecture

```mermaid
graph TD
    A[Header - add Predict nav link] --> B[/predict page]
    B --> C[CategoryTabs]
    B --> D[SortSelector]
    B --> E[SearchInput]
    B --> F[MarketCardGrid]
    F --> G[MarketCard - with ProbabilityBar]
    H[lib/predictData.ts - mock markets] --> F
```

## Size Estimation
- **New pages/routes:** 1 (/predict)
- **New UI components:** 4 (MarketCard, ProbabilityBar, CategoryTabs, SortSelector)
- **API integrations:** 0 (mock data)
- **Complex interactions:** 0
- **Estimated LOC:** ~500

## One-Week Decision: YES
1 page, 4 components, 0 complex interactions, ~500 LOC. Straightforward listing page.

## Implementation Plan
- **Day 1:** Create mock markets data (`lib/predictData.ts`) with 12+ sample markets across categories
- **Day 2:** Build MarketCard + ProbabilityBar components, `/predict/page.tsx` with grid layout
- **Day 3:** CategoryTabs, SortSelector, search, Header nav integration, responsive polish, tests

## Acceptance Criteria
- [ ] `/predict` page renders a grid of 12+ prediction market cards
- [ ] Each card shows: question title, YES probability (%), volume, end date, category badge
- [ ] Probability bar visualization (green for YES side, red for NO side)
- [ ] Category tabs filter markets: All, Crypto, Politics, Sports, AI & Tech, World Events, Culture
- [ ] Sort options: Trending, Newest, Highest Volume, Ending Soon
- [ ] Search filters markets by question text
- [ ] "Predict" appears in Header navigation (desktop + mobile)
- [ ] Clicking a market card navigates to `/predict/[marketId]`
- [ ] Responsive: 3 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Empty state when no markets match filters
