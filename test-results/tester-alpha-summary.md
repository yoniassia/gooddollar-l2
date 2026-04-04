# Tester Alpha — Test Summary

## Stats
- **Total tests run (lifetime):** 137
- **Iteration 1:** 21 pass / 0 fail
- **Iteration 2:** 20 pass / 0 fail
- **Iteration 3:** 18 pass / 0 fail
- **Last run:** 2026-04-04T00:17:47.318622+00:00

## Contracts Covered
- GoodLendPool: supply, borrow, repay, withdraw, flashLoan, liquidate, mintToTreasury, getUserAccountData, getReservesCount, getBorrowIndex, setBorrowingEnabled
- MockWETH/MockUSDC: balanceOf, approve, mint, transfer
- LiFiBridgeAggregator: initiateSwap, initiateSwapETH, completeSwap, refundSwap, expireSwap, setKeeper, setUBIFeeRate, setUBIFeeSplitter, swapCount, getSwap
- UBIFeeSplitter: ETH receive(), withdrawETH, claimableBalance, setFeeSplit

## Functions Tested (all iterations)
- approve
- borrow
- borrow(disabled)
- borrow(no collateral)
- borrow(over cap)
- borrow(re-enabled)
- claimableBalance()
- completeSwap
- completeSwap(refunded)
- expireSwap
- flashLoan(EOA receiver)
- getBorrowIndex
- getReservesCount
- getSwap
- getSwap(expired)
- getUserAccountData
- initiateSwap
- initiateSwap(0)
- initiateSwap(60s deadline)
- initiateSwap(expired deadline)
- initiateSwap(non-whitelisted)
- initiateSwap(zero)
- initiateSwapETH
- initiateSwapETH(new fee rate)
- initiateSwapETH(new splitter)
- keepers()
- liquidate
- liquidate(HF>1)
- mintToTreasury([USDC,WETH])
- receive()
- refundSwap
- repay
- setBorrowingEnabled(USDC,false)
- setBorrowingEnabled(USDC,true)
- setFeeSplit
- setFeeSplit()
- setKeeper
- setUBIFeeRate
- setUBIFeeSplitter
- supply
- supply(0)
- supply(zero)
- swapCount
- ubiFeeRateBps()
- ubiFeeSplitter()
- withdraw
- withdrawETH
- withdrawETH(verify)

## Functions NOT YET Tested
- GoodLendPool: initReserve, setOracle, setAdmin, setTreasury, setReserveActive
- LiFiBridgeAggregator: setSupportedChain, batchWhitelistTokens, setWhitelistedToken, getUserSwaps
- UBIFeeSplitter: registerDApp, splitFee, splitFeeToken, releaseToUBI, setTreasury, setUBIRecipient
- UBIFeeHook: afterSwap via V4 pool (requires full V4 pool setup)

## Bugs Found
- GOO-205: UBIFeeHook.poolManager=0x1 (FIXED via GOO-215 — new hook 0x325c8Df4 verified)

## Notes
- MockUSDC: 6 decimals; MockWETH: 18 decimals
- Liquidation tested by oracle price manipulation (WETH $2000→$100→$2000)
- expireSwap: requires deadline passed; use anvil_mine with time advancement
- GOO-215 verified: new hook routes 0.001 ETH fee per 1 ETH swap (0.1% rate)
