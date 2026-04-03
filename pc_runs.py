#!/usr/bin/env python3
"""Fetch heartbeat runs and find run IDs for issues."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000001"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token():
    now = int(time.time())
    header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    claims = _b64u(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY,
        "adapter_type": "claude_local", "run_id": RUN_ID,
        "iat": now, "exp": now + 7200,
        "iss": "paperclip", "aud": "paperclip-api"
    }))
    signing = f"{header}.{claims}"
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{signing}.{sig}"

TOKEN = _make_token()

def api(method, path, body=None):
    url = f"{API_URL}/api{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {TOKEN}",
        "X-Paperclip-Run-Id": RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

runs = api("GET", f"/companies/{COMPANY}/heartbeat-runs?agentId={AGENT_ID}")
if isinstance(runs, list):
    for r in runs[:20]:
        status = r.get("status")
        issue_id = r.get("triggeredByIssueId") or r.get("issueId")
        run_id = r.get("id")
        print(f"{status:15} run={run_id} issue={issue_id}")
else:
    print(json.dumps(runs, indent=2))
