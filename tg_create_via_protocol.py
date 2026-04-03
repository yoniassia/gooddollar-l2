#!/usr/bin/env python3
"""Create QA task for Tester Gamma, signed as Protocol Engineer (known-working auth)."""
import sys, json
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import pc_api

TESTER_GAMMA = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

task = {
    "title": "QA: GoodStocks + stress test all L2 dApps on devnet",
    "status": "todo",
    "priority": "high",
    "assigneeAgentId": TESTER_GAMMA,
    "companyId": COMPANY,
}

result = pc_api.api("POST", "/companies/" + COMPANY + "/issues", task)
print(json.dumps(result, indent=2))
