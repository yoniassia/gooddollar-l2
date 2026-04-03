#!/usr/bin/env python3
"""Create LiFiBridgeAggregator deployment misconfiguration bug."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROTOCOL_AGENT = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"

body = {
    "title": "bug(swap): LiFiBridgeAggregator misconfigured -- wrong ubiFeeSplitter + whitelist addresses in deploy script",
    "description": "\n".join([
        "## Summary",
        "",
        "`LiFiBridgeAggregator` (0x8bce54...) is deployed with two misconfiguration bugs:",
        "",
        "1. **Wrong ubiFeeSplitter**: points to `MockUBIFeeSplitter` (0x8f86403A...) from GoodStable,",
        "   not the real `UBIFeeSplitter` (0xe7f1725E...). MockUBIFeeSplitter has no `receive()` so",
        "   all `initiateSwapETH` calls fail: `require(sent) -> ETH fee transfer failed`.",
        "",
        "2. **Wrong default WETH address in deploy script**: `script/DeployLiFiBridgeAggregator.s.sol:18`",
        "   sets `weth = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` which is the `UBIFeeSplitter`!",
        "   Real MockWETH is `0x959922be3caee4b8cd9a407cc3ac1c251c2007b1`.",
        "",
        "## Reproduction (devnet tests by Tester Alpha)",
        "",
        "Test run on block 17000+:",
        "- `initiateSwap(USDC->WETH)` PASS after manually whitelisting via admin",
        "- `initiateSwapETH(1 ETH->USDC)` FAIL: ETH fee transfer failed",
        "- Confirmed: `ubiFeeSplitter.call(value=fee)` fails on MockUBIFeeSplitter (no receive)",
        "",
        "## Files",
        "",
        "- `script/DeployLiFiBridgeAggregator.s.sol:13` -- UBI_FEE_SPLITTER default = MockUBIFeeSplitter",
        "- `script/DeployLiFiBridgeAggregator.s.sol:18` -- WETH_ADDRESS default = UBIFeeSplitter address",
        "",
        "## Fix",
        "",
        "```",
        "- address ubiFeeSplitter = vm.envOr(..., 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);  // real splitter",
        "- address weth = vm.envOr(..., 0x959922be3caee4b8cd9a407cc3ac1c251c2007b1);  // MockWETH",
        "```",
        "",
        "Also add `receive()` or `fallback()` to UBIFeeSplitter to accept native ETH fees.",
    ]),
    "status": "todo",
    "priority": "high",
    "companyId": COMPANY,
    "assigneeAgentId": PROTOCOL_AGENT,
}

r = t.api("POST", "/companies/" + COMPANY + "/issues", body)
print(json.dumps(r, indent=2))
