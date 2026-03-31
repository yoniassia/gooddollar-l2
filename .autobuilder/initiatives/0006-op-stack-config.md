---
id: op-stack-config
title: "OP Stack Chain Configuration"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: false
executed: false
---

## Overview

Configure the OP Stack chain for GoodDollar L2: genesis file with pre-deployed contracts (G$ token, UBI claims, fee splitter, validator staking), rollup configuration, and a docker-compose devnet for local development. This is the infrastructure foundation — once running, all other initiatives deploy on top.

## Acceptance Criteria

- [ ] Genesis file with pre-deployed GoodDollar contracts
- [ ] G$ configured as native gas token (custom gas oracle)
- [ ] Rollup config: 1-second block time, appropriate gas limits
- [ ] Chain ID registered / chosen
- [ ] docker-compose.yml with: op-geth (sequencer), op-node (rollup node), op-batcher, op-proposer
- [ ] L1 contracts (OptimismPortal, L1CrossDomainMessenger) deploy script for Sepolia
- [ ] Devnet boots and produces blocks within 60 seconds
- [ ] Basic smoke test: deploy contract, send transaction, verify on L2
- [ ] Documentation: README with setup instructions

## Out of Scope

- Production deployment (mainnet)
- Decentralized sequencer
- Celestia DA integration (Phase 4)
- Blockscout explorer setup (separate task)
- Monitoring / alerting infrastructure
