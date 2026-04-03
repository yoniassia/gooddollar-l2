---
id: gooddollar-l2-stocks-duplicate-sparkline-columns
title: "Stocks Page — Remove Duplicate Sparkline Column Doubling SVG Renders"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

The Stocks page (`/stocks`) renders **two identical `<Sparkline>` components** per row in `StockRow`. Lines 62–67 of `frontend/src/app/stocks/page.tsx` contain two `<td>` elements, both with `hidden lg:table-cell` and both rendering the same `<Sparkline data={stock.sparkline7d} positive={stock.change24h >= 0} />`. This doubles the SVG rendering work on large screens (24 SVGs instead of 12 for the full stock list). It also creates a redundant column in the table header (line 167 has an extra empty `<th>`).

## User Story

As a user browsing tokenized stocks on a large screen, I want only one sparkline chart per row so the page renders efficiently and the table layout is clean.

## How It Was Found

Code review during performance-focused product review. The stocks page source has two adjacent `<td>` blocks for sparklines — one at line 62 and another at line 65. The table header also has duplicate empty `<th>` tags at lines 166–167. Confirmed by reading the source code.

## Proposed UX

Each stock row should display exactly one sparkline column (the 7-day trend). The duplicate `<td>` and its corresponding `<th>` should be removed.

## Acceptance Criteria

- [ ] Each `StockRow` renders exactly one `<Sparkline>` component
- [ ] The table header has exactly one sparkline column header
- [ ] No visual regression — sparklines still appear on lg+ screens
- [ ] Build passes with no new warnings

## Verification

- Run `npm run build` — no errors
- Open `/stocks` in browser and confirm one sparkline per row on desktop

## Out of Scope

- Changing sparkline design or animation
- Adding new columns to the stocks table

## Planning

### Overview

Remove one of the two duplicate `<Sparkline>` `<td>` elements from `StockRow` and its corresponding `<th>` from the table header.

### Research Notes

- `StockRow` in `frontend/src/app/stocks/page.tsx` lines 62–67 has two `<td>` blocks rendering `<Sparkline>`, both hidden on small screens (`hidden lg:table-cell`).
- Table header lines 166–167 have two empty `<th>` blocks for sparkline columns.
- The `Sparkline` component is already memoized, but rendering two identical SVGs per row is wasteful.

### Architecture

Simple deletion — remove one `<td>` in `StockRow` and one `<th>` in the header. No new components or data flow changes.

### One-Week Decision

**YES** — This is a 5-minute fix (delete duplicate elements).

### Implementation Plan

1. In `StockRow`, remove the second `<td>` containing `<Sparkline>` (lines 65–67).
2. In the table `<thead>`, remove the duplicate empty `<th>` (line 167).
3. Verify build passes and sparklines still render correctly on lg screens.
