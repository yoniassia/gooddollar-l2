---
title: "GoodStocks — Tokenized Stocks Platform"
parent: gooddollar-l2
planned: false
executed: false
priority: high
depends_on: []
---

# GoodStocks — Tokenized Stocks

## Goal
Build a tokenized stocks platform on the GoodDollar L2 where users can trade synthetic versions of real equities (AAPL, TSLA, NVDA, etc.) 24/7 with fractional shares, all with UBI fee routing.

## Requirements

### Smart Contracts (Solidity/Foundry)
- **SyntheticAssetFactory** — Mints/burns synthetic stock tokens pegged to real prices
- **PriceOracle** — Chainlink oracle integration for real-time equity prices (or mock for testnet)
- **CollateralVault** — Users deposit G$/USDC as collateral to mint synthetics (150% collateralization ratio)
- **LiquidationEngine** — Liquidates undercollateralized positions, liquidation bonus → UBI pool
- **UBIFeeHook** — 0.1% trade fee, 33% → UBI pool
- **StockRegistry** — Whitelist of supported stocks with ticker, oracle address, trading hours override (24/7)

### Frontend Pages
- **/stocks** — Market overview: list of all tokenized stocks with price, 24h change, volume, market cap
- **/stocks/[ticker]** — Individual stock page: price chart (TradingView lightweight), order form (market/limit), position summary, stock info
- **/stocks/portfolio** — User's synthetic stock holdings, P&L, collateral health
- **Mint/Redeem flow** — Deposit collateral → mint synthetic → trade → redeem back to collateral

### Key Features
- Fractional shares (buy $1 of AAPL)
- 24/7 trading (no market hours restriction)
- Real-time price feeds via oracles
- Collateral health indicator (green/yellow/red)
- Price alerts
- Trading history with P&L

### Design
- Professional trading UI (dark theme, clean data tables)
- TradingView charts embedded
- Consistent with GoodSwap styling
- Mobile responsive

## Success Criteria
- Users can mint, trade, and redeem at least 5 synthetic stocks
- Prices track real equities within 0.5% deviation
- UBI fees correctly route to pool
- All contract tests pass
- Responsive UI with charts
