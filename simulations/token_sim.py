#!/usr/bin/env python3
"""
GoodDollar Token Economics Simulator
=====================================
Models G$ economics at scale across different user counts.
Identifies the sweet spot where UBI becomes self-sustaining from protocol fees.
"""

import math

# ─── Default Parameters ───────────────────────────────────────────────────────

DEFAULTS = {
    "daily_ubi_mint": 1.0,           # G$ minted per person per day
    "ubi_fee_pct": 0.33,             # 33% of all dApp fees → UBI pool
    "daily_dex_volume_per_user": 10,  # $ volume per user per day on DEX
    "dex_fee_pct": 0.003,            # 0.3% DEX swap fee
    "daily_lending_per_user": 5,      # $ lent per user per day
    "lending_apy": 0.05,             # 5% annual lending rate
    "validator_stake_pct": 0.10,     # 10% of supply staked
    "validator_reward_pct": 0.05,    # 5% annual validator reward
    "burn_rate": 0.50,              # 50% of gas fees burned
    "g_dollar_price": 0.01,         # Starting G$ price in USD
    "initial_supply": 1_000_000_000, # Initial G$ supply (1B)
    "gas_fee_per_tx": 0.001,        # $ gas fee per transaction
    "txs_per_user_per_day": 3,      # avg transactions per user per day
}

USER_SCALES = [1_000_000, 10_000_000, 100_000_000, 1_000_000_000]


def simulate(num_users: int, params: dict = None) -> dict:
    """Run simulation for a given user count and parameter set."""
    p = {**DEFAULTS, **(params or {})}

    # ─── Supply & Minting ─────────────────────────────────────────────
    daily_ubi_total = num_users * p["daily_ubi_mint"]           # G$ minted/day
    annual_ubi_minted = daily_ubi_total * 365                    # G$ minted/year
    annual_inflation_rate = annual_ubi_minted / p["initial_supply"]

    # ─── Fee Revenue ──────────────────────────────────────────────────
    # DEX fees
    daily_dex_volume = num_users * p["daily_dex_volume_per_user"]
    daily_dex_fees = daily_dex_volume * p["dex_fee_pct"]

    # Lending fees (protocol takes a spread on lending interest)
    total_lending_volume = num_users * p["daily_lending_per_user"]
    # Daily interest earned by protocol (annualized rate / 365)
    daily_lending_fees = total_lending_volume * (p["lending_apy"] / 365)

    # Gas/transaction fees
    daily_tx_count = num_users * p["txs_per_user_per_day"]
    daily_gas_fees = daily_tx_count * p["gas_fee_per_tx"]

    # Total fee pool
    fee_pool_daily = daily_dex_fees + daily_lending_fees + daily_gas_fees

    # ─── UBI Funding ──────────────────────────────────────────────────
    # UBI funded from: fee redistribution + new minting
    ubi_from_fees_daily = fee_pool_daily * p["ubi_fee_pct"]      # USD
    ubi_from_minting_daily = daily_ubi_total * p["g_dollar_price"]  # USD
    ubi_value_per_day = ubi_from_fees_daily + ubi_from_minting_daily  # total USD
    ubi_per_person_usd = ubi_value_per_day / num_users if num_users else 0

    # ─── Sustainability ───────────────────────────────────────────────
    # Cost of UBI = value of newly minted G$ (dilution cost)
    ubi_cost_daily = ubi_from_minting_daily  # USD cost of inflation
    sustainability_ratio = ubi_from_fees_daily / ubi_cost_daily if ubi_cost_daily > 0 else float('inf')

    # ─── Burns ────────────────────────────────────────────────────────
    daily_burned_usd = daily_gas_fees * p["burn_rate"]
    annual_burned_usd = daily_burned_usd * 365
    annual_burned_g = annual_burned_usd / p["g_dollar_price"] if p["g_dollar_price"] > 0 else 0
    net_inflation_rate = (annual_ubi_minted - annual_burned_g) / p["initial_supply"]

    # ─── Validator Economics ──────────────────────────────────────────
    staked_supply = p["initial_supply"] * p["validator_stake_pct"]
    annual_validator_rewards = staked_supply * p["validator_reward_pct"]
    # Validators also earn from non-burned gas fees
    annual_validator_gas_share = daily_gas_fees * (1 - p["burn_rate"]) * 365
    validator_apr = (
        (annual_validator_rewards * p["g_dollar_price"] + annual_validator_gas_share)
        / (staked_supply * p["g_dollar_price"])
    ) if staked_supply > 0 else 0

    # ─── Time to Sustainability ───────────────────────────────────────
    # Find user count where fee revenue covers UBI cost
    # fee_from_users * ubi_fee_pct >= users * daily_ubi_mint * g_dollar_price
    # Per-user daily fee contribution to UBI:
    per_user_fee_to_ubi = (
        p["daily_dex_volume_per_user"] * p["dex_fee_pct"]
        + p["daily_lending_per_user"] * (p["lending_apy"] / 365)
        + p["txs_per_user_per_day"] * p["gas_fee_per_tx"]
    ) * p["ubi_fee_pct"]
    per_user_ubi_cost = p["daily_ubi_mint"] * p["g_dollar_price"]

    if per_user_fee_to_ubi >= per_user_ubi_cost:
        time_to_sustainability = "Already sustainable"
    else:
        # With more users, per-user economics stay the same (linear scaling)
        # Sustainability depends on per-user ratio, not total users
        # It's sustainable when fee_to_ubi >= ubi_cost per user
        # Need to increase volume or fees, not just users
        deficit_per_user = per_user_ubi_cost - per_user_fee_to_ubi
        # How much more volume per user needed?
        extra_volume_needed = deficit_per_user / (p["dex_fee_pct"] * p["ubi_fee_pct"])
        time_to_sustainability = f"Need ${p['daily_dex_volume_per_user'] + extra_volume_needed:.1f}/user DEX vol"

    return {
        "num_users": num_users,
        "annual_inflation_rate": annual_inflation_rate,
        "net_inflation_rate": net_inflation_rate,
        "ubi_value_per_day_total": ubi_value_per_day,
        "ubi_per_person_usd": ubi_per_person_usd,
        "fee_pool_daily": fee_pool_daily,
        "ubi_from_fees_daily": ubi_from_fees_daily,
        "ubi_from_minting_daily": ubi_from_minting_daily,
        "sustainability_ratio": sustainability_ratio,
        "time_to_sustainability": time_to_sustainability,
        "validator_apr": validator_apr,
        "daily_dex_fees": daily_dex_fees,
        "daily_lending_fees": daily_lending_fees,
        "daily_gas_fees": daily_gas_fees,
        "daily_burned_usd": daily_burned_usd,
        "per_user_fee_to_ubi": per_user_fee_to_ubi,
        "per_user_ubi_cost": per_user_ubi_cost,
    }


def fmt_usd(val):
    """Format USD values with appropriate scale."""
    if val >= 1_000_000_000:
        return f"${val/1e9:.2f}B"
    if val >= 1_000_000:
        return f"${val/1e6:.2f}M"
    if val >= 1_000:
        return f"${val/1e3:.1f}K"
    return f"${val:.2f}"


def fmt_pct(val):
    return f"{val*100:.1f}%"


def fmt_users(val):
    if val >= 1_000_000_000:
        return f"{val/1e9:.0f}B"
    if val >= 1_000_000:
        return f"{val/1e6:.0f}M"
    if val >= 1_000:
        return f"{val/1e3:.0f}K"
    return str(val)


def print_results(results: list[dict]):
    """Print a clean comparison table."""
    print("=" * 100)
    print("GoodDollar Token Economics Simulation")
    print("=" * 100)
    print()

    # Parameters
    print("─── Parameters ─────────────────────────────────────────────────")
    print(f"  G$ Price: ${DEFAULTS['g_dollar_price']}")
    print(f"  Initial Supply: {fmt_users(DEFAULTS['initial_supply'])} G$")
    print(f"  Daily UBI Mint: {DEFAULTS['daily_ubi_mint']} G$/person/day")
    print(f"  UBI Fee Pool %: {DEFAULTS['ubi_fee_pct']*100:.0f}%")
    print(f"  DEX Volume/User: ${DEFAULTS['daily_dex_volume_per_user']}/day")
    print(f"  DEX Fee: {DEFAULTS['dex_fee_pct']*100:.1f}%")
    print(f"  Lending/User: ${DEFAULTS['daily_lending_per_user']}/day @ {DEFAULTS['lending_apy']*100:.0f}% APY")
    print(f"  Validator Stake: {DEFAULTS['validator_stake_pct']*100:.0f}% @ {DEFAULTS['validator_reward_pct']*100:.0f}% reward")
    print(f"  Gas Burn Rate: {DEFAULTS['burn_rate']*100:.0f}%")
    print()

    # Main comparison table
    header = f"{'Metric':<32} " + " ".join(f"{'│ ' + fmt_users(r['num_users']):>16}" for r in results)
    print("─── Results by User Scale ──────────────────────────────────────")
    print(header)
    print("─" * len(header))

    rows = [
        ("Annual Inflation (gross)", "annual_inflation_rate", fmt_pct),
        ("Annual Inflation (net of burn)", "net_inflation_rate", fmt_pct),
        ("Daily Fee Pool (total)", "fee_pool_daily", fmt_usd),
        ("  ├─ DEX Fees", "daily_dex_fees", fmt_usd),
        ("  ├─ Lending Fees", "daily_lending_fees", fmt_usd),
        ("  └─ Gas Fees", "daily_gas_fees", fmt_usd),
        ("Daily UBI Value (total)", "ubi_value_per_day_total", fmt_usd),
        ("  ├─ From Fees", "ubi_from_fees_daily", fmt_usd),
        ("  └─ From Minting", "ubi_from_minting_daily", fmt_usd),
        ("UBI per Person/Day", "ubi_per_person_usd", fmt_usd),
        ("Daily Burns", "daily_burned_usd", fmt_usd),
        ("Sustainability Ratio", "sustainability_ratio", lambda v: f"{v:.2f}x"),
        ("Validator APR", "validator_apr", fmt_pct),
    ]

    for label, key, fmt in rows:
        vals = " ".join(f"{'│ ' + fmt(r[key]):>16}" for r in results)
        print(f"{label:<32} {vals}")

    print()
    print("─── Sustainability Analysis ────────────────────────────────────")
    print()
    print(f"  Per-user daily fee contribution to UBI: ${results[0]['per_user_fee_to_ubi']:.6f}")
    print(f"  Per-user daily UBI cost (minting):      ${results[0]['per_user_ubi_cost']:.6f}")
    print()

    if results[0]['per_user_fee_to_ubi'] >= results[0]['per_user_ubi_cost']:
        print("  ✅ UBI is ALREADY self-sustaining from fees alone!")
    else:
        ratio = results[0]['per_user_fee_to_ubi'] / results[0]['per_user_ubi_cost']
        print(f"  ⚠️  Fees cover {ratio*100:.1f}% of UBI cost per user.")
        print(f"  📊 Sustainability path: {results[0]['time_to_sustainability']}")
        print()
        # Explore what parameters make it sustainable
        print("  ─── Paths to Sustainability ───")
        explore_sustainability()


def explore_sustainability():
    """Find parameter combinations that achieve sustainability."""
    base = DEFAULTS.copy()

    # Path 1: Increase DEX volume
    for vol in [10, 20, 30, 50, 75, 100]:
        p = {**base, "daily_dex_volume_per_user": vol}
        r = simulate(1_000_000, p)
        if r["sustainability_ratio"] >= 1.0:
            print(f"  ✅ DEX volume ${vol}/user/day → ratio {r['sustainability_ratio']:.2f}x")
            break
        else:
            print(f"     DEX volume ${vol}/user/day → ratio {r['sustainability_ratio']:.2f}x")

    print()

    # Path 2: Increase UBI fee %
    for pct in [0.33, 0.50, 0.66, 0.80, 1.00]:
        p = {**base, "ubi_fee_pct": pct}
        r = simulate(1_000_000, p)
        if r["sustainability_ratio"] >= 1.0:
            print(f"  ✅ UBI fee share {pct*100:.0f}% → ratio {r['sustainability_ratio']:.2f}x")
            break
        else:
            print(f"     UBI fee share {pct*100:.0f}% → ratio {r['sustainability_ratio']:.2f}x")

    print()

    # Path 3: Lower G$ price (cheaper UBI to fund)
    for price in [0.01, 0.005, 0.001, 0.0005]:
        p = {**base, "g_dollar_price": price}
        r = simulate(1_000_000, p)
        if r["sustainability_ratio"] >= 1.0:
            print(f"  ✅ G$ price ${price} → ratio {r['sustainability_ratio']:.2f}x")
            break
        else:
            print(f"     G$ price ${price} → ratio {r['sustainability_ratio']:.2f}x")

    print()

    # Path 4: Combined optimistic scenario
    optimistic = {
        **base,
        "daily_dex_volume_per_user": 25,
        "ubi_fee_pct": 0.50,
        "daily_lending_per_user": 10,
        "txs_per_user_per_day": 5,
    }
    r = simulate(1_000_000, optimistic)
    print(f"  🚀 Optimistic combo (DEX $25, 50% fee share, $10 lending, 5 tx/day)")
    print(f"     → ratio {r['sustainability_ratio']:.2f}x, UBI/person: ${r['ubi_per_person_usd']:.4f}/day")


def sensitivity_analysis():
    """Run sensitivity on key parameters."""
    print()
    print("=" * 100)
    print("Sensitivity Analysis (100M users)")
    print("=" * 100)
    print()

    base_result = simulate(100_000_000)
    print(f"  Base case sustainability ratio: {base_result['sustainability_ratio']:.2f}x")
    print()

    # Vary each parameter independently
    sensitivities = [
        ("DEX Vol/User", "daily_dex_volume_per_user", [5, 10, 25, 50, 100]),
        ("DEX Fee %", "dex_fee_pct", [0.001, 0.003, 0.005, 0.01]),
        ("UBI Fee Share", "ubi_fee_pct", [0.20, 0.33, 0.50, 0.75, 1.00]),
        ("UBI Mint/Day", "daily_ubi_mint", [0.1, 0.5, 1.0, 2.0, 5.0]),
        ("G$ Price", "g_dollar_price", [0.001, 0.005, 0.01, 0.05, 0.10]),
        ("Lending/User", "daily_lending_per_user", [1, 5, 10, 25, 50]),
        ("Txs/User/Day", "txs_per_user_per_day", [1, 3, 5, 10, 20]),
    ]

    for label, param, values in sensitivities:
        print(f"  {label}:")
        for v in values:
            p = {**DEFAULTS, param: v}
            r = simulate(100_000_000, p)
            marker = "✅" if r["sustainability_ratio"] >= 1.0 else "  "
            display_v = f"{v*100:.1f}%" if isinstance(v, float) and v < 1 and param.endswith("pct") else f"${v}" if param.startswith("daily_") or param == "g_dollar_price" else str(v)
            print(f"    {marker} {display_v:>10} → ratio {r['sustainability_ratio']:.2f}x | UBI ${r['ubi_per_person_usd']:.6f}/person/day | inflation {r['net_inflation_rate']*100:.1f}%")
        print()


def main():
    # Run base simulation across user scales
    results = [simulate(n) for n in USER_SCALES]
    print_results(results)
    sensitivity_analysis()

    # Print sweet spot summary
    print()
    print("=" * 100)
    print("KEY FINDINGS")
    print("=" * 100)
    print()
    print("  1. With current parameters, UBI sustainability is independent of user count")
    print("     (linear scaling: more users = more fees AND more UBI cost)")
    print()
    print("  2. The critical lever is per-user economic activity:")
    print(f"     - Current: ${DEFAULTS['daily_dex_volume_per_user']} DEX vol + ${DEFAULTS['daily_lending_per_user']} lending/user/day")
    
    # Find break-even DEX volume
    for vol in range(10, 200):
        p = {**DEFAULTS, "daily_dex_volume_per_user": vol}
        r = simulate(1_000_000, p)
        if r["sustainability_ratio"] >= 1.0:
            print(f"     - Break-even: ${vol} DEX volume/user/day (with current fee structure)")
            break
    
    print()
    print("  3. Most impactful levers (in order):")
    print("     a) DEX volume per user (drives bulk of fees)")
    print("     b) UBI fee share % (how much fees fund UBI)")
    print("     c) G$ price (lower price = cheaper UBI to fund)")
    print("     d) Transaction frequency (gas fee revenue)")
    print()
    print("  4. Validator APR is attractive at 5%+ with gas fee sharing")
    print()


if __name__ == "__main__":
    main()
