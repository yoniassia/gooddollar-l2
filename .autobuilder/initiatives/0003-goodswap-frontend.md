---
id: goodswap-frontend
title: "GoodSwap Frontend"
parent: gooddollar-l2
deps: [uniswap-v4-hooks]
split: null
depth: 1
planned: false
executed: false
---

## Overview

Build a basic swap UI (React/Next.js) that connects to the GoodSwap contracts deployed on GoodDollar L2. Users can select tokens, input amounts, see price impact, and see exactly how much of their swap fee funds UBI. The UBI contribution is a first-class UI element — not hidden in fine print.

## Acceptance Criteria

- [ ] Next.js app with TypeScript, Tailwind CSS
- [ ] Token selector supporting G$, ETH, USDC (expandable)
- [ ] Swap form with input/output amounts, price display
- [ ] UBI fee breakdown shown prominently: "X G$ funds UBI from this swap"
- [ ] Wallet connection via wagmi/viem (MetaMask, WalletConnect)
- [ ] Transaction status (pending, confirmed, failed)
- [ ] Responsive design (mobile-first)
- [ ] Deployed at goodswap.clawz.org

## Out of Scope

- Liquidity provision / pool creation UI
- Advanced trading features (limit orders, charts)
- Multi-chain support
- Token list management / CoinGecko integration
- Analytics dashboard
