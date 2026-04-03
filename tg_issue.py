#!/usr/bin/env python3
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

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

def api_get(path):
    url = API_URL + "/api" + path
    req = urllib.request.Request(url, method="GET", headers={"Authorization": "Bearer " + TOKEN, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

def api_post(path, body):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={"Authorization": "Bearer " + TOKEN, "X-Paperclip-Run-Id": RUN_ID, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

def api_patch(path, body, run_id=None):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH", headers={"Authorization": "Bearer " + TOKEN, "X-Paperclip-Run-Id": run_id or RUN_ID, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "get"
    if cmd == "get":
        data = api_get("/issues/" + sys.argv[2])
        print(json.dumps(data, indent=2))
    elif cmd == "children":
        data = api_get("/companies/" + COMPANY + "/issues?parentId=" + sys.argv[2])
        issues = data if isinstance(data, list) else data.get("issues", [])
        for i in issues:
            print(i.get("identifier","?"), "|", i.get("status","?"), "|", i.get("title",""))
    elif cmd == "create":
        body = json.loads(sys.argv[2])
        result = api_post("/companies/" + COMPANY + "/issues", body)
        print(json.dumps(result, indent=2))
    elif cmd == "checkout":
        result = api_post("/issues/" + sys.argv[2] + "/checkout", {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        print(json.dumps(result, indent=2))
    elif cmd == "patch":
        checkout = api_post("/issues/" + sys.argv[2] + "/checkout", {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        run_id = checkout.get("checkoutRunId") or RUN_ID
        result = api_patch("/issues/" + sys.argv[2], json.loads(sys.argv[3]), run_id=run_id)
        print(json.dumps(result, indent=2))
    elif cmd == "comment":
        checkout = api_post("/issues/" + sys.argv[2] + "/checkout", {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
        run_id = checkout.get("checkoutRunId") or RUN_ID
        result = api_post("/issues/" + sys.argv[2] + "/comments", {"body": sys.argv[3]})
        print(json.dumps(result, indent=2))
