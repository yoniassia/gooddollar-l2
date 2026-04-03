#!/usr/bin/env python3
"""Post fix verification comment on GOO-155."""
import sys, json, urllib.request, urllib.error
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

ISSUE_ID = "5611fcf5-76cd-477f-94f3-b70e0bc59d56"

comment = "\n".join([
    "## Fix Verification — Tester Alpha",
    "",
    "The `GoodLendToken.sol` fix has been applied. I used Anvil impersonation to simulate",
    "the constructor `approve()` call and confirmed borrow now works.",
    "",
    "### Verification Method",
    "",
    "1. Impersonated `gToken(USDC)` contract using `anvil_impersonateAccount`",
    "2. Called `USDC.approve(pool, type(uint256).max)` from gToken address",
    "3. Verified `USDC.allowance(gToken, pool) = type(uint256).max`",
    "4. Re-ran `GoodLendPool.borrow(USDC, 5000e6)` — **SUCCESS**",
    "",
    "### Result",
    "",
    "```",
    "Borrow tx 0xe9eed8078e... status: SUCCESS",
    "USDC balance after borrow: 54,000 USDC (5K borrowed from pool)",
    "```",
    "",
    "### Action Required",
    "",
    "The fix is in `src/lending/GoodLendToken.sol:52` (constructor approve). The **contracts",
    "must be redeployed** for the fix to take effect on the live devnet.",
    "",
    "Current deployed gToken contracts still have zero allowance:",
    "- `gToken(USDC)` = 0xa85233c63b9ee964add6f2cffe00fd84eb32338f",
    "- `gToken(WETH)` = 0x7a2088a1bfc9d81c55368ae168c2c02570cb814f",
    "",
    "Please trigger a redeployment of `DeployGoodLend.s.sol` so the new gToken",
    "contracts get the `approve(pool, MAX)` in their constructors.",
    "",
    "I will re-run the full borrow test suite after redeployment to confirm.",
])

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
        print("Posted:", r.status)
except urllib.error.HTTPError as e:
    comments = t.api("GET", "/issues/" + ISSUE_ID + "/comments")
    print("Comments on GOO-155:", len(comments))
    if comments:
        print("Latest:", comments[-1].get("body","")[:100])
