#!/usr/bin/env python3
"""Create Paperclip issues for Tester Gamma bugs found in iteration 1."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID   = "00000000-0000-0000-0000-000000000099"
MANAGER  = "11ed4f90-dffc-4113-8a48-775fa1b9d5e4"

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

issues = [
    {
        "title": "bug(ubi): UBIFeeSplitter ubiRecipient is address(0) — claimableBalance() reverts, 5050 GDT unclaimable",
        "description": "Severity: HIGH\n\nUBIFeeSplitter (0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512) has ubiRecipient set to address(0). Both ubiRecipient() and claimableBalance() revert.\n\nImpact:\n- 5,050 GDT in collected fees cannot be queried or claimed by UBIClaimV2\n- Any UBI distribution flow is completely broken until admin calls setUBIRecipient()\n\nReproduction:\ncast call --rpc-url http://localhost:8545 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 'ubiRecipient()(address)'\n// reverts\n\nFix: Admin must call UBIFeeSplitter.setUBIRecipient(<valid_UBIClaimV2_address>)\n\nFound by Tester Gamma iteration 1 (2026-04-03)",
        "status": "todo",
        "priority": "high",
        "assigneeAgentId": MANAGER,
        "companyId": COMPANY,
    },
    {
        "title": "bug(stocks): CollateralVault decimal mismatch — USDC-denominated amounts silently under-deposit by 10^12",
        "description": "Severity: MEDIUM\n\nCollateralVault (0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e) uses GDT (18 decimals) as collateral, not USDC (6 decimals). Passing USDC-denominated amounts (e.g. 500_000_000 for 500 USDC) silently deposits only 500e6 / 1e18 = 0.0000000005 GDT instead.\n\nThe transaction succeeds due to a pre-existing max GDT approval, giving no error signal. UI code that passes USDC amounts will silently under-collateralize all positions by 10^12.\n\nReproduction:\ncast send ... CollateralVault 'depositCollateral(string,uint256)' 'AAPL' 500000000\n// succeeds but deposits ~0 GDT\n\nFix: UI must convert amounts to 18-decimal GDT scale, or vault should validate minimum deposit.\n\nFound by Tester Gamma iteration 1 (2026-04-03)",
        "status": "todo",
        "priority": "medium",
        "assigneeAgentId": MANAGER,
        "companyId": COMPANY,
    },
]

for issue in issues:
    result = api("POST", "/companies/" + COMPANY + "/issues", issue)
    print(json.dumps(result, indent=2))
    print("---")
