---
id: token-economics-sim
title: "G$ Token Economics Simulation"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: false
executed: false
---

## Overview

Python simulation of GoodDollar tokenomics at different user scales (1M, 100M, 1B users). Model the interplay between supply expansion (UBI minting), demand drivers (swap fees, staking, DeFi usage), UBI value per person, and inflation rates. Answer the critical question: at what scale does UBI become meaningful, and what fee volume is needed to sustain it?

## Acceptance Criteria

- [ ] Python simulation with configurable parameters
- [ ] Models: daily UBI minting, fee-based UBI pool, staking lockup
- [ ] Scenarios: 1M, 10M, 100M, 1B verified users
- [ ] Fee volume models: conservative, moderate, aggressive
- [ ] Output metrics: G$ price stability, UBI value (USD equiv), inflation rate, pool sustainability
- [ ] Visualizations: charts showing supply/demand curves, UBI value over time
- [ ] Sensitivity analysis: which parameters matter most?
- [ ] Written report with recommendations for fee split ratios
- [ ] Jupyter notebook or standalone Python scripts

## Out of Scope

- Agent-based modeling (individual user behavior)
- MEV simulation
- Cross-chain arbitrage modeling
- Real market data backtesting
- Formal economic paper / peer review
