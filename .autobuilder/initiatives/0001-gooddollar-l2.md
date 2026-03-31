---
id: gooddollar-l2
title: "GoodDollar L2 — The UBI Chain"
parent: null
deps: []
split: null
depth: 0
planned: false
executed: false
---

## Overview

Build an OP Stack L2 chain optimized for UBI distribution. Core contracts are implemented (G$ token, UBI claims, fee splitter, validator staking). Remaining work: OP Stack chain deployment, bridge contracts, block explorer, and the dApp ecosystem.

## Acceptance Criteria

### Chain Infrastructure
- [ ] OP Stack devnet running locally (sequencer + batcher + proposer)
- [ ] G$ token deployed as native L2 asset
- [ ] UBI claim contract processing 1000 claims/minute
- [ ] Fee splitter routing dApp fees to UBI pool
- [ ] Validator staking accepting G$ deposits
- [ ] L1 bridge contracts deployed on Sepolia
- [ ] Blockscout explorer running

### First dApp: GoodSwap
- [ ] Uniswap V4 contracts forked and deployed on L2
- [ ] UBI fee hook: 33% of swap fees → UBI pool
- [ ] Swap UI deployed at goodswap.goodclaw.org
- [ ] G$/ETH and G$/USDC pools seeded

### Token Economics Verified
- [ ] Simulation showing sustainable UBI at 1M users
- [ ] Fee split tested end-to-end (swap → fee splitter → UBI pool → claim)
- [ ] Validator reward calculations correct
