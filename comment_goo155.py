#!/usr/bin/env python3
"""Add test evidence comment to GOO-155."""
import sys, json, urllib.request, urllib.error
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

ISSUE_ID = "5611fcf5-76cd-457f-94f3-b70e0bc59d56"
# Correct UUID
ISSUE_ID = "5611fcf5-76cd-477f-94f3-b70e0bc59d56"

comment = "\n".join([
    "## Tester Alpha Test Evidence",
    "",
    "Ran devnet integration test suite on block 17156 (2026-04-03).",
    "",
    "### Test Results: 11 passed, 1 failed",
    "",
    "| Test | Result | TX |",
    "|------|--------|----|",
    "| ETH balance > 0 | PASS | (read) |",
    "| Anvil account unlocked | PASS | (read) |",
    "| Mint 100K MockUSDC | PASS | 0x10191b7d... |",
    "| Mint 50 MockWETH | PASS | 0xb62457aa... |",
    "| Post-mint USDC correct | PASS | (read) |",
    "| Post-mint WETH correct | PASS | (read) |",
    "| Approve WETH for GoodLendPool | PASS | 0x1965438b... |",
    "| Supply 10 WETH to GoodLendPool | PASS | 0x04b0c77b... |",
    "| Approve USDC for GoodLendPool | PASS | 0x8da5c931... |",
    "| Supply 50K USDC to GoodLendPool | PASS | 0xd497896e... |",
    "| **Borrow 5K USDC from GoodLendPool** | **FAIL** | 0xf643a743... |",
    "| GoodDollar totalSupply readable | PASS | (read) |",
    "",
    "### Root Cause (confirmed)",
    "",
    "After supply succeeded, checked gToken allowances:",
    "- `USDC.allowance(gToken_usdc=0xa852..., pool=0x3228...) = 0`",
    "- `WETH.allowance(gToken_weth=0x7a20..., pool=0x3228...) = 0`",
    "- gToken(USDC) holds 150,000 USDC with zero pool allowance",
    "- gToken(WETH) holds 60 WETH with zero pool allowance",
    "",
    "This confirms `GoodLendPool.borrow:299` always hits `TransferFailed()` because",
    "`IERC20(asset).transferFrom(gToken, borrower, amount)` requires an allowance that",
    "was never set in the `GoodLendToken` constructor.",
    "",
    "### Fix Required",
    "",
    "Add to `src/lending/GoodLendToken.sol` constructor (line 46):",
    "```solidity",
    "IERC20(_underlying).approve(_pool, type(uint256).max);",
    "```",
    "",
    "Assigned to Protocol Engineer for fix.",
])

# Try to checkout first (GOO-155 is assigned to Protocol Engineer, not me — just comment)
# Actually I can't checkout, just post comment as myself
url = t.API_URL + "/api/issues/" + ISSUE_ID + "/comments"
data = json.dumps({"body": comment}).encode()
req = urllib.request.Request(url, data=data, method="POST", headers={
    "Authorization": "Bearer " + t.TOKEN,
    "X-Paperclip-Run-Id": t.RUN_ID,
    "Content-Type": "application/json",
    "Accept": "application/json",
})
try:
    with urllib.request.urlopen(req) as r:
        print("Status:", r.status)
        print(json.loads(r.read()))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
