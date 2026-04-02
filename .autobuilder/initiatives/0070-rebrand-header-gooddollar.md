---
id: gooddollar-l2-rebrand-header-gooddollar
title: "Rebrand Platform Header and Title from GoodSwap to GoodDollar"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: true
---

## Problem Statement

The app header, logo text, and browser tab title all say "GoodSwap" even though the platform offers far more than token swaps — it includes Stocks (tokenized equities), Predict (prediction markets), and Perps (perpetual futures). A first-time user landing on the site sees "GoodSwap" and assumes this is just a DEX/swap interface, missing the broader platform capabilities visible in the navigation bar.

The browser tab says "GoodSwap — Every Swap Funds UBI" which reinforces the swap-only perception. The navigation shows 7 items (Swap, Explore, Pool, Bridge, Stocks, Predict, Perps) under the "GoodSwap" brand, which is confusing — why would a swap app have stocks and prediction markets?

## User Story

As a first-time visitor, I want the platform branding to accurately reflect the full product suite (swap, stocks, predictions, perpetual futures), so that I immediately understand this is a comprehensive DeFi platform — not just a swap interface.

## How It Was Found

Fresh-eyes review: Opened the app for the first time. The header says "GoodSwap" with the GS logo. Navigated through Stocks, Predict, and Perps sections — all fully built with data — but the branding never changes from "GoodSwap." The mismatch between the "swap" brand and the multi-vertical product suite is immediately confusing.

## Proposed UX

- Change header logo text from "GoodSwap" to "GoodDollar"
- Update the page title from "GoodSwap — Every Swap Funds UBI" to "GoodDollar — DeFi That Funds UBI"
- Keep the "G$" icon in the logo (already appropriate for GoodDollar)
- Update the landing page hero tagline from "Swap. Fund UBI." to "Trade. Predict. Invest. Fund UBI." to communicate the platform breadth
- Update the landing page subtitle to mention the broader platform

## Acceptance Criteria

- [ ] Header logo text reads "GoodDollar" instead of "GoodSwap"
- [ ] Browser tab title reads "GoodDollar — DeFi That Funds UBI"
- [ ] Landing page hero tagline communicates multi-product nature (not just swaps)
- [ ] Landing page subtitle mentions that all platform activity funds UBI (not just trades)
- [ ] All existing tests pass (update any tests referencing "GoodSwap")
- [ ] No regressions in header layout on desktop and mobile

## Verification

- Run all tests and verify in browser with agent-browser
- Check header on desktop (1280px) and mobile (375px)
- Verify browser tab title on landing page and all section pages

## Out of Scope

- Changing the swap card component itself
- Adding new navigation items
- Redesigning the logo icon
- Changing section-level branding (the swap page can still say "Swap" as a section name)
