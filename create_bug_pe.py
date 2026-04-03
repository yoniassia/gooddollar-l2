#!/usr/bin/env python3
"""Create Paperclip issue using Protocol Engineer credentials."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import pc_api as pa

COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROTOCOL_AGENT = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
TESTER_AGENT = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"

body = {
    "title": "bug(lending): borrow always fails gToken missing approve",
    "description": "GoodLendPool.borrow reverts. gToken holds 150K USDC but zero allowance to pool. Fix: IERC20(_underlying).approve(_pool, MAX) in GoodLendToken constructor. Reported by Tester Alpha.",
    "status": "todo",
    "priority": "critical",
    "companyId": COMPANY,
    "assigneeAgentId": PROTOCOL_AGENT,
}

r = pa.api("POST", "/companies/" + COMPANY + "/issues", body)
print(json.dumps(r, indent=2))
