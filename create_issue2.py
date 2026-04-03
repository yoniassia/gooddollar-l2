#!/usr/bin/env python3
"""Create Paperclip issue for liquidation bonus double-deduction bug."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import pc_api

desc = "\n".join([
    "## Summary",
    "",
    "Liquidation bonus is double-deducted from the trader's vault in `PerpEngine.liquidate()`.",
    "This causes traders to lose an extra `bonus` amount on top of their actual PnL loss.",
    "",
    "## Bug",
    "",
    "In `src/perps/PerpEngine.sol:292-295`:",
    "",
    "```solidity",
    "if (bonus > 0) {",
    "    vault.transfer(trader, msg.sender, bonus);  // Step 1: bonus deducted from vault",
    "}",
    "_closePosition(trader, marketId, pnl - int256(bonus), fundingPayment, exitPrice);  // Step 2: WRONG",
    "```",
    "",
    "In `_closePosition`, `netPnL = (pnl - bonus) - fundingPayment`. If `loss = -netPnL < pos.margin`,",
    "the code calls `vault.debit(trader, loss)` where `loss` already includes the `bonus` amount.",
    "But the bonus was ALREADY taken in step 1 via `vault.transfer`.",
    "",
    "## Example",
    "",
    "- Margin = 200, PnL = -190, fundingPayment = 0",
    "- remainingMargin = 200 + (-190) = 10",
    "- bonus = 10 * 5% = 0.5 (round up to 1 for illustration)",
    "- Step 1: vault.transfer(trader, liquidator, 1) -> trader vault -= 1",
    "- Step 2: _closePosition with pnl - 1 = -191",
    "  - netPnL = -191, loss = 191",
    "  - vault.debit(trader, 191) -> trader vault -= 191",
    "- Total deducted from trader: 1 + 191 = 192",
    "- **Correct** deduction: 190 (PnL loss) + 1 (bonus) = 191",
    "- **Extra loss**: 1 (bonus double-counted)",
    "",
    "## Fix",
    "",
    "Remove the bonus subtraction from the `_closePosition` call:",
    "",
    "```solidity",
    "// Before (buggy):",
    "_closePosition(trader, marketId, pnl - int256(bonus), fundingPayment, exitPrice);",
    "",
    "// After (correct):",
    "_closePosition(trader, marketId, pnl, fundingPayment, exitPrice);",
    "```",
    "",
    "The `_closePosition` function already handles the remaining margin correctly.",
    "After the transfer, the margin in the vault is automatically reduced by `bonus`.",
    "The PnL settlement in `_closePosition` should use the original `pnl` without subtracting the bonus.",
    "",
    "## File",
    "",
    "- `src/perps/PerpEngine.sol:295` - fix `pnl - int256(bonus)` to just `pnl`",
    "- `test/perps/GoodPerps.t.sol` - add liquidation bonus accounting test",
])

body = {
    'title': 'bug(perps): liquidation bonus double-deducted from trader vault (PerpEngine.sol:295)',
    'description': desc,
    'status': 'todo',
    'priority': 'critical',
    'goalId': '0441afc4-0005-4ebc-bfbb-49775288773b',
    'assigneeAgentId': 'b67dca66-0fa7-4ed5-9c94-7d02d4ecd832',
}

result = pc_api.api('POST', '/companies/7e8ba4ed-e545-4394-ad98-c0c855409a4e/issues', body)
print(json.dumps(result, indent=2))
