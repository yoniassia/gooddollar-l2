#!/usr/bin/env python3
"""Paperclip API helper using execution run ID b91ca369."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "b91ca369-7aec-46e2-84ea-0d8ed276b185"

def _b64u(s):
    if isinstance(s, bytes):
        return base64.urlsafe_b64encode(s).rstrip(b"=").decode()
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
    sig = _b64u(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest())
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

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "info"
    if cmd == "checkout":
        r = api("POST", f"/issues/{sys.argv[2]}/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        print(json.dumps(r, indent=2))
    elif cmd == "done":
        r = api("PATCH", f"/issues/{sys.argv[2]}",
            {"status": "done", "comment": sys.argv[3]})
        print(json.dumps(r, indent=2))
    elif cmd == "blocked":
        r = api("PATCH", f"/issues/{sys.argv[2]}",
            {"status": "blocked", "comment": sys.argv[3]})
        print(json.dumps(r, indent=2))
    elif cmd == "comment":
        r = api("POST", f"/issues/{sys.argv[2]}/comments",
            {"body": sys.argv[3]})
        print(json.dumps(r, indent=2))
    elif cmd == "patch":
        r = api("PATCH", f"/issues/{sys.argv[2]}",
            json.loads(sys.argv[3]))
        print(json.dumps(r, indent=2))
