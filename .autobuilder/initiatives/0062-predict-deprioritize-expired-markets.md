---
id: gooddollar-l2-predict-deprioritize-expired-markets
title: "Prediction Markets — Deprioritize Expired Markets in Default View"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

On the Prediction Markets page (`/predict`), 11 out of 14 markets in the default "Trending" view are expired. Expired markets are intermixed with active ones, making the page feel stale and abandoned. A new user arriving at the prediction markets page sees mostly expired events, which undermines confidence in the platform.

Polymarket, the leading competitor, actively hides resolved markets from the default browse view and prominently features active, high-volume markets.

## User Story

As a prediction market user, I want to see active and tradeable markets first when browsing, so that I can quickly find markets I can participate in rather than scrolling past expired events.

## How It Was Found

During user journey testing, browsed the `/predict` page with the default "Trending" sort. Observed that only 3 of 14 visible markets are active (US Presidential Election 2028, AGI by 2030, SpaceX Mars 2026). The remaining 11 are expired. The "Expired" badge is visible but expired markets occupy most of the page space.

## Proposed UX

1. In the default "Trending" sort, push expired markets below all active markets. Active markets should always appear first.
2. Add an "Active" filter to the category filters (All, Crypto, Politics, etc.) or make "All" default to showing active markets first.
3. Optionally: visually de-emphasize expired market cards (reduce opacity or use a muted style) to make it clear they're no longer tradeable.

## Acceptance Criteria

- [ ] Default "Trending" view shows all active markets before any expired markets
- [ ] Expired markets are visually de-emphasized (reduced opacity or muted styling)
- [ ] Category filters still work correctly with the new sort order
- [ ] Users can still see and browse expired markets (not hidden entirely)
- [ ] All tests pass

## Verification

- Open `/predict` and verify active markets appear at the top
- Filter by category and verify active markets still sort first
- Run all tests

## Out of Scope

- Hiding expired markets entirely
- Adding pagination
- Changing the resolution/settlement logic

## Research Notes

- Sorting logic is in `frontend/src/lib/predictData.ts`, function `filterAndSortMarkets`
- The `trending` sort case (line 65-66) simply sorts by volume descending — no expired/active distinction
- The `ending` sort case already pushes expired markets to the bottom (lines 74-82) — same pattern needed for `trending` and other sort modes
- The `MarketCard` already has `opacity-60` class for expired markets (line 36 in predict/page.tsx) — good visual distinction already exists
- Fix: add a secondary sort to `trending` (and `newest`, `volume`) that pushes expired below active

## One-Week Decision

**YES** — Small logic change in the sorting function. ~30 minutes of work.

## Implementation Plan

1. In `filterAndSortMarkets`, add expired-deprioritization logic to the `trending`, `newest`, and `volume` sort cases (same pattern as `ending`)
2. For each sort: first separate by expired status (active first), then apply the existing sort within each group
