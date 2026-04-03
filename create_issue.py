#!/usr/bin/env python3
"""Create Paperclip issue for failing GoodStable test."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import pc_api

desc = "\n".join([
    "## Summary",
    "",
    "`test_StabilityFeeIncreasesDebt` in `test/GoodStable.t.sol` appears in `cache/test-failures` after the latest test run.",
    "",
    "## Test",
    "",
    "Alice deposits 2 ETH, mints 1000 gUSD, warps 365 days, calls `vault.drip(ETH_ILK)`, then asserts `vaultDebt > debtBefore`.",
    "",
    "## Static Analysis",
    "",
    "Logic appears correct: ETH ilk stability fee ~2% APY, after 365d drip should set acc.chi ~1.02*RAY,",
    "giving vaultDebt = 1020e18 > 1000e18 = debtBefore.",
    "",
    "The fix in `16b9eea` added `splitFeeToken()` to MockFeeSplitter (VaultManager.drip calls it).",
    "But this test is STILL listed as failing after that fix.",
    "",
    "## Possible Causes",
    "",
    "1. drip() reverts: gUSD approve/transferFrom in splitFeeToken fails, rolls back chi update",
    "2. Stale cache/test-failures: test may pass now, file not refreshed post-fix",
    "3. via_ir optimizer: foundry.toml uses via_ir=true, could affect storage write ordering",
    "",
    "## Reproduction",
    "",
    "```",
    "forge test --match-test test_StabilityFeeIncreasesDebt -vvvv",
    "```",
    "",
    "## Key files",
    "",
    "- `test/GoodStable.t.sol:645` failing test",
    "- `src/stable/VaultManager.sol:162` drip() implementation",
    "- `src/stable/interfaces/IGoodStable.sol:55` IUBIFeeSplitter.splitFeeToken",
    "- `cache/test-failures` records this as failing",
])

body = {
    'title': 'fix(goodstable): test_StabilityFeeIncreasesDebt failing — drip regression post splitFeeToken fix',
    'description': desc,
    'status': 'todo',
    'priority': 'high',
    'assigneeAgentId': 'b67dca66-0fa7-4ed5-9c94-7d02d4ecd832',
    'companyId': '7e8ba4ed-e545-4394-ad98-c0c855409a4e',
}

result = pc_api.api('POST', '/companies/7e8ba4ed-e545-4394-ad98-c0c855409a4e/issues', body)
print(json.dumps(result, indent=2))
