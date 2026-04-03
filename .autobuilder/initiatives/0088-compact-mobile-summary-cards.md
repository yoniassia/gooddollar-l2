---
id: gooddollar-l2-compact-mobile-summary-cards
title: "Portfolio & Sub-Portfolio Pages — Compact Summary Cards on Mobile"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: false
---

## Problem Statement

On mobile viewports, the summary stat cards (Total Value, Unrealized P&L, Active Positions / Equity / etc.) on the Portfolio Overview, Perps Portfolio, Stocks Portfolio, and Predict Portfolio pages stack vertically with full-width sizing and large padding, each card consuming significant vertical space. On a 375px viewport, the three cards push the actual position data below the fold, requiring excessive scrolling. The cards each have `p-5` padding and `rounded-2xl` on mobile, making them visually heavy for simple label + value pairs.

## User Story

As a mobile user, I want the summary cards to be compact on my phone screen, so that I can see my actual positions and data without excessive scrolling.

## How It Was Found

Visual review using agent-browser at 375x812 viewport on the Portfolio Overview page. The three summary cards took up nearly the entire viewport, pushing stock/predict/perps position data below the fold. Users must scroll past large empty cards just to see their holdings.

## Proposed UX

- On mobile (< 640px), reduce card padding from `p-5` to `p-3` or `px-4 py-3`
- Consider showing the three cards in a horizontal scrollable row or a 3-column compact grid on mobile
- Alternative: use a single row with dividers instead of separate cards (label: value | label: value | label: value)
- Reduce label text size and value text size slightly on mobile
- The desktop layout (3-column grid with comfortable padding) should remain unchanged

## Acceptance Criteria

- [ ] On 375px viewport, the summary cards take up less than 50% of the viewport height
- [ ] Position/holdings data is visible above the fold on mobile
- [ ] On desktop (1280px), the cards retain their current 3-column comfortable layout
- [ ] The pattern is applied consistently across Portfolio, Perps Portfolio, Stocks Portfolio, and Predict Portfolio pages
- [ ] All existing tests pass

## Verification

- Run all tests: `npm test`
- Check in browser with agent-browser at 375px and 1280px viewports on /portfolio, /perps/portfolio, /stocks/portfolio, /predict/portfolio

## Out of Scope

- Redesigning the portfolio data display below the cards
- Adding new data points to the summary cards
- Changing the card color scheme or borders
