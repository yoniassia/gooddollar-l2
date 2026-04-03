#!/usr/bin/env python3
import json, hmac, hashlib, base64, time

SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "809b1be9-e794-4ab5-9ae2-0ad4c967ea10"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000002"

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
print(f"{signing}.{sig}")
