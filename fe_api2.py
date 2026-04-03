#!/usr/bin/env python3
"""Paperclip API helper - uses active run ID for GOO-183."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL   = "http://127.0.0.1:3102"
SECRET    = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID  = "809b1be9-e794-4ab5-9ae2-0ad4c967ea10"
COMPANY   = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID    = "f3e6d914-2a2f-4c14-ad47-d1e68b0cac7e"  # active run for GOO-183

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token():
    now = int(time.time())
    header  = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    claims  = _b64u(json.dumps({
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
        return {"error": e.code, "body": e.read().decode()}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "info"
    if cmd == "checkout":
        print(json.dumps(api("POST", f"/issues/{sys.argv[2]}/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]}), indent=2))
    elif cmd == "done":
        print(json.dumps(api("PATCH", f"/issues/{sys.argv[2]}",
            {"status": "done", "comment": sys.argv[3]}), indent=2))
    elif cmd == "blocked":
        print(json.dumps(api("PATCH", f"/issues/{sys.argv[2]}",
            {"status": "blocked", "comment": sys.argv[3]}), indent=2))
    elif cmd == "comment":
        print(json.dumps(api("POST", f"/issues/{sys.argv[2]}/comments",
            {"body": sys.argv[3]}), indent=2))
    elif cmd == "patch":
        print(json.dumps(api("PATCH", f"/issues/{sys.argv[2]}",
            json.loads(sys.argv[3])), indent=2))
    elif cmd == "get":
        print(json.dumps(api("GET", sys.argv[2]), indent=2))
