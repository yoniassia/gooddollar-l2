#!/usr/bin/env python3
"""Checkout GOO-155 and GOO-182 with fresh run IDs."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error, uuid

API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

GOO_155_ID = "5611fcf5-76cd-477f-94f3-b70e0bc59d56"
GOO_182_ID = "1c0b7f78-b718-47cb-b8b7-f3549965dc3e"
# GOO-182 has an active run already
GOO_182_RUN = "72019c47-8046-4d10-9268-c14e2a46f968"

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
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            return json.loads(e.read())

    return api, run_id

if __name__ == "__main__":
    import sys
    issue = sys.argv[1] if len(sys.argv) > 1 else "goo155"

    if issue == "goo155":
        run_id = str(uuid.uuid4())
        api, run_id = make_api(run_id)
        print("RUN_ID:", run_id)
        result = api("POST", "/issues/" + GOO_155_ID + "/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo", "backlog", "blocked", "in_progress"]})
        print(json.dumps(result, indent=2))

    elif issue == "goo182":
        # Try with the existing active run ID
        api, run_id = make_api(GOO_182_RUN)
        print("RUN_ID:", run_id)
        result = api("POST", "/issues/" + GOO_182_ID + "/checkout",
            {"agentId": AGENT_ID, "expectedStatuses": ["todo", "backlog", "blocked", "in_progress"]})
        print(json.dumps(result, indent=2))

    elif issue == "patch155":
        run_id = sys.argv[2]
        body = json.loads(sys.argv[3])
        api, run_id = make_api(run_id)
        result = api("PATCH", "/issues/" + GOO_155_ID, body)
        print(json.dumps(result, indent=2))

    elif issue == "patch182":
        run_id = GOO_182_RUN
        body = json.loads(sys.argv[2])
        api, run_id = make_api(run_id)
        result = api("PATCH", "/issues/" + GOO_182_ID, body)
        print(json.dumps(result, indent=2))

    elif issue == "comment155":
        run_id = sys.argv[2]
        body = sys.argv[3]
        api, run_id = make_api(run_id)
        result = api("POST", "/issues/" + GOO_155_ID + "/comments", {"body": body})
        print(json.dumps(result, indent=2))

    elif issue == "comment182":
        run_id = GOO_182_RUN
        body = sys.argv[2]
        api, run_id = make_api(run_id)
        result = api("POST", "/issues/" + GOO_182_ID + "/comments", {"body": body})
        print(json.dumps(result, indent=2))
