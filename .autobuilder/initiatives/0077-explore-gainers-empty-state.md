---
id: gooddollar-l2-explore-gainers-empty-state
title: "Explore — Fix Market Stats Banner Edge Cases and Trade Button Loading State"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

Two minor but noticeable UX issues found in code review:

1. **Market Stats Banner (0075)**: The Top Gainers and Trending cards slice top 3 tokens, but if fewer than 3 tokens have positive 24h change, the cards appear with only 1-2 items and no messaging — the card looks broken/empty
2. **Predict Trade Buttons (0074)**: The YES/NO quick-trade buttons navigate to the market detail page but have no loading state. A user can click multiple times causing multiple navigations, and there's no visual feedback that anything is happening

## User Story

As a user looking at the Explore market stats banner, I want the Trending and Top Gainers lists to look complete and intentional even with sparse data. As a user clicking YES/NO trade buttons on prediction markets, I want visual feedback confirming my click was registered.

## Acceptance Criteria

- [ ] Top Gainers card: if fewer than 3 gainers exist, show a "—" placeholder row with muted text (e.g., "No more gainers today")
- [ ] Trending card: same treatment for < 3 trending items
- [ ] YES/NO trade buttons: disable after first click and show a subtle loading spinner (replace button text briefly, or opacity-50 + cursor-wait) until navigation completes
- [ ] Emoji icons in stat cards (`🔥`, `🚀`) replaced with inline SVG icons that scale properly on mobile

## Out of Scope

- Real API data integration
- Complex loading state management (redux/context)
- Skeleton loading for the whole banner

## Size Estimation

- **Modified files:** ~2 (explore/page.tsx, predict/page.tsx)
- **Estimated LOC:** ~40-60
- **One-week decision:** YES (all targeted, low complexity)
