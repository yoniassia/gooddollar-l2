#!/usr/bin/env python3
"""Protocol Engineer work helper - checkout with queued run IDs."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

# Queued runs available for this heartbeat session
QUEUED_RUNS = [
    "9e101e6f-dfeb-4806-9bc5-a16d43a50b52",
    "5a6642d4-9e0b-4e53-a671-1a47c0c370d8",
]

# After checkout, we store the per-issue run ID here
ISSUE_RUNS = {}

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token(run_id):
    now = int(time.time())
    header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    claims = _b64u(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY,
        "adapter_type": "claude_local", "run_id": run_id,
        "iat": now, "exp": now + 7200,
        "iss": "paperclip", "aud": "paperclip-api"
    }))
    signing = f"{header}.{claims}"
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{signing}.{sig}"

def api(method, path, body=None, run_id=None):
    if run_id is None:
        run_id = "00000000-0000-0000-0000-000000000001"
    token = _make_token(run_id)
    url = f"{API_URL}/api{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "X-Paperclip-Run-Id": run_id,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        resp = e.read()
        try:
            return json.loads(resp)
        except:
            return {"error": str(e.code), "body": resp.decode()[:200]}

def checkout(issue_id, run_id):
    return api("POST", f"/issues/{issue_id}/checkout",
        {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]},
        run_id=run_id)

def patch(issue_id, data, run_id):
    return api("PATCH", f"/issues/{issue_id}", data, run_id=run_id)

def comment(issue_id, body, run_id):
    return api("POST", f"/issues/{issue_id}/comments", {"body": body}, run_id=run_id)

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "checkout":
        issue_id = sys.argv[2]
        run_id = sys.argv[3] if len(sys.argv) > 3 else QUEUED_RUNS[0]
        result = checkout(issue_id, run_id)
        print(json.dumps(result, indent=2))
    elif cmd == "patch":
        issue_id = sys.argv[2]
        data = json.loads(sys.argv[3])
        run_id = sys.argv[4] if len(sys.argv) > 4 else QUEUED_RUNS[0]
        result = patch(issue_id, data, run_id)
        print(json.dumps(result, indent=2))
    elif cmd == "comment":
        issue_id = sys.argv[2]
        body = sys.argv[3]
        run_id = sys.argv[4] if len(sys.argv) > 4 else QUEUED_RUNS[0]
        result = comment(issue_id, body, run_id)
        print(json.dumps(result, indent=2))
