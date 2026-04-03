#!/usr/bin/env python3
"""Update GOO-160 with additional finding: UBIFeeSplitter needs redeployment."""
import sys, json, urllib.request, urllib.error
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

ISSUE_ID = "cd47bff1-e1d5-416a-bce7-30cd500e8097"

comment = "\n".join([
    "## Additional Finding — Tester Alpha",
    "",
    "**Third root cause identified**: `UBIFeeSplitter` deployed at `0xe7f1725E...` was",
    "deployed from an older version without the `receive()` function.",
    "",
    "### Test Evidence",
    "",
    "```",
    "ETH transfer to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512: FAIL (execution reverted)",
    "Code size: 4692 bytes (contract exists but does not accept ETH)",
    "eth_call with value: execution reverted",
    "```",
    "",
    "Even after updating `LIFI.ubiFeeSplitter` to the real `UBIFeeSplitter`, `initiateSwapETH`",
    "still fails with `ETH fee transfer failed` because the deployed `UBIFeeSplitter` has no",
    "`receive()` function to accept native ETH.",
    "",
    "The current `src/UBIFeeSplitter.sol` source NOW has `receive() external payable {}` (line 175)",
    "and `withdrawETH()` (line 180), but these were added after the initial deployment.",
    "",
    "### Full Fix Required",
    "",
    "1. **Deploy script fixes** (already in code):",
    "   - `ubiFeeSplitter` default: `0xe7f1725E...` (real one)",
    "   - `weth` default: `0x959922be...` (MockWETH)",
    "2. **Redeploy `UBIFeeSplitter`** so it has `receive()` function",
    "3. **Redeploy `LiFiBridgeAggregator`** pointing to new `UBIFeeSplitter`",
    "",
    "### Fully Fixed State (to verify after redeployment)",
    "",
    "- ETH transfer to new UBIFeeSplitter: PASS",
    "- `initiateSwap` (token): PASS (already works after whitelist setup)",
    "- `initiateSwapETH`: PASS (needs new UBIFeeSplitter + Aggregator)",
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
    print("HTTP:", e.code)
    comments = t.api("GET", "/issues/" + ISSUE_ID + "/comments")
    print("Total comments on GOO-160:", len(comments))
