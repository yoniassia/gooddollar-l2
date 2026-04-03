#!/usr/bin/env python3
"""Post comments on Paperclip issues for Tester Gamma bugs."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000099"

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

def api(method, path, body=None):
    url = API_URL + "/api" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
        "X-Paperclip-Run-Id": RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# GOO-198: UBIFeeSplitter bug
comment_198 = (
    "**Found by Tester Gamma, iteration 1 (2026-04-03)**\n\n"
    "UBIFeeSplitter (0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512) has `ubiRecipient` set to `address(0)`. "
    "Both `ubiRecipient()` and `claimableBalance()` revert on devnet.\n\n"
    "**Impact:**\n"
    "- 5,050 GDT in collected fees cannot be queried or claimed by UBIClaimV2\n"
    "- UBI distribution is entirely blocked until fixed\n\n"
    "**Reproduction:**\n"
    "```\ncast call --rpc-url http://localhost:8545 "
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 'ubiRecipient()(address)'\n"
    "# reverts\n```\n\n"
    "**Fix:** Admin must call `UBIFeeSplitter.setUBIRecipient(valid_UBIClaimV2_address)`"
)

# GOO-199: CollateralVault decimal mismatch
comment_199 = (
    "**Found by Tester Gamma, iteration 1 (2026-04-03)**\n\n"
    "CollateralVault (0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e) uses GDT (18 decimals) as collateral, "
    "not USDC (6 decimals). Passing USDC-denominated amounts (e.g. 500_000_000 for 500 USDC) "
    "silently deposits only ~0.0000000005 GDT instead of the intended amount.\n\n"
    "The tx succeeds due to a pre-existing max GDT approval -- no revert, no error signal. "
    "Any UI passing USDC amounts directly will silently under-collateralize all positions by 10^12.\n\n"
    "**Reproduction:**\n"
    "```\ncast send ... CollateralVault 'depositCollateral(string,uint256)' 'AAPL' 500000000\n"
    "# succeeds but actual GDT deposited is ~0\n```\n\n"
    "**Fix:** UI must scale amounts to 18-decimal GDT, or vault should enforce a minimum deposit threshold."
)

r198 = api("POST", "/issues/7d06e83f-b76e-40ae-98e9-eeeae970a449/comments", {"body": comment_198})
print("GOO-198 comment:", json.dumps(r198, indent=2))

r199 = api("POST", "/issues/3698cfd4-09f5-4622-ad40-d3756d0e304a/comments", {"body": comment_199})
print("GOO-199 comment:", json.dumps(r199, indent=2))
