---
id: gooddollar-l2-platform-card-swap-link-fix
title: "Homepage — Fix GoodSwap Platform Card to Link to Swap Page"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

The "Explore the Platform" section on the homepage has a card titled "GoodSwap" that says "Swap any token with 0.1% fees funding UBI" — but the card links to `/explore` (the token listing page) instead of `/swap` (the actual swap interface). The CTA reads "Explore Tokens →" which doesn't match the card title "GoodSwap."

A first-time user clicking "GoodSwap" expecting to swap tokens will instead land on a market data table, creating confusion about where the actual swap feature is.

## User Story

As a first-time user exploring the platform, I want the "GoodSwap" card to take me to the swap interface, so that I can immediately start swapping tokens as the card title suggests.

## How It Was Found

Browser review with agent-browser. Clicked the "GoodSwap" product card in the "Explore the Platform" section. Expected to see the swap interface but was taken to /explore (token listing page). Confirmed in source: `PlatformShowcase.tsx` has `href: "/explore"` for the GoodSwap card.

## Proposed UX

Change the GoodSwap card to link to `/swap` and update the CTA to "Start Swapping →" to match the card's title and description. This creates a clear, consistent path: user reads "GoodSwap" → clicks → arrives at the swap interface.

Optionally, add a separate "Explore" card (5th card) linking to the token explore page with CTA "Browse Tokens →", so the explore page is also discoverable from the platform showcase.

## Acceptance Criteria

- [ ] GoodSwap card links to `/swap` instead of `/explore`
- [ ] GoodSwap card CTA text updated from "Explore Tokens →" to "Start Swapping →"
- [ ] Clicking the card navigates to the swap interface
- [ ] All other product cards remain unchanged

## Verification

- Click the GoodSwap card and verify it navigates to /swap
- Run test suite to ensure no regressions
- Visual check that the card still renders correctly

## Out of Scope

- Redesigning the platform showcase layout
- Adding new product cards
- Changing the swap page itself

## Planning

### Overview

Fix the GoodSwap card in `PlatformShowcase.tsx` to link to `/swap` instead of `/explore`, and update the CTA text.

### Research Notes

- File: `frontend/src/components/PlatformShowcase.tsx`
- GoodSwap entry (lines 3–14): `href: "/explore"`, `cta: "Explore Tokens"`
- `/swap` route exists (added in initiative 0111)
- The Explore page (`/explore`) is separately accessible from the nav

### Architecture Diagram

```mermaid
graph LR
    A[PlatformShowcase.tsx] --> B[GoodSwap Card]
    B -->|Currently| C[/explore]
    B -->|Should Be| D[/swap]
```

### One-Week Decision

**YES** — Two-line change in one file. Update `href` and `cta` for the GoodSwap product entry.

### Implementation Plan

1. In `PlatformShowcase.tsx`, change GoodSwap's `href` from `"/explore"` to `"/swap"`
2. Change `cta` from `"Explore Tokens"` to `"Start Swapping"`
3. Update the PlatformShowcase test to reflect the new CTA text
4. Verify the link navigates correctly
