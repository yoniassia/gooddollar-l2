#!/usr/bin/env python3
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error
import uuid

API_URL = "http://127.0.0.1:3102"
SECRET  = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = str(uuid.uuid4())

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
print("Run ID:", RUN_ID)

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
        body_data = e.read()
        print("HTTP Error", e.code, body_data[:500])
        try:
            return json.loads(body_data)
        except:
            return {"error": str(e.code)}

issue_id = sys.argv[1] if len(sys.argv) > 1 else "5be5fef5-0edc-4729-98a7-8d2d54a71704"

result = api("POST", f"/issues/{issue_id}/checkout",
    {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
print(json.dumps(result, indent=2))
