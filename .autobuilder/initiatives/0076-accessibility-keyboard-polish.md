---
id: gooddollar-l2-accessibility-keyboard-polish
title: "Accessibility — Fix aria-labels, Keyboard Navigation, and Focus Indicators"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem Statement

Code review of initiatives 0072-0075 found several accessibility and keyboard navigation gaps in recently shipped components:

1. **Predict card `role="link"` divs** only handle `Enter` key, not `Space` (which is required for button/link keyboard activation per WCAG 2.1)
2. **YES/NO trade buttons** (0074) have no `aria-label` — screen readers only see "Yes 32¢" with no indication of the action being performed
3. **Sparkline charts** are `aria-hidden="true"` but the table cell has no text alternative for the trend direction
4. **Dark theme focus indicators** are missing `focus-visible` ring styling on interactive elements (cards, buttons, table rows), making keyboard navigation invisible

## User Story

As a keyboard/screen reader user browsing GoodPredict markets or the Explore token table, I want clearly labeled interactive elements and visible focus indicators so I can navigate and trade without using a mouse.

## Acceptance Criteria

- [ ] Predict market cards: `onKeyDown` handles both `Enter` and `Space`; `role="link"` → `role="button"` or use actual `<a>` tag
- [ ] YES/NO trade buttons: `aria-label="Buy YES at 32¢"` and `aria-label="Buy NO at 68¢"` (include price in label)
- [ ] Sparkline table cells: add `aria-label` with trend direction, e.g. `aria-label="7-day trend: up 2.3%"`
- [ ] Add `focus-visible:ring-2 focus-visible:ring-white/30` (or `ring-green-400/50` for positive elements) to all interactive elements that currently lack focus rings: predict market cards, explore table rows, trade buttons, token selector items
- [ ] Run react-doctor score ≥ 75 after changes

## Out of Scope

- Full WCAG 2.1 AA audit (too broad)
- ARIA live regions for real-time price updates
- Screen reader testing on all pages

## Size Estimation

- **New components:** 0
- **Modified files:** ~3 (predict/page.tsx, explore/page.tsx, Sparkline.tsx)
- **Estimated LOC:** ~50-80 (targeted attribute additions and class updates)
- **One-week decision:** YES (low complexity, targeted fixes)
