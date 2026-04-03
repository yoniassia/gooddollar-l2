#!/usr/bin/env python3
"""Debug checkout for GOO-204."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error, uuid

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

# Use a fresh unique run ID
RUN_ID = str(uuid.uuid4())
print("Using run_id:", RUN_ID)

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token(run_id):
    now = int(time.time())
    header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
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

TOKEN = _make_token(RUN_ID)

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
            resp = json.loads(r.read())
            print("HTTP 2xx:", json.dumps(resp, indent=2)[:500])
            return resp
    except urllib.error.HTTPError as e:
        body_text = e.read()
        print("HTTP", e.code, ":", body_text.decode()[:500])
        try:
            return json.loads(body_text)
        except:
            return {"error": body_text.decode()}

# Try checkout of GOO-204
print("\n=== Checkout GOO-204 ===")
result = api("POST", "/issues/104b0581-d343-4c17-a383-5c103ba4511b/checkout",
    {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress","done"]})
checkout_run = result.get("checkoutRunId", RUN_ID)
print("checkoutRunId:", checkout_run)

print("\n=== Post comment (using checkoutRunId) ===")
comment_body = (
    "**Found by Tester Gamma, iteration 2 (2026-04-03)**\n\n"
    "After supplying 1,000 MockUSDC to GoodLendPool, calling `getUserAccountData(wallet)` returns "
    "`totalCollateralBase = 2^256 - 1` (uint256 max). Expected it to reflect actual USDC collateral value.\n\n"
    "**Root cause hypothesis:** GoodLendPool uses its own oracle at `0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE` "
    "(different from main PriceOracle at `0x0165878...`). This oracle likely has no USDC or WETH price configured, "
    "causing an overflow/sentinel fallback in the collateral calculation.\n\n"
    "**Impact:** Health factor and LTV calculations consuming `getUserAccountData` will be incorrect, "
    "potentially enabling undercollateralized borrows or blocking valid liquidations.\n\n"
    "**Reproduction:**\n"
    "```\ncast call 0x322813fd9a801c5507c9de605d63cea4f2ce6c44 "
    "'getUserAccountData(address)(uint256,uint256,uint256)' "
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906 --rpc-url http://localhost:8545\n"
    "# returns: 115792...65535 (uint256 max), 199999999900, 0\n```\n\n"
    "**Fix:** Configure GoodLendPool oracle (0x9A9f2...) with USDC and WETH price feeds."
)
result2 = api("POST", "/issues/104b0581-d343-4c17-a383-5c103ba4511b/comments",
    {"body": comment_body}, run_id=checkout_run)
