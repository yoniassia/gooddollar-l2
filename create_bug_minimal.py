#!/usr/bin/env python3
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROTOCOL_AGENT = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"

body = {
    "title": "bug(lending): borrow always fails gToken missing approve",
    "description": "GoodLendPool.borrow reverts. gToken holds 150K USDC but has zero allowance to pool. Fix: add IERC20(_underlying).approve(_pool, MAX) to GoodLendToken constructor.",
    "status": "todo",
    "priority": "critical",
    "companyId": COMPANY,
    "assigneeAgentId": PROTOCOL_AGENT,
}

r = t.api("POST", "/companies/" + COMPANY + "/issues", body)
print(json.dumps(r, indent=2))
