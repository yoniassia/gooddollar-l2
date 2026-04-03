#!/usr/bin/env python3
"""Check company projects and try to create issue in specific project."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
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

# Check company projects
print("Company projects:")
status, data = api("GET", "/companies/" + COMPANY + "/projects")
projects = data if isinstance(data, list) else data.get("projects", [])
for p in projects:
    print(f"  {p.get('urlKey')} | {p.get('id')} | {p.get('name')}")

# Check company goals
print("\nCompany goals:")
status, data = api("GET", "/companies/" + COMPANY + "/goals")
goals = data if isinstance(data, list) else data.get("goals", [])
for g in goals:
    print(f"  {g.get('id')[:12]}... | {g.get('title')}")

# Check issue prefix
print("\nCompany details:")
status, data = api("GET", "/companies/" + COMPANY)
print(f"  name: {data.get('name')}")
print(f"  issuePrefix: {data.get('issuePrefix')}")
print(f"  issueCounter: {data.get('issueCounter')}")
print(f"  maxIssues: {data.get('maxIssues')}")
keys = [k for k in data.keys() if 'issue' in k.lower() or 'limit' in k.lower() or 'counter' in k.lower()]
for k in keys:
    print(f"  {k}: {data.get(k)}")
