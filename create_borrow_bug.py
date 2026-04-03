#!/usr/bin/env python3
"""Create Paperclip bug issue for GoodLendPool borrow failure."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROTOCOL_AGENT = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"

desc_lines = [
    "## Summary",
    "",
    "`GoodLendPool.borrow()` always reverts with `TransferFailed()`. Root cause: when",
    "users supply tokens, the underlying asset (USDC/WETH) is transferred to the",
    "`GoodLendToken` (gToken) contract. But the gToken never grants an allowance to the",
    "pool to spend those underlying tokens, so the `transferFrom(gToken, borrower, amount)`",
    "call in `borrow()` always fails.",
    "",
    "## Reproduction (devnet)",
    "",
    "Steps run by Tester Alpha (0x70997970...) on devnet block 17156:",
    "1. Mint 100K MockUSDC + 50 MockWETH -- PASS",
    "2. Approve GoodLendPool, supply 50K USDC and 10 WETH -- PASS (status 0x1)",
    "3. gToken(USDC) holds 150K USDC, gToken(WETH) holds 60 WETH",
    "4. borrow(USDC, 5000e6) -- FAIL: execution reverted, TransferFailed()",
    "",
    "## Root Cause",
    "",
    "`src/lending/GoodLendPool.sol:299`:",
    "```solidity",
    "if (!IERC20(asset).transferFrom(reserve.gToken, msg.sender, amount))",
    "    revert TransferFailed();",
    "```",
    "",
    "For `USDC.transferFrom(gToken, borrower, amount)` to succeed, the gToken must have",
    "approved the pool with `USDC.approve(pool, type(uint256).max)`. This approval",
    "is never set in `GoodLendToken.sol`.",
    "",
    "Proof (eth_call on devnet):",
    "- gToken(USDC) = 0xa85233c63b9ee964add6f2cffe00fd84eb32338f",
    "- gToken(WETH) = 0x7a2088a1bfc9d81c55368ae168c2c02570cb814f",
    "- USDC.allowance(gToken, pool) = 0",
    "- WETH.allowance(gToken, pool) = 0",
    "",
    "## Fix",
    "",
    "In `src/lending/GoodLendToken.sol` constructor, add:",
    "```solidity",
    "IERC20(_underlying).approve(_pool, type(uint256).max);",
    "```",
    "",
    "## Impact",
    "",
    "All borrow operations completely broken. Supply works, borrow is 100% non-functional.",
    "",
    "## Files",
    "",
    "- `src/lending/GoodLendToken.sol:46` -- constructor missing approve",
    "- `src/lending/GoodLendPool.sol:299` -- transferFrom will always fail",
]

body = {
    "title": "bug(lending): GoodLendPool.borrow always fails -- gToken never approves pool to spend underlying",
    "description": "\n".join(desc_lines),
    "status": "todo",
    "priority": "critical",
    "companyId": COMPANY,
    "assigneeAgentId": PROTOCOL_AGENT,
}

r = t.api("POST", "/companies/" + COMPANY + "/issues", body)
print(json.dumps(r, indent=2))
