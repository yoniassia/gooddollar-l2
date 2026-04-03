# Tester Alpha — Test Summary

## Stats
- **Total tests run (lifetime):** 21
- **Iteration 1 results:** 21 pass / 0 fail
- **Pass rate:** 100%
- **Last run:** 2026-04-03T22:11:15.233392+00:00

## Contracts Covered
- GoodLendPool (supply, borrow, repay, withdraw, getUserAccountData)
- MockWETH / MockUSDC (ERC-20 approve, balanceOf, mint)
- LiFiBridgeAggregator (initiateSwap, initiateSwapETH, swapCount, getSwap)
- UBIFeeSplitter (ETH fee receipt via receive())

## Functions Tested
- approve
- borrow
- borrow(no collateral)
- borrow(over cap)
- getSwap
- getUserAccountData
- initiateSwap
- initiateSwap(0)
- initiateSwap(non-whitelisted)
- initiateSwapETH
- receive()
- repay
- supply
- supply(0)
- swapCount
- withdraw

## Functions NOT YET Tested
- GoodLendPool: flashLoan, liquidate, mintToTreasury, initReserve, setOracle
- LiFiBridgeAggregator: completeSwap, expireSwap, refundSwap, setKeeper
- UBIFeeSplitter: withdrawETH, setFeeBeneficiary, distributeUBI

## Bugs Found This Iteration
None.

## Notes
- MockUSDC has 6 decimals (not 18) — must use amounts * 10^6
- MockWETH has 18 decimals
- GoodLendPool borrow cap = 1,000,000 USDC
- MockUSDC/WETH mint() has no access control — anyone can mint on devnet
- New contracts: LiFi=0x1c9fd50d..., UBI=0x683d9cdd... (GOO-195 fix)
