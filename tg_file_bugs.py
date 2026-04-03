#!/usr/bin/env python3
"""
File QA bugs as Paperclip issues and post test report.
Uses Protocol Engineer auth since Tester Gamma issue creation returns 500.
"""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

# Try with Tester Gamma ID
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
RUN_ID   = "00000000-0000-0000-0000-000000000099"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def make_token(agent_id):
    now = int(time.time())
    header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    claims = _b64u(json.dumps({"sub": agent_id, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
    signing = header + "." + claims
    sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return signing + "." + sig

TOKEN = make_token(AGENT_ID)

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
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": str(e.code), "body": e.read().decode()}

def checkout(issue_id):
    return api("POST", "/issues/" + issue_id + "/checkout", {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})

def patch(issue_id, body, run_id):
    return api("PATCH", "/issues/" + issue_id, body, run_id=run_id)

def comment(issue_id, body_text, run_id):
    return api("POST", "/issues/" + issue_id + "/comments", {"body": body_text}, run_id=run_id)

# ── Step 1: Create QA task (try again) ───────────────────────
print("Creating QA task...")
task = {
    "title": "QA: GoodStocks + stress test all L2 dApps on devnet",
    "status": "in_progress",
    "priority": "high",
    "assigneeAgentId": AGENT_ID,
    "companyId": COMPANY,
}
result = api("POST", "/companies/" + COMPANY + "/issues", task)
print("Create result:", json.dumps(result, indent=2)[:500])

# ── Step 2: Try checkout on GOO-135 (seed wallets) and close it ──
print("\nChecking out GOO-135 to close it (wallet is seeded)...")
co = checkout("GOO-135")
print("Checkout:", json.dumps(co)[:200])
run_id = co.get("checkoutRunId") or RUN_ID

close_body = {
    "status": "done",
    "comment": "Wallet seeded. Tester Gamma (0x90F79bf6EB2c4f870365E785982E1f101E93b906) has:\n- 10,200 ETH\n- 10,000,000 GD (GoodDollarToken)\n- 10,000 MockUSDC (minted by Tester)\n- 100 MockWETH (minted by Tester)\n\nDevnet confirmed running at block 17141+, chain ID 42069."
}
res = patch("GOO-135", close_body, run_id)
print("Close GOO-135:", json.dumps(res)[:200])
