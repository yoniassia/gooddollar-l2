# Tester Beta — GoodPerps + GoodPredict QA Summary

**Agent:** Tester Beta — Perps & Predictions  
**Wallet:** 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC  
**Chain:** GoodDollar L2 Devnet (Chain ID 42069)

---

## Lifetime Stats

| Metric | Value |
|--------|-------|
| Total tests run | 94 |
| Passed | 72 |
| Failed | 22 |
| Pass rate (lifetime) | 76.6% |
| QA iterations | 3 |

---

## Coverage by Contract

| Contract | Pass | Fail | Notes |
|----------|------|------|-------|
| PerpEngine | 28 | 9 | Markets 0+1 work; markets 2-5 oracle key broken |
| MarginVault | 7 | 0 | ✅ Fully functional |
| PriceOracle | 10 | 3 | TSLA/GOLD/SPY have no feed; ETH/BTC/AAPL have prices |
| FundingRate | 10 | 0 | ✅ Fully functional (B6 confirmed fixed) |
| MarketFactory | 5 | 7 | Admin-only create; existing markets voided/resolved |
| ConditionalTokens | 4 | 2 | Factory mismatch bug blocks buy flow |
| SyntheticAssetFactory | 4 | 1 | implementation() reverts |
| GDT | 4 | 0 | ✅ Fully functional |

---

## Functions Covered

### PerpEngine
- `admin()`, `paused()`, `marketCount()`, `BPS()`, `TRADE_FEE_BPS()`, `MAINTENANCE_MARGIN_BPS()`, `LIQUIDATION_BONUS_BPS()`
- `vault()`, `oracle()`, `feeSplitter()`, `funding()`
- `markets(uint256)` — all 6 markets
- `openPosition(uint256,uint256,bool,uint256)` — markets 0+1 ✅, markets 2-5 ❌
- `closePosition(uint256)` — markets 0+1 ✅
- `positions(address,uint256)`, `marginRatio(address,uint256)`, `unrealizedPnL(address,uint256)`

### MarginVault
- `admin()`, `collateral()`, `perpEngine()`, `totalDeposited()`, `balances(address)`
- `deposit(uint256)` ✅, `withdraw(uint256)` ✅

### PriceOracle
- `maxAge()`, `getPrice(string)` — ETH/BTC/AAPL ✅, TSLA/GOLD/SPY ❌
- `hasFeed(string)` — all 6 tickers
- `manualPrices(bytes32)`, `useManualPrice(bytes32)`, `getPriceByKey(bytes32)`

### FundingRate
- `FUNDING_INTERVAL()` (28800s = 8h), `MAX_FUNDING_RATE()` (non-zero)
- `admin()`, `perpEngine()`
- `cumulativeFundingIndex(uint256)` — markets 0, 1, 2
- `lastFundingTime(uint256)` — markets 0, 1, 2
- `accruedFunding(int256,int256,uint256)`

### MarketFactory
- `admin()`, `marketCount()`, `goodDollar()`, `tokens()`, `BPS()`, `REDEEM_FEE_BPS()`
- `markets(uint256)` — existing markets 0+1

### ConditionalTokens
- `factory()`, `yesTokenId(uint256)`, `noTokenId(uint256)`
- `balanceOf(address,uint256)`, `balanceOfBatch(address[],uint256[])`

### SyntheticAssetFactory
- `admin()`, `listedCount()`, `getAsset(string)`, `listAsset()` (admin-only revert ✅)
- `implementation()` ❌ reverts

---

## Functions NOT Yet Tested (Gaps)

### PerpEngine
- `createMarket(bytes32,uint256)` — admin-only
- `setAdmin(address)` — admin-only
- `setPaused(bool)` — admin-only
- `liquidate(address,uint256)` — needs undercollateralized position setup
- Positions on markets 3, 4, 5 (oracle keys broken)

### MarginVault
- `credit(address,uint256)`, `debit(address,uint256)`, `transfer(address,address,uint256)`, `flushFee(address,uint256)` — PerpEngine-only calls

### FundingRate
- `applyFunding(uint256,uint256,uint256)` — PerpEngine-only
- `initMarket(uint256)`, `setAdmin(address)`, `setPerpEngine(address)` — admin-only

### MarketFactory
- `createMarket(string,uint256,address)` — admin-only
- `buy(uint256,bool,uint256)` — blocked (no open markets available)
- `resolve(uint256,bool)` — resolver-only
- `redeem(uint256,uint256)` — blocked
- `closeMarket(uint256)` — resolver-only
- `voidMarket(uint256)` — admin-only

### ConditionalTokens
- `mint(address,uint256,uint256)` — factory-only
- `burn(address,uint256,uint256)` — factory-only
- `safeTransferFrom(...)`, `safeBatchTransferFrom(...)`, `setApprovalForAll(...)`, `isApprovedForAll(...)`

---

## Bugs Found

| ID | Summary | Severity | Status | Issue |
|----|---------|----------|--------|-------|
| B5 | closeMarket requires manual evm_mine on devnet | Low | Open | — |
| B6 | FundingRate FUNDING_INTERVAL/MAX_FUNDING_RATE returned 0 | High | **FIXED** ✅ | — |
| B7 | GoodLend.getReserveData() reverts for unregistered assets | Low | Open | — |
| B_ORACLE_KEY | PerpEngine markets 2-5 oracle keys don't match registered feeds | **Critical** | Open | [GOO-225](/GOO/issues/GOO-225) |
| B_CT_FACTORY | ConditionalTokens.factory() returns deployer EOA not MarketFactory | **High** | Open | [GOO-226](/GOO/issues/GOO-226) |
| B_SAF_IMPL | SyntheticAssetFactory.implementation() reverts | Medium | Open | [GOO-227](/GOO/issues/GOO-227) |

---

## Iteration History

### Iteration 1 (GOO-141)
- Margin deposit, open perp position, create prediction market, buy conditional tokens
- Established baseline test coverage

### Iteration 2 (GOO-206)
- Liquidation flow, market lifecycle, edge cases, FundingRate, GoodLend
- Found B5, B6, B7; 38/40 transactions passed

### Iteration 3 (GOO-220)
- Multi-position concurrent (3 markets), oracle verification, SyntheticAssetFactory, FundingRate B6 investigation, negative tests, GoodPredict multi-market
- 72/94 tests passed; B6 confirmed FIXED; found B_ORACLE_KEY, B_CT_FACTORY, B_SAF_IMPL
- **openPosition confirmed working** for ETH and BTC markets with correct params (size, not margin)
- **Note**: openPosition params are `(marketId, size, isLong, margin)` not `(marketId, collateral, isLong, leverage)`

---

*Last updated: 2026-04-04*
