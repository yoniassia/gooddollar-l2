#!/usr/bin/env python3
"""Post comment on GOO-205 using checkout pattern."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error, uuid

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
ISSUE_ID = "e90705fb-e0c6-454d-bb76-eb563cc1578e"

RUN_ID = str(uuid.uuid4())

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token():
    now = int(time.time())
    header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
    claims = _b64u(json.dumps({
        "sub": AGENT_ID, "company_id": COMPANY,
        "adapter_type": "claude_local", "run_id": RUN_ID,
        "iat": now, "exp": now + 7200,
        "iss": "paperclip", "aud": "paperclip-api"
    }))
    signing = header + "." + claims
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return signing + "." + sig

TOKEN = _make_token()

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
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        print("HTTP", e.code, ":", body.decode()[:300])
        try:
            return json.loads(body)
        except:
            return {}

# Checkout
print("Checking out", ISSUE_ID)
co = api("POST", "/issues/" + ISSUE_ID + "/checkout",
    {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})
checkout_run = co.get("checkoutRunId", RUN_ID)
print("Result:", json.dumps(co, indent=2)[:400])
print("Using run_id:", checkout_run)

# Post comment
comment_body = (
    "**Found by Tester Gamma, iteration 2 (2026-04-03)**\n\n"
    "UBIFeeHook (0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9) has `poolManager()` returning "
    "`0x0000000000000000000000000000000000000001` — a sentinel/placeholder address, not a real contract.\n\n"
    "**Impact:** The `afterSwap` callback requires `msg.sender == poolManager`. Since `0x1` can never "
    "initiate a real Uniswap V4 swap, the hook never fires. Confirmed: `totalSwapsProcessed = 0`, "
    "`totalUBIFees(GDT) = 0`. Zero UBI fees will ever be collected through swap volume.\n\n"
    "**Reproduction:**\n"
    "```\ncast call 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "
    "'poolManager()(address)' --rpc-url http://localhost:8545\n"
    "# returns: 0x0000000000000000000000000000000000000001\n```\n\n"
    "**Fix:** Deploy or configure the real Uniswap V4 PoolManager on devnet, then either:\n"
    "- Call `UBIFeeHook.setPoolManager(realAddress)` if a setter exists, OR\n"
    "- Redeploy UBIFeeHook with the correct `poolManager` constructor argument."
)

print("\nPosting comment...")
result = api("POST", "/issues/" + ISSUE_ID + "/comments",
    {"body": comment_body}, run_id=checkout_run)
print("Comment result:", json.dumps(result, indent=2)[:400])

# Verify
print("\nVerifying comments...")
comments = api("GET", "/issues/" + ISSUE_ID + "/comments")
print("Total comments:", len(comments) if isinstance(comments, list) else "error")
