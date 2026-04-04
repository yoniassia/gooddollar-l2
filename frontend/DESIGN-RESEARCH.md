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

## Component Library Plan
Build in `/components/ui/` following shadcn/ui patterns:
- [ ] Button (variants: default, outline, ghost, destructive, link)
- [ ] Card (with header, content, footer)
- [ ] Input (with label, error state, icon prefix)
- [ ] Badge (variants: default, success, warning, error)
- [ ] Dialog (Radix-based, with animations)
- [ ] Toast (Radix-based, stacking)
- [ ] Tabs (Radix-based, with animated indicator)
- [ ] Dropdown Menu (Radix-based)
- [ ] Tooltip (Radix-based)
- [ ] Skeleton (loading states)
- [ ] Chart wrapper (for DeFi data viz)

## Research Log
<!-- Frontend Engineer adds findings here each heartbeat -->
