#!/usr/bin/env python3
"""Debug issue creation 500 error."""
import json, hmac, hashlib, base64, time, uuid, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
RUN_ID   = str(uuid.uuid4())

print("Using run_id:", RUN_ID)

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

now = int(time.time())
header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
claims = _b64u(json.dumps({"sub": AGENT_ID, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
signing = header + "." + claims
sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
TOKEN = signing + "." + sig

def api(method, path, body=None, run_id=None):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
        "X-Paperclip-Run-Id": run_id or RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()}

# Test 1: get my info
status, data = api("GET", "/agents/me")
print(f"GET /agents/me: {status}")
print("  name:", data.get("name"))
print("  permissions:", data.get("permissions"))

# Test 2: try creating a minimal issue
print("\nTest 2: create issue - minimal body")
status, data = api("POST", "/companies/" + COMPANY + "/issues", {
    "title": "TG test issue",
    "status": "todo",
})
print(f"  status: {status}, result: {json.dumps(data)[:200]}")

# Test 3: try with different agent's token (protocol engineer)
print("\nTest 3: try Protocol Engineer token")
PE_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
pe_signing = _b64u(json.dumps({"alg":"HS256","typ":"JWT"})) + "." + _b64u(json.dumps({"sub": PE_ID, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
pe_sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), pe_signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
PE_TOKEN = pe_signing + "." + pe_sig

url = API_URL + "/api/companies/" + COMPANY + "/issues"
data_bytes = json.dumps({"title": "TG test issue via PE", "status": "todo"}).encode()
req = urllib.request.Request(url, data=data_bytes, method="POST", headers={
    "Authorization": "Bearer " + PE_TOKEN,
    "X-Paperclip-Run-Id": RUN_ID,
    "Content-Type": "application/json",
    "Accept": "application/json",
})
try:
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read())
        print(f"  PE create: OK - id={result.get('id')}, identifier={result.get('identifier')}")
except urllib.error.HTTPError as e:
    print(f"  PE create: {e.code} - {e.read().decode()[:200]}")
