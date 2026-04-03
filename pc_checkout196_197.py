#!/usr/bin/env python3
"""Checkout GOO-196 and GOO-197 using execution run cd7f52b2."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "cd7f52b2-66b2-4c31-a2a4-be8dd9670747"

def b64u(s):
    if isinstance(s, bytes):
        return base64.urlsafe_b64encode(s).rstrip(b"=").decode()
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def make_token():
    now = int(time.time())
    h = b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    c = b64u(json.dumps({"sub": AGENT_ID, "company_id": COMPANY, "adapter_type": "claude_local",
        "run_id": RUN_ID, "iat": now, "exp": now+7200, "iss": "paperclip", "aud": "paperclip-api"}))
    s = b64u(hmac.new(SECRET.encode(), f"{h}.{c}".encode(), hashlib.sha256).digest())
    return f"{h}.{c}.{s}"

TOKEN = make_token()

def api(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"{API_URL}/api{path}", data=data, method=method, headers={
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
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "checkout_both"
    if cmd == "checkout_both":
        r196 = api("POST", "/issues/6979e3e6-3f68-459a-a547-adea38ca3a72/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        print("GOO-196:", r196.get("status"), r196.get("identifier"))
        r197 = api("POST", "/issues/998c60b9-2b2a-4253-af9d-347b11602d76/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        print("GOO-197:", r197.get("status"), r197.get("identifier"))
    elif cmd == "done":
        r = api("PATCH", f"/issues/{sys.argv[2]}", {"status": "done", "comment": sys.argv[3]})
        print(json.dumps(r, indent=2))
    elif cmd == "comment":
        r = api("POST", f"/issues/{sys.argv[2]}/comments", {"body": sys.argv[3]})
        print(json.dumps(r, indent=2))
    elif cmd == "patch":
        r = api("PATCH", f"/issues/{sys.argv[2]}", json.loads(sys.argv[3]))
        print(json.dumps(r, indent=2))
