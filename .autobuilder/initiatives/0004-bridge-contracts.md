---
id: bridge-contracts
title: "L1↔L2 Bridge Contracts"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: false
executed: false
---

## Overview

Implement L1↔L2 bridge contracts for G$, ETH, and USDC using the OP Stack StandardBridge pattern. This enables users to move assets between Ethereum L1 and GoodDollar L2. G$ uses a custom bridge that mints/burns on L2, while ETH and USDC use the standard lock/unlock pattern.

## Acceptance Criteria

- [ ] L1StandardBridge deployed on Sepolia with G$, ETH, USDC support
- [ ] L2StandardBridge deployed on GoodDollar L2 devnet
- [ ] G$ bridge: lock on L1 → mint on L2, burn on L2 → unlock on L1
- [ ] ETH bridge: native ETH deposit/withdraw
- [ ] USDC bridge: ERC20 lock/unlock pattern
- [ ] Deposit and withdrawal tests passing
- [ ] 7-day withdrawal challenge period (OP Stack default)
- [ ] Event emission for bridge monitoring
- [ ] Gas estimates documented

## Out of Scope

- Fast bridge (< 7 day withdrawals) — future Li.Fi integration
- Bridge UI (separate initiative)
- Cross-chain messaging beyond token transfers
- Third-party bridge integrations (Across, Hop, etc.)
