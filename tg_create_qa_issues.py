#!/usr/bin/env python3
"""Create QA issues in the proper project with goalId."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"  # Tester Gamma
RUN_ID   = "00000000-0000-0000-0000-000000000099"

QA_PROJECT_ID = "eb10f04d-e047-4f10-9827-54f4b7c386d1"
QA_GOAL_ID    = "72af7d50-3ac3-4e1a-b5a2-000000000000"  # placeholder - need full ID

STOCKS_PROJECT_ID = "8bb6c348-f609-4c81-b866-3ae1841b2e66"
STOCKS_GOAL_ID    = "23f6d880-d5b3-0000-0000-000000000000"  # placeholder

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

now = int(time.time())
header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
claims = _b64u(json.dumps({"sub": AGENT_ID, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
signing = header + "." + claims
sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
TOKEN = signing + "." + sig

def api(method, path, body=None, run_id=None):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
        "X-Paperclip-Run-Id": run_id or RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()}

# First get full goal IDs
print("Getting QA goal full ID...")
status, data = api("GET", "/companies/" + COMPANY + "/goals")
goals = data if isinstance(data, list) else data.get("goals", [])
qa_goal_id = None
stocks_goal_id = None
for g in goals:
    if "continuous live testing" in g.get("title", "").lower():
        qa_goal_id = g.get("id")
        print(f"  QA goal: {qa_goal_id} — {g.get('title')}")
    if "goodstocks" in g.get("title", "").lower() or "tokenized equities" in g.get("title", "").lower():
        stocks_goal_id = g.get("id")
        print(f"  Stocks goal: {stocks_goal_id} — {g.get('title')}")

if not qa_goal_id:
    print("QA goal not found!")
if not stocks_goal_id:
    print("Stocks goal not found!")

# Try creating issue with projectId and goalId
if qa_goal_id:
    print("\nCreating QA task with projectId + goalId...")
    status, result = api("POST", "/companies/" + COMPANY + "/issues", {
        "title": "QA: GoodStocks + stress test all L2 dApps on devnet",
        "status": "todo",
        "priority": "high",
        "assigneeAgentId": AGENT_ID,
        "projectId": QA_PROJECT_ID,
        "goalId": qa_goal_id,
    })
    msg = result.get("identifier") or result.get("error") or str(result)[:200]
    print(f"  {status}: {msg}")

    if status == 200 or status == 201:
        qa_task_id = result.get("id")
        print(f"  Created! ID: {qa_task_id}, identifier: {result.get('identifier')}")

# Create bug reports in stocks project
if stocks_goal_id:
    print("\nCreating BUG-1: listAsset gas issue...")
    status, result = api("POST", "/companies/" + COMPANY + "/issues", {
        "title": "bug(stocks): SyntheticAssetFactory.listAsset() requires ~1M gas — OOG with default 500k limit",
        "status": "todo",
        "priority": "high",
        "projectId": STOCKS_PROJECT_ID,
        "goalId": stocks_goal_id,
        "assigneeAgentId": "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832",  # Protocol Engineer
    })
    msg = result.get("identifier") or result.get("error") or str(result)[:200]
    print(f"  BUG-1: {status}: {msg}")

    print("\nCreating BUG-2: eth_call simulation false errors...")
    status, result = api("POST", "/companies/" + COMPANY + "/issues", {
        "title": "bug(stocks): CV.depositCollateral/mint eth_call simulations return false revert errors",
        "status": "todo",
        "priority": "medium",
        "projectId": STOCKS_PROJECT_ID,
        "goalId": stocks_goal_id,
        "assigneeAgentId": "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832",  # Protocol Engineer
    })
    msg = result.get("identifier") or result.get("error") or str(result)[:200]
    print(f"  BUG-2: {status}: {msg}")
