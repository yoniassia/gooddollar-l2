# Tester Alpha — Test Summary

## Stats
- **Total tests run (lifetime):** 170
- **Iteration 1:** 21 pass / 0 fail
- **Iteration 2:** 20 pass / 0 fail
- **Iteration 3:** 18 pass / 0 fail
- **Iteration 4:** 33 pass / 0 fail
- **Last run:** 2026-04-04T02:07:01.191345+00:00

## Contracts Covered
- GoodLendPool: supply, borrow, repay, withdraw, flashLoan, liquidate, mintToTreasury, getUserAccountData, getReservesCount, getBorrowIndex, setBorrowingEnabled, setOracle, setTreasury, setAdmin, setReserveActive
- MockWETH/MockUSDC: balanceOf, approve, mint, transfer
- LiFiBridgeAggregator: initiateSwap, initiateSwapETH, completeSwap, refundSwap, expireSwap, setKeeper, setUBIFeeRate, setUBIFeeSplitter, setSupportedChain, setWhitelistedToken, batchWhitelistTokens, getUserSwaps, swapCount, getSwap
- UBIFeeSplitter: ETH receive(), withdrawETH, claimableBalance, setFeeSplit, setTreasury, setUBIRecipient, registerDApp, splitFeeToken, releaseToUBI

## Functions Tested (all iterations)
- admin()
- approve
- batchWhitelistTokens verify
- batchWhitelistTokens([2])
- borrow
- borrow(disabled)
- borrow(no collateral)
- borrow(over cap)
- borrow(re-enabled)
- claimableBalance()
- completeSwap
- completeSwap(refunded)
- dAppCount()
- expireSwap
- flashLoan(EOA receiver)
- getBorrowIndex
- getReservesCount
- getSwap
- getSwap(expired)
- getUserAccountData
- getUserSwaps
- initiateSwap
- initiateSwap(0)
- initiateSwap(60s deadline)
- initiateSwap(expired deadline)
- initiateSwap(non-whitelisted)
- initiateSwap(unsupported chain)
- initiateSwap(zero)
- initiateSwapETH
- initiateSwapETH(new fee rate)
- initiateSwapETH(new splitter)
- keepers()
- liquidate
- liquidate(HF>1)
- mintToTreasury([USDC,WETH])
- oracle()
- protocolTreasury()
- receive()
- refundSwap
- registerDApp(GoodSwap)
- registeredDApps()
- releaseToUBI
- releaseToUBI verify
- repay
- setAdmin(FRESH2)
- setAdmin(restore deployer)
- setBorrowingEnabled(USDC,false)
- setBorrowingEnabled(USDC,true)
- setFeeSplit
- setFeeSplit()
- setKeeper
- setOracle
- setReserveActive(USDC,false)
- setReserveActive(USDC,true)
- setSupportedChain(add)
- setSupportedChain(remove)
- setTreasury
- setUBIFeeRate
- setUBIFeeSplitter
- setUBIRecipient
- setWhitelistedToken(add)
- setWhitelistedToken(remove)
- splitFeeToken verify
- splitFeeToken(USDC)
- supply
- supply(0)
- supply(inactive reserve)
- supply(zero)
- supportedChains()
- swapCount
- treasury()
- ubiFeeRateBps()
- ubiFeeSplitter()
- ubiRecipient()
- whitelistedTokens()
- whitelistedTokens(after remove)
- withdraw
- withdrawETH
- withdrawETH(verify)

## Functions NOT YET Tested
- GoodLendPool: initReserve (complex constructor-level setup; tested indirectly via deployed pool)
- LiFiBridgeAggregator: no major untested paths
- UBIFeeSplitter: splitFee (requires goodDollar.fundUBIPool — needs G$ minter role for splitter)
- UBIFeeHook: afterSwap via V4 pool (requires full V4 pool liquidity setup)

## Bugs Found
- GOO-205: UBIFeeHook.poolManager=0x1 (FIXED via GOO-215 — new hook 0x325c8Df4 verified)

## Notes
- MockUSDC: 6 decimals; MockWETH: 18 decimals
- Liquidation tested by oracle price manipulation (WETH $2000→$100→$2000)
- splitFee (G$ path) not tested — requires UBIFeeSplitter to be a GoodDollar minter to call fundUBIPool
- expireSwap: requires deadline passed; use anvil_mine with time advancement
