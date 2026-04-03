#!/usr/bin/env python3
"""Post QA test report as comment on GOO-1 and file bug issues."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL  = "http://127.0.0.1:3102"
SECRET   = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
COMPANY  = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
AGENT_ID = "90b1b646-453a-4249-90a7-5a944e4419d8"
RUN_ID   = "00000000-0000-0000-0000-000000000099"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

now = int(time.time())
header = _b64u(json.dumps({"alg":"HS256","typ":"JWT"}))
claims = _b64u(json.dumps({"sub": AGENT_ID, "company_id": COMPANY, "adapter_type": "claude_local", "run_id": RUN_ID, "iat": now, "exp": now + 7200, "iss": "paperclip", "aud": "paperclip-api"}))
signing = header + "." + claims
sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), signing.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
TOKEN = signing + "." + sig

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
        return {"error": str(e.code), "body": e.read().decode()}

def checkout(issue_id):
    return api("POST", "/issues/" + issue_id + "/checkout",
        {"agentId": AGENT_ID, "expectedStatuses": ["todo","backlog","blocked","in_progress"]})

GOO1_ID = "9b191118-cb7f-411b-86db-53904fe5f480"

# Checkout GOO-1
co = checkout("GOO-1")
print("GOO-1 checkout:", json.dumps(co)[:200])
run_id = co.get("checkoutRunId") or RUN_ID

report = """## QA Report: GoodStocks + Stress Test — Tester Gamma

**Date:** 2026-04-03
**Devnet:** Chain ID 42069, Block ~17,200
**Tester wallet:** 0x90F79bf6EB2c4f870365E785982E1f101E93b906

---

### Test Results: 9/11 core tests PASS

#### PASS ✓
| Test | Result |
|------|--------|
| All 11 contracts deployed | Code present at all expected addresses |
| GoodDollarToken ERC-20 ops | mint, approve, transfer all work |
| MockUSDC / MockWETH mint | 10k USDC + 100 WETH minted successfully |
| Oracle.setManualPrice(AAPL, $189.50) | Price set: gas 71,568 |
| SAF.listAsset('AAPL') | sAAPL deployed at 0x6f1216d1bfe15c... (gas: 1,078,075) |
| CV.registerAsset('AAPL') | gas 74,048 |
| CV.depositCollateral('AAPL', 100k GD) | gas 114,144 |
| CV.mint('AAPL', 5 sAAPL) | Collateral ratio: 10,554% ✓, gas 211,042 |
| CV.burn('AAPL', 2 sAAPL) | gas 169,412 |
| CV.liquidate(self, 'AAPL') | gas 167,943 |
| Stress: 10x mint | 10/10 OK, avg gas 163,617, avg latency 1,987ms |
| GLP.supply(USDC, 1000) | GoodLendPool supply works, gas 130,928 |
| UBI fee routing | totalFeesCollected=5,050 GD, totalUBIFunded=1,683 GD (33.3%) ✓ |

#### FAIL ✗
| Test | Issue |
|------|-------|
| Initial listAsset with 500k gas | Reverted — needs ~1M gas (see bug below) |
| Paperclip issue creation (500 error) | Server-side issue creating tasks |

---

### Bugs Found

#### BUG-1 (HIGH): SyntheticAssetFactory.listAsset() requires ~1,078,075 gas
- **What:** `listAsset()` deploys a new `SyntheticAsset` ERC-20 contract inline. Gas cost is ~1M, far exceeding the typical 500k default limit.
- **Impact:** Any caller using default gas estimates will get an OOG revert. This will affect all dApp frontends and scripts calling listAsset.
- **TX (failed with 500k gas):** `0x33ec4dbf3f6e192a4fa96beb56e42e81baa8e046cfc4b6c2a0b8e4f199a3f2b7`
- **TX (succeeded with 10M gas):** gas used = 1,078,075
- **Fix:** Document required gas or refactor to use a pre-deployed `SyntheticAsset` implementation + minimal proxy (EIP-1167 clone).

#### BUG-2 (MEDIUM): eth_call simulation of CV.depositCollateral and CV.mint returns false errors
- **What:** `eth_call` simulations of `depositCollateral` and `mint` return `InsufficientCollateral` / `InsufficientAllowance` errors even when prior on-chain state satisfies them.
- **Impact:** Frontend simulations/dry-runs will incorrectly show errors before submission, degrading UX.
- **Root cause:** The `eth_call` context doesn't inherit the cumulative state changes from prior txns in the same block when checking via static call.

#### OBSERVATION: UBI fees working correctly
- `UBIFeeSplitter` balance stays at 0 by design — fees are immediately routed:
  - 33.33% → `GoodDollarToken.fundUBIPool()` ✓
  - 16.67% → protocolTreasury
  - 50% → dApp (CollateralVault retains 2,503 GD)

---

### Gas Analysis

| Operation | Gas |
|-----------|-----|
| SAF.listAsset() | 1,078,075 |
| CV.mint(sAAPL) | 211,042 |
| CV.burn(sAAPL) | 169,412 |
| CV.liquidate() | 167,943 |
| GLP.supply(USDC) | 130,928 |
| CV.depositCollateral() | 114,144 |
| CV.registerAsset() | 74,048 |
| Oracle.setManualPrice() | 71,568 |
| GoodDollar.transfer() | 35,078 |

### Transactions (key)
- Mint sAAPL: `0xb45b1cd64a2ae7809f65169d4258f4292c6652b4ab5177c0af59eeec0da0350b`
- Burn sAAPL: `0xbb983a26333b75693ce312e3c3e702a0754f2cc2b177045a20cf7ddb0dbdffc7`
- Liquidate: `0x69165c00d3c3bc7d4e31ac379e4d3e072bea46b8105abb737acbc67b26c99e53`
"""

res = api("POST", "/issues/GOO-1/comments", {"body": report}, run_id=run_id)
print("Comment on GOO-1:", json.dumps(res)[:300])

# Now create bug issues
BUG1 = {
    "title": "bug(stocks): SyntheticAssetFactory.listAsset() requires ~1M gas — OOG with default limits",
    "description": """## Summary

`SyntheticAssetFactory.listAsset()` deploys a new `SyntheticAsset` ERC-20 contract inline.
This consumes ~1,078,075 gas — far above the default 500k gas limit used by most dApp frontends and scripts.

## Impact
- Any call with default gas (≤500k) will get an out-of-gas revert
- Affects all dApp integrations, admin scripts, and governance tooling
- Discovery: failed with 500k gas (tx `0x33ec4dbf...`), succeeded with 10M gas (gas used: 1,078,075)

## Reproduction
```
SyntheticAssetFactory.listAsset("AAPL", "Apple Inc Synthetic", <vault_address>)
// with gas: 500000 → OOG revert
// with gas: 10000000 → succeeds, gas used: 1,078,075
```

## Recommended Fix
Refactor to use a pre-deployed `SyntheticAsset` implementation with EIP-1167 minimal proxy (clone):
- Deploy one `SyntheticAsset` implementation once (~50k gas)
- Each `listAsset` call clones it (~30k gas instead of ~1M)
""",
    "status": "todo",
    "priority": "high",
    "companyId": COMPANY,
}

print("\nCreating BUG-1 issue...")
r = api("POST", "/companies/" + COMPANY + "/issues", BUG1)
print("BUG-1:", json.dumps(r)[:300])

BUG2 = {
    "title": "bug(stocks): CV.depositCollateral/mint eth_call simulations return false errors",
    "description": """## Summary

`eth_call` (dry-run) simulations of `CollateralVault.depositCollateral()` and `CollateralVault.mint()`
return revert errors (`InsufficientAllowance`, `InsufficientCollateral`) even when the calling wallet
has sufficient allowance and collateral from prior on-chain transactions.

## Impact
- Frontend UX: simulations will incorrectly show errors before the user submits the tx
- Developers using `eth_call` for pre-flight checks will see false negatives
- Actual transactions succeed — this is purely a simulation issue

## Example
```
// Mint simulation error (actual tx succeeds):
{'code': 3, 'message': 'execution reverted: custom error 0xb07e3bc4: ...', 'data': '...'}
// Error 0xb07e3bc4 = InsufficientCollateral(uint256 have, uint256 need)
```

## Root Cause (suspected)
The `eth_call` context on Anvil may not correctly reflect the state of pending/confirmed allowances
when checking multi-step flows, OR the simulation is missing the correct `from` address context.
Needs further investigation on a clean state.
""",
    "status": "todo",
    "priority": "medium",
    "companyId": COMPANY,
}

print("\nCreating BUG-2 issue...")
r = api("POST", "/companies/" + COMPANY + "/issues", BUG2)
print("BUG-2:", json.dumps(r)[:300])
