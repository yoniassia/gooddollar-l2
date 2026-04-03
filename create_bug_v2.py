#!/usr/bin/env python3
"""Create issue with full error reporting."""
import sys, json, urllib.request, urllib.error
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

url = t.API_URL + "/api/companies/" + COMPANY + "/issues"
data = json.dumps(body).encode()
req = urllib.request.Request(url, data=data, method="POST", headers={
    "Authorization": "Bearer " + t.TOKEN,
    "X-Paperclip-Run-Id": t.RUN_ID,
    "Content-Type": "application/json",
    "Accept": "application/json",
})
try:
    with urllib.request.urlopen(req) as r:
        print("Status:", r.status)
        print(json.dumps(json.loads(r.read()), indent=2))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.reason)
    body = e.read()
    print("Response:", body.decode('utf-8', errors='replace'))
except Exception as e:
    print("Exception:", e)
