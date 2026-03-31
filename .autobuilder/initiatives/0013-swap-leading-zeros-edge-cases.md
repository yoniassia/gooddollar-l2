---
id: gooddollar-l2-fix-leading-zeros
title: "Swap Input Leading Zeros and Bare Decimal Edge Cases"
parent: gooddollar-l2
deps: [gooddollar-l2-fix-swap-validation]
split: false
depth: 1
planned: true
executed: false
---

## Problem Statement

The swap input field accepts and displays leading zeros (e.g., "007" renders as "007" instead of "7"). Additionally, a bare decimal point "." is accepted and displayed, which looks confusing. While these inputs compute correctly downstream via `parseFloat`, the visual display is unpolished and makes the app look broken compared to competitors like Uniswap, which normalize these inputs.

## User Story

As a DeFi user, I want the swap input field to automatically strip leading zeros and normalize bare decimals so that the amounts I enter look clean and correct.

## How It Was Found

Automated Playwright edge case testing with the following inputs:
- Typing "007" → displayed as "007" (should be "7")
- Typing "000123" → displayed as "000123" (should be "123")
- Typing "." → displayed as "." (should be "0." for clarity)
- Screenshot evidence saved to `.autobuilder/screenshots/edge-leading-zeros.png`

## Proposed UX

- After the user finishes typing or the input loses focus, leading zeros should be stripped (e.g., "007" → "7", "0042" → "42")
- Exception: "0." and "0.xxx" patterns should remain (user is typing a decimal)
- A bare "." should be allowed during typing but normalized to "0." on blur
- Sanitization should happen in the `sanitizeNumericInput` function in `frontend/src/lib/format.ts`

## Acceptance Criteria

- [ ] Typing "007" in the swap input displays "7" (leading zeros stripped in real-time)
- [ ] Typing "0042" displays "42"
- [ ] Typing "0.5" remains "0.5" (valid decimal preserved)
- [ ] Typing "00.5" displays "0.5"
- [ ] Typing "." during input is allowed; on blur it becomes "0."
- [ ] Existing tests continue to pass
- [ ] Manual verification via Playwright test

## Verification

- Run existing test suite
- Run Playwright edge case test to verify normalization

## Out of Scope

- Formatting input with thousand separators (different initiative)
- Max balance validation
- Slippage tolerance

---

## Planning

### Overview

Small bug fix to the `sanitizeNumericInput` function in `frontend/src/lib/format.ts`. The function currently strips non-numeric characters and handles multiple decimals, but does not normalize leading zeros or bare decimal points.

### Research Notes

- Uniswap's swap input normalizes leading zeros in real-time: typing "007" becomes "7"
- The fix is entirely within `sanitizeNumericInput()` — add leading zero stripping after existing sanitization
- Must preserve "0." pattern for decimal input (user typing "0.5")
- `parseFloat("007")` = 7 so calculations work fine, but the display is wrong

### Assumptions

- The fix should be real-time (on every keystroke), not just on blur
- "0" alone should remain "0" (not be stripped to empty)

### Architecture Diagram

```mermaid
graph LR
    A[User Input] --> B[sanitizeNumericInput]
    B --> C{Has leading zeros?}
    C -->|Yes, no dot| D[Strip to first non-zero]
    C -->|Yes, has dot| E[Normalize to 0.xxx]
    C -->|No| F[Return as-is]
    D --> G[Return sanitized]
    E --> G
    F --> G
```

### Size Estimation

- **New pages/routes:** 0
- **New UI components:** 0
- **API integrations:** 0
- **Complex interactions:** 0
- **Estimated lines of new code:** ~15

### One-Week Decision: YES

This is a trivial fix — about 15 lines of logic added to an existing utility function. It requires no new components, no API calls, and no complex interactions. Well under one day of work.

### Implementation Plan

**Day 1 (< 2 hours):**
1. Write test cases for `sanitizeNumericInput` covering leading zeros and bare decimals
2. Modify `sanitizeNumericInput` to strip leading zeros (preserving "0." pattern)
3. Verify all tests pass
4. Run Playwright edge case test to confirm fix
5. Commit
