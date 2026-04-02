---
title: "GoodStocks — Tokenized Stocks Platform"
parent: gooddollar-l2
planned: true
executed: false
split: true
priority: high
depends_on: []
---

# GoodStocks — Tokenized Stocks

## Goal
Build a tokenized stocks platform on the GoodDollar L2 where users can trade synthetic versions of real equities (AAPL, TSLA, NVDA, etc.) 24/7 with fractional shares, all with UBI fee routing.

## Research Notes
- TradingView Lightweight Charts library (open source, MIT) is ideal for stock price charts
- Chainlink data feeds provide real equity prices — for testnet/mock we'll use static mock data
- Existing patterns: Next.js App Router, Tailwind dark theme with `goodgreen` accent, `dark-*` bg palette
- Explore page pattern (data table with sort/search) can be reused for stock listing
- No smart contracts in this phase — frontend only with mock data layer

## Architecture

```mermaid
graph TD
    A[/stocks - Market Overview] --> B[StockTable + Search]
    B --> C[Mock Stock Data Layer]
    D[/stocks/ticker - Detail] --> E[TradingView Chart]
    D --> F[Order Form - mock]
    D --> G[Stock Info Panel]
    H[/stocks/portfolio] --> I[Holdings Table]
    H --> J[P&L Display]
    H --> K[Collateral Health Indicator]
    L[Header Nav] --> A
    C --> D
    C --> H
```

## Size Estimation
- **New pages/routes:** 4 (/stocks, /stocks/[ticker], /stocks/portfolio, mint/redeem sub-flow)
- **New UI components:** 8+ (StockTable, StockRow, PriceChart, OrderForm, PositionSummary, CollateralHealth, MintRedeemDialog, PortfolioTable)
- **API integrations:** 2 (TradingView widget, mock oracle data)
- **Complex interactions:** 3 (TradingView chart, real-time price simulation, mint/redeem flow)
- **Estimated LOC:** ~3000-4000

## One-Week Decision: NO
4 pages, 8+ components, 3 complex interactions, 3000+ LOC. Exceeds every threshold. Must split.

## Split Rationale
Split into 3 vertical slices by page, each building on the previous:
1. **Market Overview** — the stock listing page with search/sort and nav integration (~500 LOC)
2. **Stock Detail** — individual stock page with chart and order form (~800 LOC)
3. **Portfolio** — user holdings, P&L tracking, collateral health (~600 LOC)

## Children
- 0049-goodstocks-market-overview
- 0050-goodstocks-stock-detail
- 0051-goodstocks-portfolio
