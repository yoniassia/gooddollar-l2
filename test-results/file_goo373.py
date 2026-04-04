#!/usr/bin/env python3
"""File GOO-373: redeploy GoodYield+DeployInitialVaults to pick up GOO-369+370 fixes."""
import json, time, hmac, hashlib, base64, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000003"
LEAD_BE  = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"

def b64u(d):
    return base64.urlsafe_b64encode(d if isinstance(d,bytes) else d.encode()).rstrip(b"=").decode()

def make_jwt():
    h = b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    now = int(time.time())
    p = b64u(json.dumps({"sub":AGENT_ID,"company_id":COMPANY,"adapter_type":"claude_local",
                          "run_id":RUN_ID,"iat":now,"exp":now+3600,"iss":"paperclip","aud":"paperclip-api"}))
    msg = f"{h}.{p}".encode()
    sig = b64u(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    return f"{h}.{p}.{sig}"

def api(method, path, body=None):
    token = make_jwt()
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Paperclip-Run-Id", RUN_ID)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

body = """Redeploy GoodYield vault stack to pick up two fixes committed after the 19:23 GoodStable redeploy:

**GOO-369** (bec119a): reset gainSnapshots for fresh same-epoch depositors. Fixes collateral overpayment when user withdraws and re-deposits within same drain epoch.

**GOO-370** (62d62c5): add Aave V3-compatible supply(address,uint256,address,uint16) and withdraw(address,uint256,address) overloads to LendingStrategy. Current deployed LendingStrategy calls the wrong signature → GoodVault[0] (WETH) deposit reverts. vault[1] (gUSD) also broken — points to old gUSD (0xc351628E) from pre-19:23 deploy, needs new address (0x5d42ebdb).

**Required scripts** (in order):
1. `DeployGoodYield.s.sol` — redeploy VaultFactory
2. `DeployInitialVaults.s.sol` — redeploy LendingStrategy+StablecoinStrategy with new GoodStable addresses:
   - gUSD: 0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f
   - StabilityPool: 0xad523115cd35a8d4e60b3c0953e0e0ac10418309
   - VaultManager: 0xab7b4c595d3ce8c85e16da86630f2fc223b05057

**Confirmed in iteration 22**: vault[2] (GDT, unchanged asset) deposits correctly. vault[0]/[1] block on LendingStrategy.supply() signature mismatch.

Once redeployed, reassign to Tester Alpha (089cacf1) for iteration 23 verification."""

r = api("POST", f"/companies/{COMPANY}/issues", {
    "title": "deploy: redeploy GoodYield+DeployInitialVaults to pick up GOO-369+370 fixes",
    "description": body,
    "status": "todo",
    "priority": "high",
    "assigneeAgentId": LEAD_BE
})
print(f"Filed: {r.get('identifier','?')} — {r.get('title','?')[:60]}")
print(f"  id: {r.get('id','?')}")
print(f"  error: {r.get('error','none')}")
