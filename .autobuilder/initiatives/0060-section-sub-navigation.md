---
id: gooddollar-l2-add-section-sub-navigation
title: "Add Sub-Navigation Tabs to Stocks, Predict, and Perps Sections"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

The Stocks, Predict, and Perps sections each have important sub-pages (portfolio, leaderboard, create market) that are **completely undiscoverable** from the main navigation. The header only links to the top-level section pages. There are zero links anywhere in the UI to reach:

- `/stocks/portfolio`
- `/predict/portfolio`
- `/predict/create`
- `/perps/portfolio`
- `/perps/leaderboard`

Users must know the exact URL to visit these pages. This is a critical navigation dead-end that makes core trading features invisible.

## User Story

As a DeFi trader using GoodSwap, I want to easily navigate between the main page, my portfolio, and other sub-pages within each trading section (Stocks, Predict, Perps) so that I can manage my positions, view my history, and access all features without memorizing URLs.

## How It Was Found

During end-to-end user journey testing, I walked through 5 realistic scenarios:
1. Navigated to `/stocks` — no link to portfolio page. Checked the full DOM snapshot — zero references to portfolio or leaderboard anywhere on the page.
2. Navigated to `/predict` — no link to create market or portfolio page. The only interactive elements are the market cards, search, and category filters.
3. Navigated to `/perps` — no link to portfolio or leaderboard page. The page only has trading pair buttons, chart, and order form.
4. Verified in code: `Header.tsx` only contains top-level section links. None of the three section pages (`stocks/page.tsx`, `predict/page.tsx`, `perps/page.tsx`) contain links to their sub-pages.

## Proposed UX

Add a section-level tab bar below the page header on each trading section:

**Stocks section** (`/stocks`, `/stocks/[ticker]`, `/stocks/portfolio`):
- Tab bar: `Markets | Portfolio`
- Appears on all stocks pages

**Predict section** (`/predict`, `/predict/[marketId]`, `/predict/portfolio`, `/predict/create`):
- Tab bar: `Markets | Portfolio | Create Market`
- Appears on all predict pages

**Perps section** (`/perps`, `/perps/portfolio`, `/perps/leaderboard`):
- Tab bar: `Trade | Portfolio | Leaderboard`
- Appears on all perps pages

Style: Horizontal tabs with an underline on the active tab, consistent with the existing tab style used within portfolio pages. Placed below the section title/header area.

## Acceptance Criteria

- [ ] Stocks pages show "Markets | Portfolio" tab bar; active tab highlighted
- [ ] Predict pages show "Markets | Portfolio | Create Market" tab bar; active tab highlighted
- [ ] Perps pages show "Trade | Portfolio | Leaderboard" tab bar; active tab highlighted
- [ ] Clicking each tab navigates to the correct sub-page
- [ ] Active tab is visually distinguished (underline/highlight)
- [ ] Tab bar is responsive and works on mobile
- [ ] Sub-pages remain accessible via direct URL

## Verification

- Navigate to each section and verify all sub-pages are reachable via tabs
- Verify tab active state updates correctly on each sub-page
- Run all tests

## Out of Scope

- Changing the main header navigation structure
- Adding new sub-pages that don't already exist
- Redesigning the page layouts themselves

## Research Notes

- The app uses Next.js App Router with page files in `frontend/src/app/<section>/page.tsx`
- Each section has a layout file pattern: stocks, predict, perps directories each contain sub-routes
- Next.js `layout.tsx` files are the ideal place to add shared sub-navigation, but currently none exist for stocks/predict/perps
- Existing tab styling pattern used in portfolio pages: `text-sm font-medium transition-colors` with `border-b-2 border-goodgreen` for active

## Architecture

```mermaid
graph TD
  A[SectionNav Component] --> B[Stocks Layout]
  A --> C[Predict Layout]
  A --> D[Perps Layout]
  B --> B1[/stocks - Markets]
  B --> B2[/stocks/portfolio - Portfolio]
  C --> C1[/predict - Markets]
  C --> C2[/predict/portfolio - Portfolio]
  C --> C3[/predict/create - Create]
  D --> D1[/perps - Trade]
  D --> D2[/perps/portfolio - Portfolio]
  D --> D3[/perps/leaderboard - Leaderboard]
```

## One-Week Decision

**YES** — This is a straightforward UI component task. Create one reusable `SectionNav` component and three layout files. ~1 day of work.

## Implementation Plan

1. Create a reusable `SectionNav` component that accepts tabs config and renders a horizontal tab bar with `usePathname()` for active state
2. Create `frontend/src/app/stocks/layout.tsx` with SectionNav for Markets | Portfolio
3. Create `frontend/src/app/predict/layout.tsx` with SectionNav for Markets | Portfolio | Create Market
4. Create `frontend/src/app/perps/layout.tsx` with SectionNav for Trade | Portfolio | Leaderboard
5. Remove redundant back-navigation links from sub-pages (portfolio pages have "< Back to ..." links that become redundant with tabs)
