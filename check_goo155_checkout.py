#!/usr/bin/env python3
"""Debug checkout for GOO-155."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error, uuid

API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

GOO_155_ID = "5611fcf5-76cd-477f-94f3-b70e0bc59d56"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def make_api(run_id):
    def _make_token():
        now = int(time.time())
        header = _b64u(json.dumps({"alg": "HS256", "typ": "JWT"}))
        claims = _b64u(json.dumps({
            "sub": AGENT_ID, "company_id": COMPANY,
            "adapter_type": "claude_local", "run_id": run_id,
            "iat": now, "exp": now + 7200,
            "iss": "paperclip", "aud": "paperclip-api"
        }))
        signing = header + "." + claims
        sig = base64.urlsafe_b64encode(
            hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
        ).rstrip(b"=").decode()
        return signing + "." + sig

    token = _make_token()

    def api(method, path, body=None):
        url = API_URL + "/api" + path
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": "Bearer " + token,
            "X-Paperclip-Run-Id": run_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        try:
            with urllib.request.urlopen(req) as r:
                raw = r.read()
                print("Status:", r.status)
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            raw = e.read()
            print("HTTP Error:", e.code)
            try:
                return json.loads(raw)
            except Exception:
                print("Raw response:", raw[:500])
                return None

    return api

if __name__ == "__main__":
    # Try with a fresh UUID
    run_id = str(uuid.uuid4())
    print("Trying checkout with run_id:", run_id)
    api = make_api(run_id)
    result = api("POST", "/issues/" + GOO_155_ID + "/checkout",
        {"agentId": AGENT_ID, "expectedStatuses": ["todo", "backlog", "blocked", "in_progress"]})
    print(json.dumps(result, indent=2) if result else "None")
