---
id: uniswap-v4-hooks
title: "Uniswap V4 UBI Fee Hook"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: false
executed: false
---

## Overview

Fork Uniswap V4 core contracts and implement a custom hook that routes 33% of swap fees to the GoodDollar UBI pool. This is the first dApp on the GoodDollar L2 — GoodSwap — where every trade automatically funds universal basic income.

The hook intercepts swap fees via Uniswap V4's `afterSwap` callback, calculates the UBI share, and transfers it to the UBI fee splitter contract.

## Acceptance Criteria

- [ ] UBIFeeHook.sol implements Uniswap V4 `afterSwap` hook
- [ ] 33% of swap fees are routed to UBI pool via UBIFeeSplitter
- [ ] Hook is configurable: fee percentage can be adjusted by admin
- [ ] Comprehensive test suite covering:
  - Fee calculation accuracy
  - Fee routing to correct destinations
  - Edge cases (zero swaps, very small/large amounts)
  - Admin controls (fee adjustment, pause)
- [ ] All tests pass with `forge test`
- [ ] Deployed and verified on local anvil devnet
- [ ] Gas benchmarks: hook adds < 50k gas overhead per swap

## Out of Scope

- Full Uniswap V4 PoolManager deployment (use minimal interfaces)
- Frontend / UI (see 0003-goodswap-frontend)
- Liquidity provision UI
- Multi-hop routing
- Production deployment (testnet/mainnet)
