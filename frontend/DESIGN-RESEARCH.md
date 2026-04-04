# Design Research — GoodDollar Frontend

## Reference UIs to Study
- **Uniswap** (app.uniswap.org) — swap interface, token selector, settings panel
- **Aave** (app.aave.com) — lending dashboard, health factor visualization
- **Hyperliquid** (app.hyperliquid.xyz) — perps trading, order book, PnL display
- **Lido** (stake.lido.fi) — staking flow, APY display, withdrawal queue
- **Polymarket** (polymarket.com) — prediction markets, outcome cards, portfolio
- **Linear** (linear.app) — clean UI patterns, keyboard shortcuts, animations
- **Vercel** (vercel.com) — dashboard design, deployment cards, analytics

## Design Tokens (to implement)
- Font: Geist (installed)
- Colors: Dark theme primary, match GoodDollar brand green (#00B0FF → #00C853)
- Spacing: 4px grid system
- Border radius: 8px (cards), 12px (modals), 9999px (pills)
- Shadows: subtle, layered (not flat)

## Component Library Status (GOO-318 ✅)
Built in `/components/ui/` — Radix + CVA + tailwind-merge:
- [x] Button (6 variants: default/secondary/outline/ghost/destructive/link, 5 sizes)
- [x] Card (with CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [x] Input (themed, focus ring, disabled state)
- [x] Badge (6 variants: default/secondary/outline/destructive/warning/success)
- [x] Dialog (Radix, overlay blur, X button, fade+zoom animation)
- [x] Tabs (Radix, muted list, active card highlight)
- [x] Tooltip (Radix portal, animated fade-in per side)
- [x] Skeleton (animate-pulse, muted bg)
- [x] DropdownMenu (full Radix, checkbox/radio items, separators)
- [ ] Toast (Radix Toast — queued for next iteration)
- [ ] Chart wrapper (DeFi data viz — queued)

## Design Tokens (GOO-319 ✅)
- **Font:** Geist Sans + Geist Mono — configured in `layout.tsx` + `tailwind.config.ts`
- **Theme system:** next-themes with `darkMode: 'class'`; HSL CSS variables in `globals.css`
- **Colors:** CSS-variable tokens: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`
- **Radius:** `--radius-sm` (4px) → `--radius-xl` (16px) via Tailwind
- **Shadows:** layered HSL shadows via `--shadow` variable

## Research Log

### 2026-04-04 — DeFi UI Patterns: Swap Interfaces

**Uniswap V4 — Key Patterns:**
- **Directional swap arrow button**: A centered swap-direction toggle sits between "you pay" and "you receive" cards. It's interactive, rotates on click with a smooth CSS transform. Keeps the UI compact and scannable.
- **Token selector as a pill button**: Token name + logo + chevron in a rounded pill inside the input card. Clicking opens a full-height modal with search. Pattern: token selection is a first-class interaction, not an afterthought.
- **Input card hierarchy**: Each side of a swap has: token selector (top-left), amount input (top-right), USD value (bottom-right), balance (bottom-left). The hierarchy guides the eye exactly where action is needed.
- **Price impact warning**: Inline below the submit button with color coding — green (<0.05%), yellow (0.05–3%), red (>3%). Never a modal.
- **Compact settings**: Slippage/deadline behind a gear icon, opens as a floating panel (not a drawer). Keeps the main card clean.

**Aave V3 — Key Patterns:**
- **Health factor ring gauge**: A circular arc gauge with color zones (green/yellow/red). Shows liquidation risk at a glance. The number is large, the ring is decorative but deeply informative.
- **Collateral toggle**: A simple switch (not a button) to enable/disable collateral. The pattern makes state clear — on/off binary choice.
- **Supply/Borrow split layout**: The dashboard uses a two-column split: "Your supplies" left, "Your borrows" right. Each has a small APY badge inline with the asset row. Scannable at a glance.
- **Modal-first flows**: All deposit/withdraw/borrow/repay actions open in a modal with a progress stepper (Approve → Confirm). Never navigates away. Reduces context switching.
- **Numeric formatting**: Large numbers use abbreviated suffixes ($1.23M, $456K). APYs shown to 2 decimal places. Balances show 4-6 significant figures.

**Hyperliquid — Key Patterns:**
- **Dense information layout**: Order book, chart, position panel, order form all visible simultaneously. Desktop-first, but the vertical stacking on mobile works because each section has a clear header + collapse option.
- **Order type tabs**: Market / Limit / Stop as tab switcher at the top of the order form. Tab state persists in URL query param.
- **PnL color coding**: Positive PnL is always green, negative always red — both in text and background tints. Never ambiguous.
- **Quantity input with leverage slider**: Framer-style range slider below the size input. Shows effective position size + margin used in real time as you drag.
- **Tick-based number inputs**: Up/down arrows on quantity inputs snap to the asset's tick size. Prevents invalid orders at the UI layer.

**Lido — Key Patterns:**
- **Single-action landing**: The entire staking flow is a single card above the fold. No distractions. One metric (current APR) is shown prominently.
- **Withdrawal queue visualization**: A progress bar showing "your position in queue" with estimated wait time. Makes an async process feel concrete.
- **wstETH/stETH toggle**: Two tabs at the top of the stake card to switch between token variants. Keeps the card clean vs. having two separate pages.

**Polymarket — Key Patterns:**
- **Outcome cards as primary navigation**: Markets are displayed as cards with the question as the title, current probability as a large number, and buy buttons for YES/NO directly on the card. Enables action without drilling into detail.
- **Probability sparkline**: A mini chart on each market card showing the probability over the last 24h. Adds data density without requiring interaction.
- **Portfolio as a flat list**: Holdings shown as a simple table: market question | outcome | shares | current value | PnL. Sortable columns. No fancy charts needed.

### Key Cross-Protocol Micro-interaction Patterns

1. **Button press feedback**: All DeFi UIs use `scale(0.97)` on active state for submit buttons. CSS: `active:scale-[0.97] transition-transform`.
2. **Skeleton loading**: Token lists, price data, and balance displays all use skeleton screens (not spinners). Width matches expected content width.
3. **Number counter animations**: Balance/price updates use a brief counter animation (0.3s ease-out from old value to new). Framer Motion's `useSpring` is ideal.
4. **Error shake**: Invalid inputs shake horizontally (±4px, 3 cycles, 0.3s total). `framer-motion` keyframes work well.
5. **Toast notifications**: Transaction states (pending → confirmed → failed) use stacking toast notifications in the bottom-right corner.
6. **Focus states**: All DeFi UIs have highly visible focus rings (2px, brand color, 2px offset) — accessibility is table stakes for finance apps.
7. **Hover card elevation**: Cards subtly lift on hover (`translateY(-1px)`, shadow increase). Signals interactivity.

### Actionable TODOs for GoodDollar

- [ ] Add `active:scale-[0.97]` to Button default and CTA variants
- [ ] Implement Framer Motion number counter for balance/price displays (useMotionValue + animate)
- [ ] Add Toast component using Radix Toast primitive (GOO-318 follow-up)
- [ ] Add error shake animation to swap inputs on validation failure
- [ ] Replace spinner loading states with Skeleton components in all data-fetched lists
- [ ] Add hover lift effect (`group-hover:translate-y-[-1px]`) to clickable cards in Explore/Markets
