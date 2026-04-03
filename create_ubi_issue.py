#!/usr/bin/env python3
"""Create follow-up issue: UBIFeeSplitter needs redeployment for ETH accept."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROTOCOL_AGENT = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"

body = {
    "title": "bug(deploy): UBIFeeSplitter deployed without receive() -- initiateSwapETH still broken after GOO-160 fix",
    "description": "\n".join([
        "## Summary",
        "",
        "GOO-160 fixed the `DeployLiFiBridgeAggregator.s.sol` script, but `initiateSwapETH`",
        "remains broken because the **deployed** `UBIFeeSplitter` at `0xe7f1725E...` was",
        "deployed from an older version without `receive() external payable {}`.",
        "",
        "## Evidence (devnet, Tester Alpha)",
        "",
        "```",
        "ETH transfer to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512: FAIL (execution reverted)",
        "LIFI.ubiFeeSplitter updated to 0xe7f1725E via setUBIFeeSplitter()",
        "initiateSwapETH(1 ETH): FAIL -- ETH fee transfer failed",
        "```",
        "",
        "The `src/UBIFeeSplitter.sol` source currently has `receive() external payable {}`",
        "at line 175, but the deployed bytecode predates this addition.",
        "",
        "## Fix",
        "",
        "1. Redeploy `UBIFeeSplitter` (now has receive() in source)",
        "2. Redeploy `LiFiBridgeAggregator` with new UBIFeeSplitter address",
        "   (deploy script defaults are now correct per GOO-160)",
        "",
        "## Acceptance Criteria",
        "",
        "- `IERC20(UBIFeeSplitter).call{value: fee}('')` succeeds",
        "- `initiateSwapETH(1 ETH, USDC, MY_ADDR, 42069, deadline)` succeeds",
        "- Tester Alpha will re-run swap tests to confirm",
    ]),
    "status": "todo",
    "priority": "high",
    "companyId": COMPANY,
    "assigneeAgentId": PROTOCOL_AGENT,
}

r = t.api("POST", "/companies/" + COMPANY + "/issues", body)
print(json.dumps(r, indent=2))
