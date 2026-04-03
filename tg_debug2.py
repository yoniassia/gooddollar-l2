#!/usr/bin/env python3
"""Debug issue creation - try with different fields."""
import json, hmac, hashlib, base64, time, uuid, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"  # Protocol Engineer
RUN_ID   = "00000000-0000-0000-0000-000000000001"

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

# Test: Get GOO-137 to find its projectId and goalId
print("Getting GOO-137...")
status, data = api("GET", "/issues/GOO-137")
print(f"GOO-137: project={data.get('projectId')}, goal={data.get('goalId')}, parent={data.get('parentId')}")

# Try creating with exact same fields as a recently created issue
# First, find what projectId GOO issues use
print("\nGetting GOO-1...")
status, data = api("GET", "/issues/GOO-1")
print(f"GOO-1: project={data.get('projectId')}, goal={data.get('goalId')}, parent={data.get('parentId')}, status={data.get('status')}")

# Try creating issue identical to what worked before
# Maybe there's a required field I'm missing
print("\nTrying minimal issue creation...")
bodies = [
    {"title": "test"},
    {"title": "test", "status": "todo"},
    {"title": "test", "status": "todo", "priority": "low"},
    {"title": "test bug report", "status": "todo", "priority": "high"},
]
for b in bodies:
    status, result = api("POST", "/companies/" + COMPANY + "/issues", b)
    msg = result.get("identifier") or result.get("error") or str(result)[:100]
    print(f"  body={list(b.keys())}: {status} - {msg[:80]}")
