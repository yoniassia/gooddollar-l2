#!/usr/bin/env python3
"""Mark GOO-359 as blocked — devnet reset."""
import json, time, hmac, hashlib, base64, urllib.request, urllib.error

AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY_ID = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
RUN_ID = "38238079-5374-4d54-b7ff-39d57ee7055c"

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt(run_id):
    header = b64url(json.dumps({"alg":"HS256","typ":"JWT"}).encode())
    now = int(time.time())
    payload = b64url(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY_ID,
        "adapter_type": "claude_local", "run_id": run_id,
        "iat": now, "exp": now + 3600, "iss": "paperclip", "aud": "paperclip-api"
    }).encode())
    msg = f"{header}.{payload}".encode()
    sig = b64url(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def api(method, path, body=None, run_id=RUN_ID):
    token = make_jwt(run_id)
    url = API_URL + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Paperclip-Run-Id", run_id)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

comment = """## GOO-359 BLOCKED — Devnet Reset

**Root cause:** The devnet was reset mid-run (block rewound from 62311 to 12). All deployed contracts were wiped. All 47 on-chain calls failed.

**Evidence:**
- Devnet block before tests: 0xf367 (62311)
- Devnet block after reset: 0xc (12)
- `eth_getCode(VaultManager 0xcfbd78f3...)` = `0x` — no contract code
- 0/47 tests passed (connection timeout + code=0x)

**Contracts that need redeployment** (full stack post GOO-348/350/351/352 fixes):
- VaultManager, PSM, gUSD, CollateralRegistry, StabilityPool (DeployGoodStable)
- GoodDollarToken, VoteEscrowedGD (DeployGovernance)
- VaultFactory + GoodVault0 + LendingStrategy (DeployGoodYield + DeployInitialVaults + FixLendingStrategyVault)

**Action needed:** @Lead-Blockchain-Engineer please redeploy the devnet with the latest codebase. Once deployed, re-assign [GOO-359](/GOO/issues/GOO-359) to me (agent 089cacf1) so I can re-run iteration 20.

**Test log:** `/home/goodclaw/gooddollar-l2/test-results/tester-alpha-iter20.jsonl` (48 entries, all fail — devnet infra issue)
"""

# First get current issue to find checkoutRunId
issue = api("GET", "/api/issues/GOO-359")
checkout_run = issue.get("checkoutRunId") or RUN_ID
print(f"checkoutRunId: {checkout_run}")

# Block the issue
result = api("PATCH", "/api/issues/GOO-359", {
    "status": "blocked",
    "comment": comment,
    "assigneeAgentId": "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
}, run_id=checkout_run)
print(f"PATCH status: {result.get('status','?')} error: {result.get('error','none')}")
print(json.dumps(result, indent=2)[:300])
