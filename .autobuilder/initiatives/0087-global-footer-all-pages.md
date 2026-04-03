---
id: gooddollar-l2-global-footer-all-pages
title: "Add Global Footer to All Pages for Visual Consistency"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: false
---

## Problem Statement

The footer (LandingFooter component) currently only appears on the home/landing page. All other pages — /stocks, /predict, /perps, /portfolio, /explore, /bridge, /pool — end abruptly with no footer, making them feel unfinished. Professional DeFi apps (Uniswap, Aave, dYdX) have consistent footers across all pages.

## User Story

As a user navigating the app, I want to see a consistent footer on every page with useful links, so that the app feels complete and I can always find important resources.

## How It Was Found

Visual review using agent-browser. Scrolled to the bottom of /stocks, /predict, /perps, /portfolio pages. Each page ends with content and then empty dark space — no footer branding, links, or navigation.

## Proposed UX

- Move the footer from being landing-page-specific to a global layout footer that renders on all pages
- The footer should be placed in the root layout so it appears on every route
- Keep the existing footer content (Powered by GoodDollar L2 | Docs, GitHub, Community links)
- Add sufficient top margin/padding so the footer has breathing room from page content
- The footer should sit at the bottom of the page (not sticky/fixed — use min-height layout so it's pushed down on short pages)

## Acceptance Criteria

- [ ] The footer appears on all routes: /, /explore, /stocks, /predict, /perps, /portfolio, /bridge, /pool
- [ ] The footer renders with the same content on every page
- [ ] The footer has sufficient spacing from page content (consistent padding/margin)
- [ ] On short-content pages (e.g., /bridge), the footer is pushed to the bottom of the viewport
- [ ] Existing LandingFooter tests pass
- [ ] No visual regression on the landing page

## Verification

- Run all tests: `npm test`
- Check in browser with agent-browser on /, /stocks, /predict, /perps, /portfolio

## Out of Scope

- Adding social media icons or additional footer sections
- Making the footer sticky or fixed
- Adding a newsletter signup or other new footer features
