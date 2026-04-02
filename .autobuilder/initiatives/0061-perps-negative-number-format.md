---
id: gooddollar-l2-fix-perps-negative-number-format
title: "Fix Perps formatPerpsPrice Negative Number Formatting"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

The `formatPerpsPrice` function in `frontend/src/lib/perpsData.ts` uses raw value comparisons (`price >= 1000`, `price >= 1`, `price >= 0.01`) without taking the absolute value. When a negative number like `-8.06` is passed, it fails all threshold checks (since -8.06 < 0.01) and falls through to `toFixed(6)`, displaying as "$-8.060000" instead of the expected "$-8.06".

This bug is visible on the Perps Portfolio page where the "Net Funding" stat card shows "$-8.060000" with 6 unnecessary decimal places while every other value on the page uses 2 decimal places.

## User Story

As a perps trader checking my portfolio, I want all dollar amounts to be consistently formatted so that the interface looks professional and values are easy to read.

## How It Was Found

During user journey testing of the perps portfolio page (`/perps/portfolio`), the "Net Funding" stat card displayed "$-8.060000". Visual inspection confirmed all other stats on the same page show 2 decimal places. Code review of `formatPerpsPrice` confirmed it doesn't handle negative numbers — the threshold comparisons all fail for negative values.

## Proposed UX

The Net Funding value should display as "$-8.06" (2 decimal places), consistent with all other USD values on the page. Fix `formatPerpsPrice` to use `Math.abs(price)` for threshold comparison while preserving the sign in the output.

## Acceptance Criteria

- [ ] `formatPerpsPrice(-8.06)` returns `"$-8.06"` (not `"$-8.060000"`)
- [ ] `formatPerpsPrice(-0.05)` returns `"$-0.0500"` (4 decimals for small values)
- [ ] `formatPerpsPrice(-1500)` returns `"$-1,500.00"` (comma-formatted)
- [ ] Existing positive number formatting unchanged
- [ ] Net Funding on perps portfolio displays with correct decimal places
- [ ] All tests pass

## Verification

- Open `/perps/portfolio` and verify Net Funding shows "$-8.06"
- Run all tests

## Out of Scope

- Changing the formatting rules (threshold values)
- Formatting in other parts of the app

## Research Notes

- Bug is in `frontend/src/lib/perpsData.ts` line 164-169
- `formatPerpsPrice` compares raw `price` value against thresholds, but negative numbers fail all checks
- Fix: use `Math.abs(price)` for threshold comparisons, preserve sign in output
- Single-line fix with a `const abs = Math.abs(price)` at the top

## One-Week Decision

**YES** — One-line fix in a single file. ~15 minutes of work.

## Implementation Plan

1. Add `const abs = Math.abs(price)` at top of `formatPerpsPrice`
2. Replace `price` with `abs` in all threshold comparisons
3. Keep the sign by using `price` (not `abs`) in the formatting output
