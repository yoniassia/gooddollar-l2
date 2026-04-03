#!/usr/bin/env python3
"""
Simulate the GoodLendToken constructor fix by using Anvil account impersonation
to manually set the gToken -> pool allowance, then re-run borrow tests.
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
GTOKEN_USDC = "0xa85233c63b9ee964add6f2cffe00fd84eb32338f"
GTOKEN_WETH = "0x7a2088a1bfc9d81c55368ae168c2c02570cb814f"
GOOD_LEND   = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"
MOCK_USDC   = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH   = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
MY_ADDR     = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

MAX_UINT = (2**256) - 1

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def wait_receipt(tx_hash, max_wait=20):
    for _ in range(max_wait):
        r = rpc("eth_getTransactionReceipt", [tx_hash])
        if r.get("result"):
            return r["result"]
        time.sleep(0.5)
    return None

def ea(addr):
    return addr[2:].lower().zfill(64)

def eu(n):
    return hex(n)[2:].zfill(64)

print("=== Simulating GOO-155 Fix via Anvil Impersonation ===")
print("(This validates that the GoodLendToken constructor approve() fix resolves the borrow bug)")
print()

# Step 1: Set approval via impersonation (simulates constructor fix)
results = []
for name, gtoken, token in [("USDC", GTOKEN_USDC, MOCK_USDC), ("WETH", GTOKEN_WETH, MOCK_WETH)]:
    # Impersonate gToken
    rpc("anvil_impersonateAccount", [gtoken])
    rpc("anvil_setBalance", [gtoken, "0x1000000000000000000"])

    # approve(pool, max_uint) from gToken to underlying token
    approve_data = "0x095ea7b3" + ea(GOOD_LEND) + eu(MAX_UINT)
    tx = {"from": gtoken, "to": token, "data": approve_data, "gas": "0x30000"}
    res = rpc("eth_sendTransaction", [tx])
    tx_hash = res.get("result")
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        ok = receipt and receipt.get("status") == "0x1"
        print(f"  Set {name} gToken approve to pool: {'OK' if ok else 'FAIL'} (tx={tx_hash[:12]}...)")
    else:
        print(f"  Set {name} gToken approve FAILED: {res}")

    rpc("anvil_stopImpersonatingAccount", [gtoken])

    # Verify
    allow_data = "0xdd62ed3e" + ea(gtoken) + ea(GOOD_LEND)
    res = rpc("eth_call", [{"to": token, "data": allow_data, "from": MY_ADDR}, "latest"])
    allowance = int(res.get("result","0x0"), 16)
    results.append(allowance == MAX_UINT)
    print(f"  {name} allowance confirmed: {allowance == MAX_UINT} (val={allowance})")

print()
print("=== Re-running Borrow Test ===")

# Step 2: Try borrowing now
borrow_usdc = 5_000 * 10**6  # 5K USDC
borrow_data = "0x4b8a3529" + ea(MOCK_USDC) + eu(borrow_usdc)

# Check eth_call first
call_res = rpc("eth_call", [{"to": GOOD_LEND, "data": borrow_data, "from": MY_ADDR}, "latest"])
err = call_res.get("error", {})
print("eth_call borrow(USDC, 5000e6):")
if not err:
    print("  -> No revert (would succeed)")
else:
    msg = err.get("message", "")
    data_hex = err.get("data", "")
    print(f"  -> Revert: {msg}")
    if data_hex and data_hex.startswith("0x08c379a0"):
        raw = bytes.fromhex(data_hex[2:])
        length = int.from_bytes(raw[36:68], 'big')
        reason = raw[68:68+length].decode('utf-8', errors='replace')
        print(f"  -> Reason: {reason}")

# Execute
res = rpc("eth_sendTransaction", [{"from": MY_ADDR, "to": GOOD_LEND, "data": borrow_data, "gas": "0x493e0"}])
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    print(f"\nBorrow tx {tx_hash[:12]}... status: {'SUCCESS' if ok else 'REVERTED'}")

    if ok:
        # Verify USDC balance increased
        bal_data = "0x70a08231" + ea(MY_ADDR)
        res = rpc("eth_call", [{"to": MOCK_USDC, "data": bal_data, "from": MY_ADDR}, "latest"])
        bal = int(res.get("result","0x0"), 16)
        print(f"USDC balance after borrow: {bal/1e6:.2f} (expected ~105K with 5K borrowed)")
        print()
        print("=== FIX VERIFIED ===")
        print("GOO-155 fix (GoodLendToken.approve in constructor) resolves the borrow failure.")
        print("Contracts need to be redeployed for the fix to take effect on devnet.")
    else:
        print("Borrow still failing even with allowance set!")
        # Get revert reason
        call_after = rpc("eth_call", [{"to": GOOD_LEND, "data": borrow_data, "from": MY_ADDR}, "latest"])
        err2 = call_after.get("error", {})
        print("Error:", err2.get("message"), err2.get("data","")[:100])
else:
    print("Failed to send tx:", res)
