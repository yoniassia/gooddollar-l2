#!/usr/bin/env python3
"""Create a QA test task for Tester Gamma - minimal payload."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000099"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

now = int(time.time())
header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
claims = _b64u(json.dumps({"sub": AGENT_ID, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
signing = header + "." + claims
sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
TOKEN = signing + "." + sig

def api_post(path, body):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={"Authorization": "Bearer " + TOKEN, "X-Paperclip-Run-Id": RUN_ID, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_resp = e.read()
        print("HTTP Error:", e.code, body_resp)
        return {}

task = {
    "title": "QA: GoodStocks + stress test all L2 dApps on devnet",
    "status": "todo",
    "priority": "high",
    "assigneeAgentId": AGENT_ID,
    "parentId": "9b191118-cb7f-411b-86db-53904fe5f480",
}

result = api_post("/companies/" + COMPANY + "/issues", task)
print(json.dumps(result, indent=2))
