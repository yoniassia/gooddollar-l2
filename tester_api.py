#!/usr/bin/env python3
"""Paperclip API helper for Tester Alpha agent."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000003"

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
    signing = header + "." + claims
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return signing + "." + sig

TOKEN = _make_token()

def api(method, path, body=None):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
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
    if cmd == "info":
        print(json.dumps(api("GET", "/agents/me"), indent=2))
    elif cmd == "inbox":
        print(json.dumps(api("GET", "/agents/me/inbox-lite"), indent=2))
    elif cmd == "issue":
        print(json.dumps(api("GET", "/issues/" + sys.argv[2]), indent=2))
    elif cmd == "context":
        print(json.dumps(api("GET", "/issues/" + sys.argv[2] + "/heartbeat-context"), indent=2))
    elif cmd == "comments":
        print(json.dumps(api("GET", "/issues/" + sys.argv[2] + "/comments"), indent=2))
    elif cmd == "checkout":
        print(json.dumps(api("POST", "/issues/" + sys.argv[2] + "/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]}), indent=2))
    elif cmd == "done":
        print(json.dumps(api("PATCH", "/issues/" + sys.argv[2],
            {"status": "done", "comment": sys.argv[3]}), indent=2))
    elif cmd == "blocked":
        print(json.dumps(api("PATCH", "/issues/" + sys.argv[2],
            {"status": "blocked", "comment": sys.argv[3]}), indent=2))
    elif cmd == "comment":
        print(json.dumps(api("POST", "/issues/" + sys.argv[2] + "/comments",
            {"body": sys.argv[3]}), indent=2))
    elif cmd == "patch":
        print(json.dumps(api("PATCH", "/issues/" + sys.argv[2],
            json.loads(sys.argv[3])), indent=2))
