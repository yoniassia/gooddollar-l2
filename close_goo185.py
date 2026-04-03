#!/usr/bin/env python3
"""Close GOO-185 as done."""
import json, hmac, hashlib, base64, time, urllib.request, urllib.error

API_URL = "http://127.0.0.1:3102"
SECRET = "c6a47109ff1368603cb1d4ddba902dd652005a4f0ac32dc77de7b15b79f85155"
AGENT_ID = "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
RUN_ID = "7d032f79-9fc8-4bfe-b917-47071f7ee3a6"

GOO_185_ID = "26005ab2-1f8e-4b83-8b74-2af494a79c0d"

def _b64u(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

def _make_token():
    now = int(time.time())
    header = _b64u(json.dumps({"alg": "HS256", "typ": "JWT"}))
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
        raw = e.read()
        print("HTTP Error:", e.code)
        try:
            return json.loads(raw)
        except Exception:
            print("Raw:", raw[:300])
            return None

DONE_COMMENT = """## Implementation Complete

Replaced the `GoodSwapRouter` stub with a real UniV2-style router contract.

### New contract: `src/swap/GoodSwapRouter.sol` (commit `1ac594c`)

**Architecture:**
- Pool registry: `mapping(bytes32 => address)` keyed by `keccak256(lower_addr, higher_addr)`
- `registerPool(pool)` reads `tokenA`/`tokenB` from the GoodPool and stores under canonical key
- Order-independent lookup: `getPool(tokenA, tokenB)` === `getPool(tokenB, tokenA)`

**Swap functions:**
- `swapExactTokensForTokens(amountIn, amountOutMin, path[2], to, deadline)` — exact input, minimum output
- `swapTokensForExactTokens(amountOut, amountInMax, path[2], to, deadline)` — exact output, maximum input
- `getAmountOut(amountIn, tokenIn, tokenOut)` — read-only quote
- `getAmountIn(amountOut, tokenIn, tokenOut)` — inverse AMM math (0.3% fee)

**Flow:** User approves router → router pulls tokenIn → approves pool → calls `GoodPool.swap()` → forwards output to `to`.

**Fee routing:** No router action needed — `GoodPool` automatically routes 33.33% of 0.3% swap fee to `UBIFeeSplitter`.

### Tests: `test/swap/GoodSwapRouter.t.sol`
12 tests: pool registry, exact-in G$→WETH/WETH→G$/G$→USDC, output to different address, slippage revert, deadline revert, no-pool revert, exact-out round-trip, excessive-input revert.

### Frontend
- `frontend/src/lib/abi.ts`: `GoodSwapRouterABI` exported (5 functions + Swap event)
- `frontend/src/lib/devnet.ts`: `GoodSwapRouterABI` re-exported for consumers
- `devnet.ts` `CONTRACTS.GoodSwapRouter` already pointed at `0x1c85638e118b37167e9298c2268758e058DdfDA0` — needs redeployment to activate real router on devnet

### Deployment note
The stub at `0x1c85638e118b37167e9298c2268758e058DdfDA0` needs to be replaced by redeploying with the updated `script/DeployGoodSwap.s.sol`, then calling `registerPool()` for each GoodPool address, then updating `devnet.ts` with the new router address.
"""

if __name__ == "__main__":
    print("Closing GOO-185 as done...")
    result = api("PATCH", "/issues/" + GOO_185_ID, {
        "status": "done",
        "comment": DONE_COMMENT
    })
    print(json.dumps(result, indent=2) if result else "None")
