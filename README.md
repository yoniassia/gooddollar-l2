# GoodDollar L2 — The UBI Chain

> An OP Stack L2 where every transaction funds universal basic income for verified humans.

🌐 **Live Demo:** [goodclaw.org](https://goodclaw.org) · **GoodSwap:** [goodswap.goodclaw.org](https://goodswap.goodclaw.org) · **Dashboard:** [paperclip.goodclaw.org](https://paperclip.goodclaw.org)

---

## 📦 Version Status


| Component | Version | Status |
|-----------|---------|--------|
| **GoodDollar L2** (root) | `0.1.0` | 🟢 Active |
| Frontend (GoodSwap) | `0.1.0` | 🟢 Live |
| SDK | `0.1.0` | 🟢 Published |
| Backend — Activity Reporter | `0.1.0` | 🟢 Running |
| Backend — Bridge Keeper | `0.1.0` | 🟢 Running |
| Backend — Harvest Keeper | `0.1.0` | 🟢 Running |
| Backend — Indexer | `0.1.0` | 🟢 Running |
| Backend — Liquidator | `0.1.0` | 🟢 Running |
| Backend — Monitor | `0.1.0` | 🟢 Running |
| Backend — Perps | `0.1.0` | 🟢 Running |
| Backend — Predict | `0.1.0` | 🟢 Running |
| Backend — Revenue Tracker | `0.1.0` | 🟢 Running |
| Backend — Rpc Balancer | `0.1.0` | 🟢 Running |
| Backend — Stocks Keeper | `1.0.0` | 🟢 Running |
| Backend — Swap Oracle | `1.0.0` | 🟢 Running |


> *Auto-updated by DevOps Engineer agent. Last sync: 2026-04-04*

---

## What Is This?

GoodDollar L2 is a dedicated blockchain where **every swap, every trade, every transaction automatically funds UBI**. Built on OP Stack (Optimism rollup), with G$ as the native gas token.

No opt-in. No charity toggle. UBI is baked into every protocol-level interaction.

---

## 🤖 Built Entirely by AI Agents

This entire project — **152 commits, 109 initiatives, 3,200 lines of Solidity, 108 frontend files** — was built by an autonomous AI agent team managed through [Paperclip](https://paperclip.goodclaw.org).

**The Agent Team (25 agents):**

| Role | Agent | What They Build |
|------|-------|-----------------|
| 🧠 Coordinator | GoodClaw | Product decisions, agent orchestration |
| 🔧 Protocol Engineer | Claude Code | Smart contracts, security audits, gas optimization |
| 🎨 Frontend Engineer | Claude Code | UI/UX, dApp interfaces, responsive design |
| 💰 Wallet Engineer | Claude Code | Wallet integration, MPC, transaction flows |
| 🛡️ Security Engineer | Claude Code | Audits, vulnerability detection, hardening |
| 🧪 QA Engineer | Claude Code | Test suites, fuzz testing, regression |
| ⚙️ DevOps Engineer | Claude Code | CI/CD, deployment, infrastructure |
| 📦 Product Manager | Claude Code | PRDs, specs, acceptance criteria |
| 📈 CMO + Marketing Team | Claude Code | Growth, content, social, partnerships |
| 🔬 Researcher | Claude Code | Tokenomics, protocol analysis, MEV |

**The Autobuilder Loop:**
```
Scout → Research → Build → Validate → Deploy → Measure → Repeat (24/7)
```

Hourly heartbeats. Agents pick up issues, write code + tests, commit, and report. Zero human code.

---

## 📦 What's Built

### Core Smart Contracts (16 contracts, 3,200 lines of Solidity)

| Contract | Description | Tests |
|----------|-------------|-------|
| `GoodDollarToken.sol` | G$ ERC-20 with daily UBI claims, identity-gated minting | ✅ |
| `UBIFeeSplitter.sol` | Universal fee router: 33% UBI / 17% protocol / 50% dApp | ✅ |
| `ValidatorStaking.sol` | Stake 1M G$ to validate, 5% APR, slashing → UBI pool | ✅ |
| `UBIFeeHook.sol` | Uniswap V4 `afterSwap` hook — 33% of every swap fee → UBI | ✅ |
| `GoodDollarBridgeL1.sol` | L1 bridge: deposit G$, ETH, USDC with peer-configured guard | ✅ |
| `GoodDollarBridgeL2.sol` | L2 bridge: withdraw G$, ETH, USDC with peer-configured guard | ✅ |

#### GoodStocks — Tokenized Stocks
| Contract | Description |
|----------|-------------|
| `SyntheticAssetFactory.sol` | Create synthetic stock tokens (sAAPL, sTSLA, etc.) |
| `SyntheticAsset.sol` | ERC-20 synthetic asset backed by collateral |
| `CollateralVault.sol` | Deposit collateral, mint synthetics, liquidation engine |
| `PriceOracle.sol` | Chainlink-style price feeds for stock prices |

#### GoodPredict — Prediction Markets
| Contract | Description |
|----------|-------------|
| `MarketFactory.sol` | Create/resolve binary prediction markets |
| `ConditionalTokens.sol` | ERC-1155 outcome tokens (YES/NO positions) |

#### GoodPerps — Perpetual Futures
| Contract | Description |
|----------|-------------|
| `PerpEngine.sol` | Order matching, margin, PnL, fee routing to UBI |
| `MarginVault.sol` | Isolated margin accounts with flush-to-splitter |
| `FundingRate.sol` | Time-weighted funding rate calculation |

**All contracts include UBI fee routing** — every trade, every liquidation, every fee flows through `UBIFeeSplitter.splitFee()` which distributes 33% to the UBI pool.

### Test Suite: 205+ Foundry Tests

```
test/
├── GoodDollarToken.t.sol     # Token minting, claims, identity
├── UBIFeeHook.t.sol          # Uniswap V4 hook integration
├── ValidatorStaking.t.sol     # Staking, rewards, slashing
├── GoodDollarBridge.t.sol     # L1↔L2 bridge, peer guards
├── perps/GoodPerps.t.sol      # Perp trading, margin, liquidation
├── predict/GoodPredict.t.sol  # Market creation, resolution, redemption
└── stocks/GoodStocks.t.sol    # Synthetic minting, collateral, liquidation
```

---

### Frontend dApps (108 files, Next.js 14 + wagmi + RainbowKit)

#### 🔄 GoodSwap DEX
- Swap interface with 18 tokens (ETH, G$, USDC, WBTC, DAI, etc.)
- Token explorer with prices, 24h change, volume, market cap
- Token detail pages with full-screen charts
- Swap review modal with fee breakdown
- Price impact warnings + slippage settings
- USD fiat equivalents on all amounts
- Recent activity panel (localStorage)

#### 📈 GoodStocks — Tokenized Stock Trading
- Stock listing page with real-time prices
- Individual stock detail pages with company descriptions
- Trading panel (long/short with collateral)
- Portfolio view with open positions

#### 🔮 GoodPredict — Prediction Markets
- Market listing with category filters + thumbnail icons
- Probability trend sparklines on market cards
- Individual market pages with YES/NO trading
- Market creation wizard
- Portfolio tracking

#### 📊 GoodPerps — Perpetual Futures
- Trading interface with order book + recent trades
- Candlestick charts (TradingView lightweight-charts)
- Leaderboard page
- Position management + portfolio

#### 🌍 Cross-Platform Features
- Cross-product navigation (Explore ↔ Stocks ↔ Perps ↔ Predict)
- UBI impact banner across all pages
- Persistent UBI impact stats (hero section)
- Wallet connection with RainbowKit
- Connect-wallet empty states
- Mobile responsive with hamburger nav
- Keyboard accessible
- Custom 404 + error boundaries
- Loading skeletons on all pages

---

### Infrastructure

| Component | Status |
|-----------|--------|
| OP Stack genesis + rollup config | ✅ Ready |
| Devnet docker-compose (sequencer + batcher + proposer) | ✅ Ready |
| L1↔L2 Bridge (G$, ETH, USDC) | ✅ Contracts done |
| Foundry deploy scripts | ✅ Ready |
| Token economics simulation + visualizations | ✅ Complete |
| GoodSwap frontend at goodswap.goodclaw.org | ✅ Live |
| Paperclip agent dashboard at paperclip.goodclaw.org | ✅ Live |
| Autobuilder landing page at goodclaw.org | ✅ Live |

---

## 📐 Architecture

```
GoodDollar L2 (OP Stack)
│
├── src/                          # Solidity contracts (Foundry)
│   ├── GoodDollarToken.sol       # G$ token with UBI claims
│   ├── UBIFeeSplitter.sol        # 33/17/50 fee routing
│   ├── ValidatorStaking.sol      # Proof-of-stake with UBI slashing
│   ├── hooks/
│   │   └── UBIFeeHook.sol        # Uniswap V4 afterSwap hook
│   ├── bridge/
│   │   ├── GoodDollarBridgeL1.sol
│   │   └── GoodDollarBridgeL2.sol
│   ├── stocks/                   # GoodStocks (tokenized equities)
│   │   ├── SyntheticAssetFactory.sol
│   │   ├── SyntheticAsset.sol
│   │   ├── CollateralVault.sol
│   │   └── PriceOracle.sol
│   ├── predict/                  # GoodPredict (prediction markets)
│   │   ├── MarketFactory.sol
│   │   └── ConditionalTokens.sol
│   └── perps/                    # GoodPerps (perpetual futures)
│       ├── PerpEngine.sol
│       ├── MarginVault.sol
│       └── FundingRate.sol
│
├── test/                         # 205+ Foundry tests
│
├── frontend/                     # Next.js 14 + wagmi + RainbowKit
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing + swap
│       │   ├── explore/          # Token explorer + detail pages
│       │   ├── stocks/           # GoodStocks trading UI
│       │   ├── predict/          # GoodPredict markets
│       │   ├── perps/            # GoodPerps trading
│       │   ├── portfolio/        # Portfolio overview
│       │   ├── bridge/           # Bridge UI
│       │   └── pool/             # Liquidity pools
│       ├── components/           # 35+ reusable components
│       └── lib/                  # Data layers, utils, wagmi config
│
├── script/                       # Foundry deploy scripts
├── op-stack/                     # OP Stack chain config
│
└── .autobuilder/                 # AI build loop
    ├── scope.md                  # Project vision & phases
    └── initiatives/              # 109 feature specs (PRDs)
```

---

## 💰 Token Economics

| Flow | Split |
|------|-------|
| Every dApp fee → UBI pool | **33%** |
| Every dApp fee → Protocol treasury | 17% |
| Every dApp fee → dApp developer | 50% |
| Validator staking minimum | 1M G$ |
| Validator annual rewards | 5% APR |
| Slashed validator funds → | UBI pool |

**At scale:**
| Users | Daily Fee Pool | UBI Multiplier |
|-------|---------------|----------------|
| 1M | $33,000/day | 1.11x (self-sustaining ✓) |
| 100M | $3.3M/day | Significant supplemental income |
| 1B | $33.7M/day | $0.033/day base + pool share |

---

## 🗺️ Roadmap

| Phase | Status | What |
|-------|--------|------|
| **Phase 1** | ✅ Done | Core contracts + GoodSwap DEX |
| **Phase 2** | ✅ Done | GoodStocks + GoodPredict + GoodPerps contracts & UIs |
| **Phase 3** | 🔜 Next | Testnet deployment, bridge go-live, E2E testing |
| **Phase 4** | 📋 Planned | GoodLend (Aave fork), GoodStake, GoodNames (.good domains) |
| **Phase 5** | 📋 Planned | Celestia DA, decentralized sequencer, 1B claim capacity |

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🌐 AutoBuilder Dashboard | [goodclaw.org](https://goodclaw.org) |
| 🔄 GoodSwap Live | [goodswap.goodclaw.org](https://goodswap.goodclaw.org) |
| 📊 Agent Dashboard (Paperclip) | [paperclip.goodclaw.org](https://paperclip.goodclaw.org) |
| 📖 GoodDollar Protocol | [gooddollar.org](https://gooddollar.org) |
| 📈 GoodDollar Stats | [dashboard.gooddollar.org](https://dashboard.gooddollar.org) |
| 🏗️ Autobuilder Initiatives | [GitHub](https://github.com/yoniassia/gooddollar-l2/tree/main/.autobuilder) |

---

## About GoodDollar

[GoodDollar](https://gooddollar.org) is a UBI protocol founded by **Yoni Assia** in 2018. 640K+ registered users receive daily G$ distributions. GoodDollar L2 is the next evolution — a dedicated chain where the entire DeFi economy funds UBI by default.

The vision: **every on-chain action funds universal basic income.** Every swap. Every trade. Every liquidation. Every fee. All flowing to verified humans worldwide.

---

## License

MIT
