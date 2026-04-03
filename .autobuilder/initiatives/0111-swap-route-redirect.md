---
id: gooddollar-l2-swap-route-redirect
title: "Swap Route — Add /swap Page That Renders the Swap Interface"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

Navigating directly to `/swap` in the browser returns a 404 "Page Not Found" error. The header nav "Swap" link correctly points to `/`, where the swap card lives, but every major DEX (Uniswap, 1inch, SushiSwap) has a dedicated `/swap` route. Users who bookmark, share, or type `/swap` directly hit a broken page, wasting a full page load on a 404.

## User Story

As a DeFi user, I want to navigate to `/swap` and land on the swap interface, so that shared links and bookmarks work as expected.

## How It Was Found

During performance & loading review: navigated to `http://localhost:3100/swap` in agent-browser, observed 404 page. Confirmed no `frontend/src/app/swap/page.tsx` exists. The nav link uses `href="/"` which is correct, but the `/swap` URL path is broken.

## Proposed UX

- `/swap` should render the same swap interface shown on the homepage (`/`).
- Two options (prefer Option A for simplicity):
  - **Option A:** Create a Next.js `redirect()` in `app/swap/page.tsx` that redirects to `/`.
  - **Option B:** Create a dedicated `app/swap/page.tsx` that renders just the `SwapCard` component (without the landing page hero/below-fold content).
- The "Swap" nav link should remain pointing to `/` (or be updated to `/swap` if Option B is chosen).

## Acceptance Criteria

- [ ] Navigating to `/swap` does NOT show a 404
- [ ] The swap interface is accessible at `/swap`
- [ ] No duplicate content issues (redirect is fine)
- [ ] Nav link "Swap" still highlights correctly when on the swap page
- [ ] All existing tests pass

## Verification

- Navigate to `http://localhost:3100/swap` — should see swap interface or redirect to `/`
- Click "Swap" in nav — should navigate correctly
- Run `npm test` — all tests pass

## Out of Scope

- Changing the homepage layout
- Adding new swap features
- Modifying the SwapCard component

## Planning

### Overview

Add a `/swap` route to the Next.js App Router so that direct navigation to `/swap` works instead of showing a 404. Use Next.js `redirect()` for zero-maintenance simplicity.

### Research Notes

- Next.js App Router supports `redirect()` from `next/navigation` in server components
- Alternative: use `next.config.js` `redirects()` for build-time redirects (308 status)
- Simplest approach: create `app/swap/page.tsx` that calls `redirect('/')`
- The Header nav link already uses `href="/"` for Swap — update to `/swap` so the URL bar shows the canonical swap path
- Need to update `isSwap` check in Header to also match `/swap`

### Architecture

```mermaid
graph LR
    A[User visits /swap] --> B[app/swap/page.tsx]
    B -->|redirect| C[/ homepage with SwapCard]
    D[Nav Swap link] -->|href=/| C
```

### One-Week Decision

**YES** — This is a 15-minute task. Create one file, update one nav link check.

### Implementation Plan

1. Create `frontend/src/app/swap/page.tsx` with `redirect('/')` 
2. Update the `isSwap` check in Header to also match `pathname === '/swap'`
3. Verify `/swap` redirects properly and nav highlighting works
