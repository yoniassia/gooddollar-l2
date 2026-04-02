---
id: gooddollar-l2-per-route-error-boundaries
title: "Add Per-Route Error Boundaries and Chart Error Fallbacks"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

The app has a single global `error.tsx` at the root level. If any component in any route throws a runtime error (e.g., the TradingView chart on Perps, the ProbabilityChart on Predict detail, or any data-dependent component), the entire page shows a generic "Something Went Wrong" screen with no context. There are no per-route error boundaries and no component-level error fallbacks for dynamically loaded charts.

Additionally, the dynamically imported `PriceChart` and `ProbabilityChart` components have `loading` fallbacks but no error handling — if the dynamic import fails (network error, module not found), the page crashes.

## User Story

As a user browsing a complex page like Perps or Predict, I want individual sections to fail gracefully so that a chart loading error doesn't prevent me from seeing my positions, the order book, or placing trades.

## How It Was Found

During error-handling review of the codebase. Only one `error.tsx` exists at `frontend/src/app/error.tsx`. No per-route error boundaries in `/perps`, `/stocks`, `/predict`, or `/explore`. The `dynamic()` imports for `PriceChart` and `ProbabilityChart` specify `loading` but not error handling. Verified via `find` for `error.tsx` files and code inspection of dynamic imports.

## Proposed UX

- Each main route (`/perps`, `/stocks`, `/predict`, `/explore`) gets its own `error.tsx` with a route-specific message and a "Retry" button.
- Charts wrapped in `dynamic()` get an `onError` fallback that shows "Chart unavailable — click to retry" instead of crashing the page.
- The error boundaries should maintain the route's header/navigation context (section tabs like Trade/Portfolio/Leaderboard on Perps should still be visible).

## Acceptance Criteria

- [ ] `error.tsx` files exist for `/perps`, `/stocks`, `/predict`, and `/explore` routes.
- [ ] Each per-route error boundary shows a contextual message (e.g., "Unable to load trading terminal") with a "Try Again" button.
- [ ] Per-route error boundaries preserve the section navigation tabs (SectionNav) so users can still navigate within the section.
- [ ] Dynamically loaded chart components (`PriceChart`, `ProbabilityChart`) display an inline error state if the module fails to load, rather than crashing the page.
- [ ] The global `error.tsx` remains as a final fallback.
- [ ] All existing tests continue to pass.

## Verification

- Run full test suite: `npx vitest run`
- Verify per-route error files render correctly by temporarily adding `throw new Error('test')` to each route page.
- Verify chart error fallbacks by temporarily breaking the import path.

## Overview

Add per-route `error.tsx` files and wrap dynamically imported chart components with error fallbacks so that individual route or component failures don't take down the entire page.

## Research Notes

- Next.js App Router supports `error.tsx` at any route level — it wraps the route's `page.tsx` in a React Error Boundary.
- Existing route layouts (`perps/layout.tsx`, `stocks/layout.tsx`, `predict/layout.tsx`) render `SectionNav` tabs above `{children}` — the error boundary wraps only `{children}`, so tabs will be preserved.
- `explore/` has no layout file — the error boundary will still work but won't show section tabs.
- `dynamic()` from `next/dynamic` does NOT natively support error fallback. A wrapper component using `<Suspense>` + custom Error Boundary is needed, or a `React.Component` class-based ErrorBoundary wrapper.
- The `PriceChart` in perps uses `dynamic(() => import(...), { ssr: false, loading: ... })`.
- The `ProbabilityChart` in predict detail uses the same pattern.

## Architecture

```mermaid
graph TD
  A[Root layout] --> B[Global error.tsx]
  B --> C[/perps layout]
  C --> D[/perps/error.tsx]
  D --> E[PerpsPage]
  B --> F[/stocks layout]
  F --> G[/stocks/error.tsx]
  G --> H[StocksPage]
  B --> I[/predict layout]
  I --> J[/predict/error.tsx]
  J --> K[PredictPage]
  B --> L[/explore]
  L --> M[/explore/error.tsx]
  M --> N[ExplorePage]
  
  E --> O[ChartErrorBoundary wraps PriceChart]
  K --> P[ChartErrorBoundary wraps ProbabilityChart]
```

## One-Week Decision

**YES** — Creating 4 `error.tsx` files (each ~30 lines) and a reusable `ChartErrorBoundary` component (~40 lines). Estimated effort: 2-4 hours.

## Implementation Plan

1. Create a reusable `ChartErrorBoundary` component in `frontend/src/components/ChartErrorBoundary.tsx` — a class component that catches errors and shows an inline "Chart unavailable" state with a retry button.
2. Create `error.tsx` for `/perps` with message "Unable to load trading terminal".
3. Create `error.tsx` for `/stocks` with message "Unable to load stock data".
4. Create `error.tsx` for `/predict` with message "Unable to load prediction markets".
5. Create `error.tsx` for `/explore` with message "Unable to load token data".
6. Wrap `PriceChart` dynamic import in perps with `ChartErrorBoundary`.
7. Wrap `ProbabilityChart` dynamic import in predict detail with `ChartErrorBoundary`.
8. Add tests for `ChartErrorBoundary` rendering error and retry states.
9. Verify all existing tests pass.

## Out of Scope

- Adding error boundaries for every individual component.
- Real API error handling (the app uses mock data).
- Network connectivity indicators or offline mode.
