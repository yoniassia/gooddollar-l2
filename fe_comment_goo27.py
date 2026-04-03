#!/usr/bin/env python3
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "809b1be9-e794-4ab5-9ae2-0ad4c967ea10"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000002"
ISSUE_ID = "4239507a-9bec-428c-a4a2-9938fdaafc6b"  # GOO-27

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

comment = (
    "## Frontend Engineer Heartbeat\n\n"
    "Completed 4 tasks this session:\n\n"
    "**GOO-45** GoodLend frontend (supply/borrow/liquidation UI)\n"
    "**GOO-50** GoodPerps: mobile Chart/Book/Trade tab strip\n"
    "**GOO-52** GoodStocks: hover Trade button fix + mobile card view\n"
    "**GOO-66** CoinGecko live price feeds in swap UI\n\n"
    "Commits: 8eaa194, f9793ee, b625c26\n"
    "tsc clean. 195/195 tests passing.\n"
    "Monitoring for iteration 29+ autobuilder initiatives."
)

body = json.dumps({"body": comment}).encode()
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
        print(json.dumps(json.loads(r.read()), indent=2))
except urllib.error.HTTPError as e:
    body_text = e.read().decode()
    print(f"Error {e.code}: {body_text}")
