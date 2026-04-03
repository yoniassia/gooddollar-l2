---
id: gooddollar-l2-stock-portfolio-row-navigation
title: "Stock Portfolio — Make Holdings Rows Navigate to Stock Detail Page"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

On the Stock Portfolio page (`/stocks/portfolio`), clicking a holding row does nothing — it does not navigate to that stock's detail page. The row has `cursor:pointer` and an `onclick` handler but no navigation behavior. 

This contrasts with the Predict Portfolio page, where clicking a position row correctly navigates to the market detail page (e.g., `/predict/btc-100k-2025`). The inconsistency creates a dead-end in the "research a stock" user journey: a user checking their P&L naturally wants to click a holding to see the chart, key statistics, or trade more.

## User Story

As a user viewing my stock portfolio, I want to click on any holding row to navigate to that stock's detail page, so that I can quickly review its chart, key statistics, and place additional trades.

## How It Was Found

During UX flow testing (Journey: "User researches a stock and compares it"):
1. Navigated to `/stocks/portfolio`
2. Observed holding rows are marked `clickable [cursor:pointer, onclick]` in the accessibility tree
3. Clicked the AAPL row — URL remained at `/stocks/portfolio` (no navigation)
4. Compared with `/predict/portfolio` — positions there ARE clickable links that navigate to `/predict/[marketId]`

## Proposed UX

- Clicking anywhere on a stock portfolio holding row should navigate to `/stocks/[ticker]` (e.g., `/stocks/AAPL`)
- The row should use a Next.js `<Link>` or `router.push()` for client-side navigation
- Row hover styling should remain as-is (already has pointer cursor)
- Match the behavior of the Predict portfolio, which wraps each position as a `<link>` element

## Acceptance Criteria

- [ ] Clicking a holding row on `/stocks/portfolio` navigates to `/stocks/[ticker]`
- [ ] Navigation is client-side (no full page reload)
- [ ] All 4 stock holdings in the mock data are clickable and route correctly
- [ ] The predict portfolio's existing link behavior is NOT broken
- [ ] Verify in browser: click AAPL row → lands on `/stocks/AAPL` with chart and trade panel

## Verification

- Run full test suite
- Verify in browser with agent-browser

## Out of Scope

- Adding new visual hover effects beyond what exists
- Changing the portfolio data or layout
- Adding a "Trade" inline button to each portfolio row

## Planning

### Overview

The stock portfolio page at `/stocks/portfolio` has a `HoldingRow` component that accepts an `onClick` prop but it's currently set to `() => {}` (no-op). The fix is to use Next.js `useRouter` to navigate to `/stocks/[ticker]` on row click, matching the pattern used in the Predict portfolio which wraps each position in a `<Link>`.

### Research Notes

- The Predict portfolio (`/predict/portfolio`) wraps each position in a `<Link href={/predict/${pos.marketId}}>` — this is the model to follow
- The Stock portfolio uses a `<tr onClick={onClick}>` pattern but passes an empty handler
- Stock detail pages exist at `/stocks/[ticker]` and work correctly
- The `HoldingRow` component already has `cursor-pointer` styling

### Architecture Diagram

```mermaid
graph LR
  A[StocksPortfolioPage] -->|passes router.push| B[HoldingRow]
  B -->|onClick → router.push| C[/stocks/TICKER]
  C --> D[StockDetailPage]
```

### One-Week Decision

**YES** — This is a simple change to one file, approximately 10 minutes of work. Change the `onClick` callback from `() => {}` to `() => router.push(/stocks/${h.ticker})`.

### Implementation Plan

1. Import `useRouter` from `next/navigation` in the stock portfolio page
2. Get the router instance in `StocksPortfolioPage`
3. Change the `HoldingRow` `onClick` from `() => {}` to `() => router.push(/stocks/${h.ticker})`
4. Write a test verifying the navigation behavior
5. Verify in browser
