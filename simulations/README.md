# GoodDollar Token Economics Simulator

A Python simulation modeling G$ economics at scale — finding the sweet spot where UBI becomes self-sustaining from protocol fees alone.

## Model Overview

The simulator models a circular economy where:

1. **UBI Minting** — New G$ are minted daily for each user (inflationary)
2. **Fee Revenue** — Protocol collects fees from DEX swaps, lending, and gas
3. **UBI Funding** — A percentage of fees is routed back to the UBI pool
4. **Token Burns** — A percentage of gas fees are burned (deflationary)
5. **Validator Rewards** — Stakers earn from block rewards + gas fee share

### Revenue Sources

| Source | Default | Description |
|--------|---------|-------------|
| DEX Fees | 0.3% on $10/user/day | Swap fees on decentralized exchange |
| Lending Fees | 5% APY on $5/user/day | Interest spread on lending protocol |
| Gas Fees | $0.001 × 3 tx/user/day | Transaction fees (50% burned) |

### Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `daily_ubi_mint` | 1.0 G$ | Tokens minted per person per day |
| `ubi_fee_pct` | 33% | Share of protocol fees → UBI pool |
| `daily_dex_volume_per_user` | $10 | Average DEX volume per user per day |
| `dex_fee_pct` | 0.3% | DEX swap fee rate |
| `daily_lending_per_user` | $5 | Average lending per user per day |
| `lending_apy` | 5% | Annual lending interest rate |
| `validator_stake_pct` | 10% | Percentage of supply staked |
| `validator_reward_pct` | 5% | Annual staking reward rate |
| `burn_rate` | 50% | Percentage of gas fees burned |
| `g_dollar_price` | $0.01 | G$ price in USD |
| `initial_supply` | 1B G$ | Starting token supply |

### Metrics Calculated

| Metric | What It Tells You |
|--------|-------------------|
| `annual_inflation_rate` | Gross supply growth from UBI minting |
| `net_inflation_rate` | Inflation minus burns |
| `ubi_value_per_day` | USD value of daily UBI (fees + minting) |
| `fee_pool_daily` | Total protocol fee revenue per day |
| `sustainability_ratio` | Fee revenue ÷ UBI cost (>1 = self-sustaining) |
| `validator_apr` | Actual validator return (rewards + gas share) |

## Running the Simulation

```bash
# Basic run
python3 simulations/token_sim.py

# Save output
python3 simulations/token_sim.py > simulations/results.md
```

## Experimenting with Parameters

Edit the `DEFAULTS` dict in `token_sim.py` to try different scenarios:

```python
# Optimistic DeFi adoption
DEFAULTS["daily_dex_volume_per_user"] = 50
DEFAULTS["daily_lending_per_user"] = 25

# Higher fee capture for UBI
DEFAULTS["ubi_fee_pct"] = 0.50

# Lower mint rate
DEFAULTS["daily_ubi_mint"] = 0.5
```

Or add new scenarios to the `sensitivity_analysis()` function.

## Key Findings

1. **Sustainability is per-user, not per-network** — scaling users doesn't help if per-user economics are underwater (linear scaling means more users = more fees AND more UBI cost)

2. **DEX volume is king** — The single biggest lever. At $10/user/day with 0.3% fees, the system is already marginally sustainable (1.11x ratio)

3. **Break-even at ~$10 DEX volume/user/day** — With default parameters, this is where fee revenue covers UBI minting cost

4. **Three paths to strong sustainability:**
   - Increase per-user DEX volume (most impactful)
   - Increase UBI fee share above 33%
   - Lower G$ price (cheaper UBI to fund per user)

5. **Validator economics scale dangerously** — At 100M+ users, validator APR becomes unrealistically high, suggesting the reward model needs dynamic adjustment

## Visualizations

Generate charts:

```bash
pip install -r simulations/requirements.txt
python3 simulations/visualize.py
```

Charts saved to `simulations/charts/`:

- **ubi_per_person_by_scale.png** — UBI value per person across 1M–1B users
- **fee_breakdown_by_scale.png** — Fee pool composition (DEX, lending, gas)
- **sustainability_vs_dex_volume.png** — Break-even analysis varying DEX volume
- **sensitivity_heatmap.png** — 2D heatmap: DEX volume × UBI fee share
- **inflation_vs_sustainability.png** — Trade-off between UBI amount and inflation

## Architecture

```
simulations/
├── token_sim.py       # Main simulation engine
├── visualize.py       # Chart generation (matplotlib)
├── results.md         # Latest simulation output
├── requirements.txt   # Python dependencies
├── charts/            # Generated PNG charts
└── README.md          # This file
```
