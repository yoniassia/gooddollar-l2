#!/usr/bin/env python3
"""
GoodDollar Token Economics Visualizations
==========================================
Generates charts from the token economics simulation.
Run: python visualize.py
Output: charts/ directory with PNG files
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from token_sim import simulate, DEFAULTS, USER_SCALES

CHARTS_DIR = os.path.join(os.path.dirname(__file__), "charts")
COLORS = {
    "green": "#00B0A0",
    "dark": "#1a1a2e",
    "accent": "#16213e",
    "orange": "#e94560",
    "blue": "#0f3460",
    "light": "#f5f5f5",
    "gold": "#f0a500",
}


def setup_style():
    plt.rcParams.update({
        "figure.facecolor": COLORS["dark"],
        "axes.facecolor": COLORS["accent"],
        "axes.edgecolor": COLORS["light"],
        "axes.labelcolor": COLORS["light"],
        "text.color": COLORS["light"],
        "xtick.color": COLORS["light"],
        "ytick.color": COLORS["light"],
        "grid.color": "#333355",
        "grid.alpha": 0.5,
        "font.size": 11,
        "figure.dpi": 150,
    })


def fmt_users(val):
    if val >= 1e9: return f"{val/1e9:.0f}B"
    if val >= 1e6: return f"{val/1e6:.0f}M"
    if val >= 1e3: return f"{val/1e3:.0f}K"
    return str(int(val))


def chart_ubi_by_scale():
    """Bar chart: UBI value per person across user scales."""
    results = [simulate(n) for n in USER_SCALES]
    labels = [fmt_users(r["num_users"]) for r in results]
    ubi_from_fees = [r["ubi_from_fees_daily"] / r["num_users"] for r in results]
    ubi_from_mint = [r["ubi_from_minting_daily"] / r["num_users"] for r in results]

    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(labels))
    width = 0.4

    ax.bar(x, ubi_from_mint, width, label="From Minting", color=COLORS["green"], alpha=0.9)
    ax.bar(x, ubi_from_fees, width, bottom=ubi_from_mint, label="From Fees", color=COLORS["gold"], alpha=0.9)

    ax.set_xlabel("Verified Users")
    ax.set_ylabel("UBI per Person ($/day)")
    ax.set_title("Daily UBI Value per Person by User Scale", fontsize=14, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend(loc="upper left")
    ax.grid(axis="y")

    for i, r in enumerate(results):
        total = r["ubi_per_person_usd"]
        ax.annotate(f"${total:.4f}", (i, total + 0.0005), ha="center", fontsize=9, color=COLORS["light"])

    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "ubi_per_person_by_scale.png"))
    plt.close(fig)
    print("  -> ubi_per_person_by_scale.png")


def chart_fee_breakdown():
    """Stacked bar: fee sources across user scales."""
    results = [simulate(n) for n in USER_SCALES]
    labels = [fmt_users(r["num_users"]) for r in results]
    dex = [r["daily_dex_fees"] for r in results]
    lending = [r["daily_lending_fees"] for r in results]
    gas = [r["daily_gas_fees"] for r in results]

    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(labels))
    width = 0.5

    ax.bar(x, dex, width, label="DEX Fees", color=COLORS["green"])
    ax.bar(x, lending, width, bottom=dex, label="Lending Fees", color=COLORS["gold"])
    ax.bar(x, gas, width, bottom=[d + l for d, l in zip(dex, lending)], label="Gas Fees", color=COLORS["orange"])

    ax.set_xlabel("Verified Users")
    ax.set_ylabel("Daily Fee Pool ($)")
    ax.set_title("Daily Fee Pool Breakdown by User Scale", fontsize=14, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend()
    ax.grid(axis="y")

    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "fee_breakdown_by_scale.png"))
    plt.close(fig)
    print("  -> fee_breakdown_by_scale.png")


def chart_sustainability_dex_volume():
    """Line chart: sustainability ratio as DEX volume varies."""
    volumes = list(range(1, 101))
    ratios = []
    ubi_vals = []
    for v in volumes:
        r = simulate(1_000_000, {"daily_dex_volume_per_user": v})
        ratios.append(r["sustainability_ratio"])
        ubi_vals.append(r["ubi_per_person_usd"])

    fig, ax1 = plt.subplots(figsize=(10, 6))
    ax2 = ax1.twinx()

    ax1.plot(volumes, ratios, color=COLORS["green"], linewidth=2, label="Sustainability Ratio")
    ax1.axhline(y=1.0, color=COLORS["orange"], linestyle="--", alpha=0.7, label="Break-even (1.0x)")
    ax1.fill_between(volumes, ratios, 1.0, where=[r >= 1.0 for r in ratios], alpha=0.15, color=COLORS["green"])
    ax1.fill_between(volumes, ratios, 1.0, where=[r < 1.0 for r in ratios], alpha=0.15, color=COLORS["orange"])

    ax2.plot(volumes, ubi_vals, color=COLORS["gold"], linewidth=1.5, linestyle=":", label="UBI $/person/day")
    ax2.set_ylabel("UBI per Person ($/day)", color=COLORS["gold"])
    ax2.tick_params(axis="y", labelcolor=COLORS["gold"])

    ax1.set_xlabel("DEX Volume per User ($/day)")
    ax1.set_ylabel("Sustainability Ratio")
    ax1.set_title("UBI Sustainability vs DEX Volume per User", fontsize=14, fontweight="bold")
    ax1.legend(loc="upper left")
    ax1.grid(True)

    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "sustainability_vs_dex_volume.png"))
    plt.close(fig)
    print("  -> sustainability_vs_dex_volume.png")


def chart_sensitivity_heatmap():
    """Heatmap: sustainability ratio across DEX volume x UBI fee share."""
    dex_vols = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100]
    fee_shares = [0.10, 0.20, 0.33, 0.40, 0.50, 0.66, 0.75, 1.00]
    data = np.zeros((len(fee_shares), len(dex_vols)))

    for i, fs in enumerate(fee_shares):
        for j, dv in enumerate(dex_vols):
            r = simulate(1_000_000, {"ubi_fee_pct": fs, "daily_dex_volume_per_user": dv})
            data[i][j] = min(r["sustainability_ratio"], 10.0)

    fig, ax = plt.subplots(figsize=(12, 7))
    im = ax.imshow(data, cmap="RdYlGn", aspect="auto", vmin=0, vmax=5)

    ax.set_xticks(np.arange(len(dex_vols)))
    ax.set_yticks(np.arange(len(fee_shares)))
    ax.set_xticklabels([f"${v}" for v in dex_vols])
    ax.set_yticklabels([f"{int(fs*100)}%" for fs in fee_shares])
    ax.set_xlabel("DEX Volume per User ($/day)")
    ax.set_ylabel("UBI Fee Share (%)")
    ax.set_title("Sustainability Ratio: DEX Volume vs UBI Fee Share", fontsize=14, fontweight="bold")

    for i in range(len(fee_shares)):
        for j in range(len(dex_vols)):
            val = data[i][j]
            color = "white" if val < 1.5 or val > 4 else "black"
            ax.text(j, i, f"{val:.1f}x", ha="center", va="center", fontsize=9, color=color)

    cbar = fig.colorbar(im, ax=ax, shrink=0.8)
    cbar.set_label("Sustainability Ratio", color=COLORS["light"])
    cbar.ax.yaxis.set_tick_params(color=COLORS["light"])
    plt.setp(plt.getp(cbar.ax.axes, "yticklabels"), color=COLORS["light"])

    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "sensitivity_heatmap.png"))
    plt.close(fig)
    print("  -> sensitivity_heatmap.png")


def chart_inflation_trajectory():
    """Line chart: net inflation rate vs daily UBI mint amount."""
    mints = np.linspace(0.1, 5.0, 50)
    inflations = []
    sustainability = []
    for m in mints:
        r = simulate(100_000_000, {"daily_ubi_mint": m})
        inflations.append(r["net_inflation_rate"] * 100)
        sustainability.append(r["sustainability_ratio"])

    fig, ax1 = plt.subplots(figsize=(10, 6))
    ax2 = ax1.twinx()

    ax1.plot(mints, inflations, color=COLORS["orange"], linewidth=2, label="Net Inflation %")
    ax1.axhline(y=800, color=COLORS["light"], linestyle="--", alpha=0.3, label="8% target max")
    ax2.plot(mints, sustainability, color=COLORS["green"], linewidth=2, linestyle="-.", label="Sustainability Ratio")
    ax2.axhline(y=1.0, color=COLORS["green"], linestyle="--", alpha=0.3)

    ax1.set_xlabel("Daily UBI Mint (G$/person/day)")
    ax1.set_ylabel("Net Annual Inflation (%)", color=COLORS["orange"])
    ax1.tick_params(axis="y", labelcolor=COLORS["orange"])
    ax2.set_ylabel("Sustainability Ratio", color=COLORS["green"])
    ax2.tick_params(axis="y", labelcolor=COLORS["green"])
    ax1.set_title("Inflation vs Sustainability: UBI Mint Trade-off", fontsize=14, fontweight="bold")
    ax1.legend(loc="upper left")
    ax1.grid(True)

    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "inflation_vs_sustainability.png"))
    plt.close(fig)
    print("  -> inflation_vs_sustainability.png")


def main():
    os.makedirs(CHARTS_DIR, exist_ok=True)
    setup_style()

    print("Generating GoodDollar tokenomics charts...")
    chart_ubi_by_scale()
    chart_fee_breakdown()
    chart_sustainability_dex_volume()
    chart_sensitivity_heatmap()
    chart_inflation_trajectory()
    print(f"\nDone! Charts saved to {CHARTS_DIR}/")


if __name__ == "__main__":
    main()
