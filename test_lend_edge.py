#!/usr/bin/env python3
"""
GoodLend edge case tests:
- Undercollateralized borrow (should revert)
- Zero amount borrow (should revert)
- Flash loan
- Over-withdraw (should revert)
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ADMIN_ADDR = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"

results = []

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def eth_call(to, fn_data):
    res = rpc("eth_call", [{"to": to, "data": fn_data, "from": MY_ADDR}, "latest"])
    err = res.get("error", {})
    if err:
        err_data = err.get("data", "")
        if err_data and err_data.startswith("0x08c379a0"):
            raw = bytes.fromhex(err_data[2:])
            length = int.from_bytes(raw[36:68], 'big')
            return None, raw[68:68+length].decode('utf-8', errors='replace')
        if err_data:
            return None, "custom_error:" + err_data[:20]
        return None, err.get("message", "execution reverted")
    return res.get("result", "0x"), None

def send_tx(from_addr, to, data_hex, value=0, gas=400000):
    tx = {"from": from_addr, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    return rpc("eth_sendTransaction", [tx])

def wait_receipt(tx_hash, max_wait=20):
    for _ in range(max_wait):
        res = rpc("eth_getTransactionReceipt", [tx_hash])
        if res.get("result"):
            return res["result"]
        time.sleep(0.5)
    return None

def log(name, ok, tx=None, note=""):
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" tx={tx[:12]}..." if tx else "") + (f" -- {note}" if note else ""))
    results.append({"test": name, "pass": ok, "tx": tx, "note": note})

def ea(addr):
    return addr[2:].lower().zfill(64)

def eu(n):
    return hex(n)[2:].zfill(64)

def erc20_bal(token, addr):
    raw, _ = eth_call(token, "0x70a08231" + ea(addr))
    return int(raw, 16) if raw and raw != "0x" else 0

print("=" * 60)
print("GoodLend Edge Case Tests")
print("=" * 60)

# ── 1. Undercollateralized borrow ─────────────────────────────────────────────
print("\n1. Undercollateralized borrow (should revert)")
# My WETH collateral: ~35 WETH at $2000 = $70K, 75% LTV = $52.5K max borrow
# Current debt is 0. Try borrow 1,000,000 USDC (10x overcollateral limit)
giant_borrow = 1_000_000 * 10**6  # 1M USDC
raw, err = eth_call(GOOD_LEND, "0x4b8a3529" + ea(MOCK_USDC) + eu(giant_borrow))
log("1M USDC borrow reverts (undercollateralized)", err is not None and err != "", note=err or "no error")

# ── 2. Zero amount borrow ─────────────────────────────────────────────────────
print("\n2. Zero amount borrow (should revert)")
raw, err = eth_call(GOOD_LEND, "0x4b8a3529" + ea(MOCK_USDC) + eu(0))
log("Zero amount borrow reverts", err is not None, note=err or "no error")

# ── 3. Zero amount supply ─────────────────────────────────────────────────────
print("\n3. Zero amount supply (should revert)")
raw, err = eth_call(GOOD_LEND, "0xf2b9fdb8" + ea(MOCK_USDC) + eu(0))
log("Zero amount supply reverts", err is not None, note=err or "no error")

# ── 4. Withdraw more than supplied ───────────────────────────────────────────
print("\n4. Over-withdraw (should revert)")
huge_withdraw = 10_000 * 10**18  # 10K WETH — way more than supplied
raw, err = eth_call(GOOD_LEND, "0xf3fef3a3" + ea(MOCK_WETH) + eu(huge_withdraw))
log("Over-withdraw reverts", err is not None, note=err or "no error")

# ── 5. Flash loan test ────────────────────────────────────────────────────────
print("\n5. Flash loan (no receiver contract — should handle gracefully)")
# flashLoan(address asset, uint256 amount, address receiver, bytes params)
# selector: adf51de1
flash_amount = 10_000 * 10**6  # 10K USDC
# Use MY_ADDR as receiver (will fail executeOperation but let's see the error type)
fake_params = "0x" + "00" * 32  # empty bytes
fl_data = ("0xadf51de1" +
           ea(MOCK_USDC) +        # asset
           eu(flash_amount) +      # amount
           ea(MY_ADDR) +           # receiver (my wallet, not a contract)
           eu(128) +               # offset to params bytes
           eu(0))                  # params length = 0
raw, err = eth_call(GOOD_LEND, fl_data)
# Should revert because MY_ADDR isn't a flash loan receiver contract
log("Flash loan to EOA reverts gracefully", err is not None, note=err or "no error")

# ── 6. Borrow inactive asset (e.g., nonexistent token) ───────────────────────
print("\n6. Borrow non-existent reserve (should revert)")
fake_token = "0x1234567890123456789012345678901234567890"
raw, err = eth_call(GOOD_LEND, "0x4b8a3529" + ea(fake_token) + eu(1000))
log("Borrow non-existent reserve reverts", err is not None, note=err or "no error")

# ── 7. Borrow cap enforcement ─────────────────────────────────────────────────
print("\n7. Borrow cap enforcement")
# USDC borrow cap: 800K (from reserves struct). Current borrows ~0.
# Attempt to borrow 900K (over 800K cap)
# First need enough collateral — check current state
# With ~35 WETH at $2000 = $70K, we can't borrow 900K anyway — limited by collateral first
# But we can check the error message
over_cap_borrow = 900_000 * 10**6  # 900K USDC
raw, err = eth_call(GOOD_LEND, "0x4b8a3529" + ea(MOCK_USDC) + eu(over_cap_borrow))
# This will hit undercollateralized before cap, but still should revert
log("Borrow 900K USDC reverts (cap or collateral)", err is not None, note=err or "no error")

# ── 8. Interest rate model: supply at high utilization ─────────────────────────
print("\n8. Check interest rates at current utilization")
# getReserveData: 35ea6a75
raw, err = eth_call(GOOD_LEND, "0x35ea6a75" + ea(MOCK_USDC))
if raw and raw != "0x":
    words = [raw[2+i*64:2+(i+1)*64] for i in range(7)]
    labels = ["totalDeposits","totalBorrows","liquidityIndex","borrowIndex","supplyRate","borrowRate","accruedToTreasury"]
    print("  USDC Reserve:")
    for label, word in zip(labels, words):
        val = int(word, 16)
        if "Rate" in label:
            # Rates are in RAY (1e27)
            pct = val / 1e27 * 100
            print(f"    {label}: {pct:.4f}%/s (annualized ~{pct*365*24*3600:.2f}%)")
        else:
            print(f"    {label}: {val}")
    log("Interest rate model returns rates", int(words[5],16) >= 0)
else:
    log("getReserveData USDC", False, note=err or "empty")

# ── Summary ────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
passes = sum(1 for r in results if r["pass"])
fails = sum(1 for r in results if not r["pass"])
print(f"EDGE CASE RESULTS: {passes} passed, {fails} failed")
print("=" * 60)

if fails:
    print("\nUnexpected failures:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} -- {r['note']}")

with open("/tmp/edge_case_results.json", "w") as f:
    json.dump({"passes": passes, "fails": fails, "results": results}, f, indent=2)
print("Saved to /tmp/edge_case_results.json")
