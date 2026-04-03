---
id: gooddollar-l2-mobile-header-wallet-button-overflow
title: "Mobile Header — Fix Connect Wallet Button Overflow and Clipping"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: false
---

## Problem Statement

On mobile viewports (375px width), the "Connect Wallet" button in the header overflows and clips at the right edge of the screen. The button text wraps onto two lines ("Connect" on the first line, "Wallet" on the second), causing the button to grow vertically and push against the viewport edge. This makes the header look broken and unprofessional on mobile devices.

## User Story

As a mobile user, I want the header to display correctly without clipped or overflowing buttons, so that the app looks polished and professional on my phone.

## How It Was Found

Visual review using agent-browser at 375x812 viewport. The "Connect Wallet" button was observed wrapping to two lines and being partially cut off at the right edge of the viewport. The header icons (portfolio, activity, hamburger menu) crowd together with the button.

## Proposed UX

- On mobile viewports (< 640px), abbreviate the wallet button text to a shorter label or use an icon-only button (e.g., a wallet icon without text)
- Ensure the header elements don't overflow on any viewport width down to 320px
- Maintain the full "Connect Wallet" text on desktop/tablet viewports (>= 640px)
- The button should remain tappable with adequate touch target size (min 44px)

## Acceptance Criteria

- [ ] On 375px viewport, the Connect Wallet button does NOT wrap text to two lines
- [ ] On 375px viewport, no header elements are clipped or overflow the viewport
- [ ] On 320px viewport, the header still renders correctly without overflow
- [ ] On desktop (1280px), the button still shows full "Connect Wallet" text
- [ ] The button maintains a minimum 44px tap target on mobile
- [ ] All existing Header tests pass

## Verification

- Run all tests: `npm test`
- Check in browser with agent-browser at 375px, 320px, and 1280px viewports

## Out of Scope

- Redesigning the entire header layout
- Adding new header features
- Wallet connection functionality changes
