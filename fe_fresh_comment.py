#!/usr/bin/env python3
"""Try posting a comment with a fresh run UUID."""
import json, hmac, hashlib, base64, time, uuid, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "809b1be9-e794-4ab5-9ae2-0ad4c967ea10"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = str(uuid.uuid4())  # fresh run ID each invocation

print(f"Using run_id: {RUN_ID}")

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

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
TOKEN = f"{signing}.{sig}"

ISSUE_ID = "4239507a-9bec-428c-a4a2-9938fdaafc6b"  # GOO-27

body = json.dumps({"body": "ping"}).encode()
req = urllib.request.Request(
    f"{API_URL}/api/issues/{ISSUE_ID}/comments",
    data=body, method="POST",
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "X-Paperclip-Run-Id": RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
)
try:
    with urllib.request.urlopen(req) as r:
        print("OK:", r.status)
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}: {e.read().decode()}")
