---
id: gooddollar-l2-landing-platform-showcase
title: "Add Platform Showcase Section to Landing Page"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: true
---

## Problem Statement

The landing page only showcases the swap functionality. Below the swap card there is a "How It Works" section (3 steps about swapping) and stats, but nothing about the platform's other major products: Tokenized Stocks, Prediction Markets, and Perpetual Futures. These are fully built sections accessible via the nav bar, but a first-time user scrolling the landing page would never discover them.

A first-time user who lands on this page sees: hero + swap card + How It Works (swap-focused) + stats + footer. They have no reason to explore Stocks, Predict, or Perps unless they randomly click nav items. The nav items are small text in the header — easy to miss or ignore.

## User Story

As a first-time visitor, I want to see a visual overview of all platform products on the landing page, so that I can discover that this platform offers tokenized stocks, prediction markets, and perpetual futures — not just token swaps — and quickly navigate to the section that interests me most.

## How It Was Found

Fresh-eyes review: Scrolled through the entire landing page. Found only swap-related content. Clicked "Stocks" in the nav out of curiosity and was surprised to find a fully built tokenized equities section. Same for Predict and Perps. None of these are mentioned or linked from the landing page.

## Proposed UX

Add a "Platform Products" section between the "How It Works" section and the stats row. It should contain 4 product cards in a responsive grid:

1. **GoodSwap** — "Swap any token with 0.1% fees funding UBI" — icon: swap arrows — link: /explore
2. **GoodStocks** — "Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI." — icon: chart line — link: /stocks
3. **GoodPredict** — "Bet on real-world events. Every trade funds UBI." — icon: crystal ball/question — link: /predict
4. **GoodPerps** — "Trade perpetual futures with up to 50x leverage. Every fee funds UBI." — icon: candlestick — link: /perps

Each card should:
- Have a subtle gradient border matching the app's teal/dark theme
- Show an icon, product name, one-line description, and a "Launch" or "Explore" CTA
- Be clickable to navigate to the section
- Animate on hover with a subtle lift/glow

Section heading: "Explore the Platform" with a subtitle like "Every product on GoodDollar routes fees to universal basic income."

## Acceptance Criteria

- [ ] A "Platform Products" section exists on the landing page between How It Works and stats
- [ ] Section contains 4 product cards: GoodSwap, GoodStocks, GoodPredict, GoodPerps
- [ ] Each card has an icon, name, description, and CTA link
- [ ] Cards link to their respective sections (/explore, /stocks, /predict, /perps)
- [ ] Section is responsive: 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Cards have hover animation (subtle lift or glow)
- [ ] Section heading and subtitle are present
- [ ] Existing tests pass, new component has basic render tests

## Verification

- Run all tests and verify in browser with agent-browser
- Check layout on desktop (1280px) and mobile (375px)
- Click each card and verify navigation

## Out of Scope

- Adding Pool or Bridge cards (they are "Coming Soon" placeholders)
- Changing the How It Works section content
- Adding animation libraries (use CSS transitions only)
