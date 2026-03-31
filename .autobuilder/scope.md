# GoodDollar L2 — Scope

## Vision
The UBI Chain. An OP Stack L2 where every transaction funds universal basic income for verified humans. Every major Ethereum dApp cloned, improved by AI agents, with fees routing to UBI.

## Target Users
1. **Claimers** — 640K+ existing GoodDollar users → billions
2. **DeFi users** — anyone who wants their DeFi activity to fund UBI
3. **Validators** — stake G$ to run infrastructure, earn rewards
4. **Developers** — build dApps where fees automatically fund UBI
5. **AI Agents** — autonomous trading/arbitrage agents that pay fees → UBI

## Core Features (Must Have)

### Phase 1: Chain Infrastructure
- [ ] OP Stack L2 deployment (testnet → mainnet)
- [ ] G$ as native gas token
- [ ] Daily UBI claim contract (gas-free for claimers)
- [ ] Identity/proof-of-personhood registry
- [ ] UBI fee splitter (all dApp fees → % to UBI pool)
- [ ] Validator staking contract
- [ ] Bridge: Ethereum ↔ GoodDollar L2 (G$, ETH, USDC)
- [ ] Block explorer (Blockscout)

### Phase 2: Core dApps
- [ ] GoodSwap — Uniswap V4 fork with UBI fee hooks
- [ ] GoodLend — Aave V3 fork with UBI fee hooks
- [ ] GoodBridge — Cross-chain bridge (Li.Fi integration)
- [ ] GoodPerps — Perpetual futures exchange
- [ ] GoodPredict — Prediction markets (Polymarket fork)

### Phase 3: Ecosystem
- [ ] GoodStake — Liquid staking for G$
- [ ] GoodNames — ENS fork (.good domains)
- [ ] GoodNFT — NFT marketplace with UBI royalties
- [ ] GoodDAO — On-chain governance
- [ ] GoodPay — Merchant payment rails

### Phase 4: Scale
- [ ] Celestia DA integration (cheaper data availability)
- [ ] Decentralized sequencer (sequencer auction)
- [ ] Batch claims (1000 claims per L1 tx)
- [ ] 1B daily claim capacity

## Architecture
- **Stack:** OP Stack (Optimism rollup)
- **DA:** Ethereum L1 (Phase 1), Celestia (Phase 4)
- **Contracts:** Solidity, Foundry toolchain
- **Block time:** 1 second
- **Gas token:** G$
- **Chain ID:** TBD (register on chainlist)

## Token Economics
- Every dApp fee: 33% → UBI pool, 17% → protocol, 50% → dApp
- Validators: stake 1M G$ minimum, earn 5% annual rewards
- Slashing: misbehavior → slashed G$ goes to UBI pool
- Daily UBI: base mint + share of fee pool
- Target inflation: 5-8% annually (decreasing)

## Non-Goals
- Building a new consensus mechanism (use OP Stack as-is for Phase 1-3)
- Mobile wallet (Good Wallet V2 handles that)
- Marketing/growth (separate workstream)

## Success Metrics
- L2 testnet live with all Phase 1 contracts
- GoodSwap processing swaps with UBI fee routing
- 1000 claims/minute throughput on testnet
- Gas cost < $0.0001 per claim
