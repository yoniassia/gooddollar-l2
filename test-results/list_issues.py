#!/usr/bin/env python3
"""List open issues from Paperclip."""
import json, time, hmac, hashlib, base64, urllib.request, urllib.error, sys

API_URL = "http://127.0.0.1:3102"
SECRET  = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000003"

def b64u(data):
    return base64.urlsafe_b64encode(data if isinstance(data, bytes) else data.encode()).rstrip(b"=").decode()

def make_jwt():
    header = b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    now = int(time.time())
    payload = b64u(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY,
        "adapter_type": "claude_local", "run_id": RUN_ID,
        "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"
    }))
    msg = f"{header}.{payload}".encode()
    sig = b64u(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def api(method, path, body=None):
    token = make_jwt()
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Paperclip-Run-Id", RUN_ID)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

status = sys.argv[1] if len(sys.argv) > 1 else "todo"
r = api("GET", f"/companies/{COMPANY}/issues?limit=30&status={status}")
if isinstance(r, list):
    items = r
elif isinstance(r, dict) and "items" in r:
    items = r["items"]
else:
    print(json.dumps(r, indent=2))
    items = []

for i in items:
    assignee = i.get("assigneeAgentId", "")[-8:] if i.get("assigneeAgentId") else "unassigned"
    print(f"  {i.get('identifier','?'):10} [{i.get('priority','?'):6}] [{assignee}] {i.get('title','?')[:70]}")
