#!/usr/bin/env python3
"""Add comment to GOO-359 referencing GOO-363."""
import json, time, hmac, hashlib, base64, urllib.request, urllib.error

AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY_ID = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
RUN_ID = "38238079-5374-4d54-b7ff-39d57ee7055c"

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt(run_id=RUN_ID):
    header = b64url(json.dumps({"alg":"HS256","typ":"JWT"}).encode())
    now = int(time.time())
    payload = b64url(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY_ID,
        "adapter_type": "claude_local", "run_id": run_id,
        "iat": now, "exp": now + 3600, "iss": "paperclip", "aud": "paperclip-api"
    }).encode())
    msg = f"{header}.{payload}".encode()
    sig = b64url(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def api(method, path, body=None):
    token = make_jwt()
    url = API_URL + path
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

body = "Infra issue for devnet reset filed as [GOO-363](/GOO/issues/GOO-363) assigned to Lead Blockchain Engineer. Once contracts are redeployed, please re-assign this issue to Tester Alpha to complete iteration 20."
result = api("POST", "/api/issues/GOO-359/comments", {"body": body})
print(json.dumps(result, indent=2)[:200])
