#!/usr/bin/env python3
"""Patch an issue using its associated run ID."""
import sys, json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL   = "http://127.0.0.1:3102"
SECRET    = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID  = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY   = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

ISSUE_RUNS = {
    "037284af-f813-49a4-81f4-27af0abe6621": "2b47b3e1-1653-4964-9c31-bf4522b28b0b",  # GOO-77
    "4232fc73-7544-4ced-8aff-690ef61056ea": "7042ac7c-1199-4e22-8527-ededf22f2cc5",  # GOO-72
    "9aa623f6-3f76-4ea0-bcbc-e8a55a507c2a": "ccef0f80-1e82-4734-801b-2ca2d7e37218",  # GOO-67
    "caa07994-d197-455b-9169-6f7462cfcd72": "2bff5dfa-3d7e-4cad-8e6d-e74a6b6a5504",  # GOO-62
    "bdeb6f6b-cf78-4a0c-a653-06f6ff6e2971": "02e4b566-ae30-45da-94a9-eb7f08b8813f",  # GOO-79
    "c469d6a3-6a3c-4ff2-b83f-dcff60770711": "ab629677-d690-47eb-815e-33b049f92194",  # GOO-75
    "ad52809d-0608-45f8-9551-86dacfee4646": "83f6b2ad-e6cd-4801-9299-978276ba4828",  # GOO-73
    "8075d25d-67d2-4fdf-a34b-1813bbc2843b": "77be3eaf-f4eb-4383-aff3-5830cb8640bb",  # GOO-68
    "676b5548-07ea-4650-b139-ef4f42e0b437": "53ae7091-b28a-4540-89fe-ea33ceb4e1ad",  # GOO-65
    "fa2453e6-6bcb-458b-9f2e-32f9e82d394f": "493b31cb-295e-4ee3-922e-e84ae3a0126c",  # GOO-63
}

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token(run_id):
    now = int(time.time())
    header  = _b64u(json.dumps({"alg": "HS256", "typ": "JWT"}))
    payload = {
        "sub": AGENT_ID, "company_id": COMPANY,
        "adapter_type": "claude_local", "run_id": run_id,
        "iat": now, "exp": now + 7200,
        "iss": "paperclip", "aud": "paperclip-api"
    }
    claims  = _b64u(json.dumps(payload))
    signing = f"{header}.{claims}"
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{signing}.{sig}"

def api(method, path, body=None, run_id=None):
    if run_id is None:
        run_id = "00000000-0000-0000-0000-000000000001"
    token = _make_token(run_id)
    url = f"{API_URL}/api{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "X-Paperclip-Run-Id": run_id,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

if __name__ == "__main__":
    issue_id = sys.argv[1]
    patch = json.loads(sys.argv[2])
    run_id = ISSUE_RUNS.get(issue_id, "00000000-0000-0000-0000-000000000001")
    result = api("PATCH", f"/issues/{issue_id}", patch, run_id=run_id)
    print(json.dumps(result, indent=2))
