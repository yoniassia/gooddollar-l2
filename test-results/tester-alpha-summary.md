# Tester Alpha — Test Summary

## Stats
- **Total tests run (lifetime):** 19
- **Iteration 1:** 14 pass / 5 fail
- **Pass rate:** 73%
- **Last run:** 2026-04-03T22:05:09.363479Z

## Contracts Covered
- GoodLendPool (supply, borrow, repay, withdraw, getUserAccountData)
- MockWETH / MockUSDC (ERC-20 approve, transfer, balanceOf)
- LiFiBridgeAggregator (initiateSwap, initiateSwapETH, swapCount)
- UBIFeeSplitter (ETH fee receipt)

## Functions Tested
- approve
- borrow
- borrow(no collateral)
- getUserAccountData
- initiateSwap
- initiateSwap(non-whitelisted)
- initiateSwap(zero)
- initiateSwapETH
- receive()
- repay
- supply
- supply(zero)
- swapCount
- withdraw

## Functions NOT YET Tested
- GoodLendPool: flashLoan, liquidate, mintToTreasury, initReserve
- LiFiBridgeAggregator: completeSwap, expireSwap, refundSwap
- UBIFeeSplitter: withdrawETH, setFeeBeneficiary

## Bugs Found
- GoodLendPool.borrow: tx reverted
- LiFiBridgeAggregator.initiateSwap: tx reverted

## New in This Iteration
- First run; established baseline for GoodLend full cycle
- Verified GOO-195 fix (initiateSwapETH) with new contract addresses
