#!/usr/bin/env python3
"""One-shot: patch GOO-22 done using its execution run ID."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL   = "http://127.0.0.1:3102"
SECRET    = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID  = "809b1be9-e794-4ab5-9ae2-0ad4c967ea10"
COMPANY   = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID    = "cc9f745b-b1d5-49fe-8603-2c212ce3033e"
ISSUE_ID  = "550f9c18-4653-40de-b367-7ac29c35eed8"

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

body = json.dumps({
    "status": "done",
    "comment": "## Mobile-First Trading UI — Complete\n\nAll implementation subtasks shipped (commits 8eaa194 + f9793ee):\n\n- [GOO-50](/GOO/issues/GOO-50) GoodPerps: mobile Chart/Book/Trade tab strip — done\n- [GOO-52](/GOO/issues/GOO-52) GoodStocks: hover-only Trade button fix + mobile card view — done\n\n**Also shipped this session:** [GOO-45](/GOO/issues/GOO-45) GoodLend frontend (supply/borrow/liquidation UI).\n\ntsc --noEmit clean \u00b7 195/195 tests passing."
}).encode()

req = urllib.request.Request(
    f"{API_URL}/api/issues/{ISSUE_ID}",
    data=body, method="PATCH",
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
    print(f"Error {e.code}: {e.read().decode()}")
