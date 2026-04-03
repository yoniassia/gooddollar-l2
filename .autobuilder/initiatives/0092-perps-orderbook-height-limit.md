---
id: gooddollar-l2-perps-orderbook-height-limit
title: "Perps Order Book — Add Max-Height and Overflow Scroll to Prevent Excessive Page Length"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: false
---

## Overview

Add a max-height constraint with overflow scrolling to the OrderBook component so it doesn't make the Perps page excessively long, especially on mobile. This mirrors the existing pattern used by the RecentTrades component.

## Research Notes

- The `RecentTrades` component already uses `max-h-[300px] overflow-y-auto scrollbar-none` — we replicate this pattern
- The OrderBook has a mid-price/spread row that divides asks from bids — this should stay visible outside the scroll containers
- Total OrderBook: header + asks scroll area + spread row + bids scroll area ≈ 350px max

## Assumptions

- The `scrollbar-none` Tailwind utility class is already available in the project's global CSS

## Architecture Diagram

```mermaid
graph TD
    OB[OrderBook Component] --> H[Header Row - Price/Size/Total]
    OB --> AS[Asks Scroll Container - max-h-[130px] overflow-y-auto]
    AS --> AR[Ask Rows x12 - reverse order]
    OB --> SP[Spread/Mid-Price Row - always visible]
    OB --> BS[Bids Scroll Container - max-h-[130px] overflow-y-auto]
    BS --> BR[Bid Rows x12]
```

## One-Week Decision

**YES** — This is a single-file CSS change to `OrderBook.tsx`. Approximately 15 minutes of work.

## Implementation Plan

1. Wrap the asks `div` with `max-h-[130px] overflow-y-auto scrollbar-none`
2. Wrap the bids `div` with `max-h-[130px] overflow-y-auto scrollbar-none`
3. Keep the spread/mid-price row outside both scroll containers (already the case)
4. Verify on both desktop and mobile viewports

## Problem Statement

The `OrderBook` component renders all 24 rows (12 asks + 12 bids) without any height constraint. On desktop the 3-column grid limits the visual impact, but on mobile (single-column layout) the Order Book takes up ~600px+ of vertical space, forcing users to scroll through dozens of rows to reach the Recent Trades and Open Positions panels below.

The `RecentTrades` component already has `max-h-[300px] overflow-y-auto` but `OrderBook` has no equivalent constraint.

## User Story

As a mobile trader using the Perps page, I want the Order Book to be height-limited so I can quickly scroll past it to see my open positions and recent trades without endlessly scrolling through order book rows.

## How It Was Found

During deep-dive stress testing of the Perps trading terminal on mobile viewport (375×812), the full-page screenshot revealed the Order Book section consuming a disproportionate amount of vertical space. The page total height was extremely long compared to competitor perpetual DEXs where the order book is always height-constrained with internal scroll.

## Proposed UX

- Add `max-h-[300px] overflow-y-auto` to the OrderBook's asks and bids containers, matching the RecentTrades pattern
- Keep the mid-price/spread row always visible (sticky or outside the scroll area)
- On desktop, the height limit keeps the 3-column grid balanced

## Acceptance Criteria

- [ ] OrderBook component has a max-height (300px) with overflow-y-auto for both asks and bids sections
- [ ] The mid-price/spread bar remains visible outside the scrollable areas
- [ ] On mobile (375px width), the Order Book no longer dominates the page — total OrderBook height is ≤ ~350px including headers
- [ ] Desktop 3-column grid remains visually balanced
- [ ] Scrollbar styling uses `scrollbar-none` class to match existing RecentTrades pattern

## Verification

- Run all tests and verify in browser with agent-browser at both desktop (1280×720) and mobile (375×812) viewports

## Out of Scope

- Virtual scrolling or windowing for order book rows
- Real-time order book updates
- Aggregated order book levels
