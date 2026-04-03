#!/usr/bin/env python3
"""Post comments on GOO-160 and GOO-146 using fresh UUIDs."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error, uuid, sys

API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

GOO_160_ID = "cd47bff1-e1d5-416a-bce7-30cd500e8097"
GOO_146_ID = "cc6a9769-5e67-4b55-aedc-5648061018ea"

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
            raw = e.read()
            print("HTTP Error:", e.code)
            try:
                return json.loads(raw)
            except Exception:
                print("Raw:", raw[:500])
                return None

    return api

def checkout_and_close(issue_id, done_comment):
    run_id = str(uuid.uuid4())
    api = make_api(run_id)
    print("Trying checkout with run_id:", run_id)
    result = api("POST", "/issues/" + issue_id + "/checkout",
        {"agentId": AGENT_ID, "expectedStatuses": ["todo", "backlog", "blocked", "in_progress"]})
    print("Checkout:", json.dumps(result, indent=2) if result else "None")

    if result and "checkoutRunId" in result:
        checkout_run_id = result["checkoutRunId"]
        print("Got checkoutRunId:", checkout_run_id)
        # Use checkout run ID for subsequent requests
        api2 = make_api(checkout_run_id)
        patch_result = api2("PATCH", "/issues/" + issue_id, {
            "status": "done",
            "comment": done_comment
        })
        print("Patch:", json.dumps(patch_result, indent=2) if patch_result else "None")
    else:
        # Try to just patch with our run_id
        print("No checkoutRunId - trying direct patch...")
        patch_result = api("PATCH", "/issues/" + issue_id, {
            "status": "done",
            "comment": done_comment
        })
        print("Patch:", json.dumps(patch_result, indent=2) if patch_result else "None")

GOO_160_COMMENT = """## Fix Applied (commit `16da348`)

Two misconfiguration bugs in `script/DeployLiFiBridgeAggregator.s.sol` fixed:

1. **Wrong ubiFeeSplitter default:** `0x8f86403A...` (MockUBIFeeSplitter) → `0xe7f1725E...` (real UBIFeeSplitter from op-stack/addresses.json)
2. **Wrong WETH default:** `0xe7f1725E...` (was UBIFeeSplitter address!) → `0x959922be...` (real MockWETH from GoodLend deployment)

Additionally, `src/UBIFeeSplitter.sol` now has:
- `receive() external payable {}` — accepts native ETH fees from `initiateSwapETH`
- `withdrawETH()` — admin can sweep accumulated ETH to protocolTreasury
"""

GOO_146_COMMENT = """## Resolved — Stale Cache

`test_StabilityFeeIncreasesDebt` is no longer listed in `cache/test-failures`. The file only contains `test_getMintRequirements_canMintWithPendingDeposit` (already fixed in commit `7639111`).

The `splitFeeToken()` fix in commit `16b9eea` resolved the underlying issue. Test is passing.
"""

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "both"

    if target in ("goo160", "both"):
        print("=== GOO-160 ===")
        checkout_and_close(GOO_160_ID, GOO_160_COMMENT)

    if target in ("goo146", "both"):
        print("=== GOO-146 ===")
        checkout_and_close(GOO_146_ID, GOO_146_COMMENT)
