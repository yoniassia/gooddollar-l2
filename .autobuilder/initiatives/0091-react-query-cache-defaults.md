---
id: gooddollar-l2-react-query-cache-defaults
title: "Configure React Query Caching Defaults to Prevent Unnecessary Refetches"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

In `Providers.tsx`, the `QueryClient` is instantiated with no configuration: `new QueryClient()`. This means `staleTime` defaults to 0 (data is immediately stale) and `refetchOnWindowFocus` defaults to true. When the app connects to real APIs, every component mount and every window focus event will trigger redundant network requests — an API waterfall that degrades perceived performance and wastes bandwidth. Competing DeFi apps (Uniswap, dYdX) configure aggressive caching to keep the UI snappy.

## User Story

As a trader switching between tabs and navigating between pages, I want token prices and market data to remain cached for a reasonable duration so that pages feel instant rather than refetching on every navigation.

## How It Was Found

Code review during performance-focused product review. The `QueryClient` in `frontend/src/components/Providers.tsx` is instantiated at line 21 with `new QueryClient()` — no `defaultOptions` are set.

## Proposed UX

Configure sensible caching defaults on the QueryClient:
- `staleTime: 30_000` (30 seconds — data stays fresh for 30s, preventing refetch storms)
- `gcTime: 5 * 60_000` (5 minutes — keep unused data in cache for 5 minutes)
- `refetchOnWindowFocus: false` (prevent refetch on every tab switch — markets can tolerate 30s staleness)
- `retry: 2` (retry failed queries twice before showing error)

## Acceptance Criteria

- [ ] `QueryClient` is configured with `defaultOptions.queries` including `staleTime`, `gcTime`, `refetchOnWindowFocus`, and `retry`
- [ ] Build passes with no new warnings
- [ ] Existing functionality unchanged (all pages render correctly)
- [ ] No test regressions

## Verification

- Run `npm run build` — no errors
- Run tests — no regressions
- Open app in browser — all pages render normally

## Out of Scope

- Per-query cache configuration
- Adding real API calls
- Service worker caching

## Planning

### Overview

Add `defaultOptions.queries` to the `QueryClient` instantiation in `Providers.tsx` to set sensible caching defaults.

### Research Notes

- React Query v5 defaults: `staleTime: 0`, `gcTime: 300000` (5 min), `refetchOnWindowFocus: true`, `retry: 3`.
- The `staleTime: 0` default means every component mount triggers a refetch, which for a trading app causes perceived lag.
- Best practice for DeFi apps: 15–60s staleTime (prices change but 30s cache is acceptable), disable `refetchOnWindowFocus` to avoid sudden data flashes.

### Architecture

Single-file change in `frontend/src/components/Providers.tsx`. No new components or data flow changes.

### One-Week Decision

**YES** — Single line change (~5 minutes).

### Implementation Plan

1. Update `QueryClient` instantiation to include `defaultOptions`:
   ```ts
   new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 30_000,
         gcTime: 5 * 60_000,
         refetchOnWindowFocus: false,
         retry: 2,
       },
     },
   })
   ```
2. Verify build passes and all pages render correctly.
3. Run tests to confirm no regressions.
