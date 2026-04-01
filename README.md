# GoodDollar L2 — The UBI Chain

> An OP Stack L2 where every transaction funds universal basic income for verified humans.

🌐 **Live:** [goodswap.goodclaw.org](https://goodswap.goodclaw.org)

## What Is This?

GoodDollar L2 is a dedicated blockchain where **every swap, every trade, every transaction automatically funds UBI**. Built on OP Stack (Optimism rollup), with G$ as the native gas token.

The first dApp — **GoodSwap** — is a DEX where 33% of every swap fee goes directly to the GoodDollar UBI pool. No opt-in. No charity toggle. It's baked into the protocol.

## 🤖 Built Entirely by AI

This entire project was built by an autonomous AI build loop ([autobuilder](https://github.com/yoniassia/gooddollar-l2/tree/main/.autobuilder)) — **59 commits, 45 initiatives, 15 iterations, ~7 hours, zero human code.**

The autobuilder runs a continuous cycle: **Review → Plan → Execute → Repeat**, using Cursor with Claude Opus to build, test, and ship features autonomously.

## What's Built

### Smart Contracts (Solidity / Foundry)
- **G$ Token** — ERC-20 with UBI minting capabilities
- **UBI Claims** — Daily claim contract (gas-free for claimers)
- **UBI Fee Splitter** — Routes 33% of all dApp fees to the UBI pool
- **Validator Staking** — Stake G$ to run infrastructure, earn rewards
- **Uniswap V4 UBI Fee Hook** — Every swap auto-funds UBI at the protocol level
- **Bridge Contracts** — L1↔L2 bridge for G$, ETH, USDC
- **Token Economics Simulation** — Modeling sustainable UBI distribution
- **OP Stack Genesis Config** — Chain configuration and rollup setup

### GoodSwap DEX Frontend (Next.js 14 + wagmi + RainbowKit)
- Swap interface with 18 tokens (ETH, G$, USDC, WBTC, DAI, etc.)
- Token explorer with prices, 24h change, volume, market cap
- Full-screen token selector with search & quick-select
- Swap review & confirmation modal
- High price impact warnings
- Slippage settings with real-time clamping
- USD fiat equivalents on all amounts
- Recent activity panel with localStorage persistence
- Landing page — "Swap. Fund UBI." hero + How It Works
- Impact stats ($2.4M UBI distributed, 640K+ claimers)
- Mobile responsive with hamburger nav
- Keyboard accessible
- Performance optimized (lazy loading, memoization)
- Custom 404 + error boundary

## Architecture

```
GoodDollar L2 (OP Stack)
├── src/                    # Solidity contracts (Foundry)
│   ├── GToken.sol          # G$ token
│   ├── UBIClaims.sol       # Daily UBI claims
│   ├── UBIFeeSplitter.sol  # Fee routing to UBI pool
│   ├── ValidatorStaking.sol
│   ├── UBIFeeHook.sol      # Uniswap V4 hook
│   └── ...
├── frontend/               # GoodSwap DEX (Next.js)
│   └── src/
│       ├── app/            # Pages (swap, explore, bridge, pool)
│       ├── components/     # UI components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities, constants, types
├── script/                 # Deploy scripts
├── test/                   # Contract tests
├── op-stack/               # OP Stack configuration
└── .autobuilder/           # AI build loop state
    ├── scope.md            # Project vision
    ├── initiatives/        # 45 feature PRDs
    └── status.md           # Current build status
```

## Token Economics

| Flow | Split |
|------|-------|
| dApp fees → UBI pool | 33% |
| dApp fees → Protocol | 17% |
| dApp fees → dApp developer | 50% |
| Validator staking minimum | 1M G$ |
| Validator rewards | 5% annual |
| Target inflation | 5-8% (decreasing) |

## The Vision

**Phase 1** ✅ — Core contracts + GoodSwap DEX
**Phase 2** 🔜 — GoodLend (Aave fork), GoodBridge (Li.Fi), GoodPerps, GoodPredict
**Phase 3** — GoodStake, GoodNames (.good domains), GoodNFT, GoodDAO, GoodPay
**Phase 4** — Celestia DA, decentralized sequencer, 1B daily claim capacity

Every major DeFi primitive, cloned and improved, with fees routing to UBI. The goal: **make every on-chain action fund universal basic income.**

## About GoodDollar

[GoodDollar](https://gooddollar.org) is a UBI protocol founded by Yoni Assia in 2018. 640K+ registered users receive daily G$ distributions. GoodDollar L2 is the next evolution — a dedicated chain where the entire DeFi economy funds UBI by default.

## Links

- 🌐 [GoodSwap Live Demo](https://goodswap.goodclaw.org)
- 📖 [GoodDollar Protocol](https://gooddollar.org)
- 📊 [GoodDollar Dashboard](https://dashboard.gooddollar.org)
- 🏗️ [Autobuilder](https://github.com/yoniassia/gooddollar-l2/tree/main/.autobuilder)

## License

MIT
