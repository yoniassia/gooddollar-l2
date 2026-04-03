#!/usr/bin/env python3
"""
Full GoodLend cycle test: supply -> borrow -> repay -> withdraw
Requires gToken allowances to be set (from simulate_fix.py or redeployment).
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
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
        return None, err.get("message", "unknown error")
    return res.get("result", "0x"), None

def send_tx(to, data_hex, value=0, gas=400000):
    tx = {"from": MY_ADDR, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    return rpc("eth_sendTransaction", [tx])

def wait_receipt(tx_hash, max_wait=30):
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

def get_user_account():
    raw, err = eth_call(GOOD_LEND, "0xbf92857c" + ea(MY_ADDR))
    if raw and raw != "0x":
        words = [raw[2+i*64:2+(i+1)*64] for i in range(3)]
        hf = int(words[0], 16)
        collateral = int(words[1], 16)
        debt = int(words[2], 16)
        return hf, collateral, debt
    return 0, 0, 0

print("=" * 65)
print("GoodLend Full Cycle Test: Supply -> Borrow -> Repay -> Withdraw")
print("=" * 65)

# ── Check allowances first ─────────────────────────────────────────────────
usdc_al, _ = eth_call(MOCK_USDC, "0xdd62ed3e" + ea("0xa85233c63b9ee964add6f2cffe00fd84eb32338f") + ea(GOOD_LEND))
weth_al, _ = eth_call(MOCK_WETH, "0xdd62ed3e" + ea("0x7a2088a1bfc9d81c55368ae168c2c02570cb814f") + ea(GOOD_LEND))
usdc_allowance = int(usdc_al, 16) if usdc_al else 0
weth_allowance = int(weth_al, 16) if weth_al else 0
print(f"\nPre-check: gToken USDC->pool allowance: {'MAX' if usdc_allowance > 10**30 else usdc_allowance}")
print(f"Pre-check: gToken WETH->pool allowance: {'MAX' if weth_allowance > 10**30 else weth_allowance}")

if usdc_allowance == 0 or weth_allowance == 0:
    print("WARNING: Allowances not set. Run simulate_fix.py first.")

# ── Initial state ──────────────────────────────────────────────────────────
print("\n=== Balances Before Tests ===")
usdc_start = erc20_bal(MOCK_USDC, MY_ADDR)
weth_start = erc20_bal(MOCK_WETH, MY_ADDR)
print(f"  USDC: {usdc_start/1e6:.2f}")
print(f"  WETH: {weth_start/1e18:.4f}")

hf, col, debt = get_user_account()
print(f"  healthFactor: {hf/1e27:.4f}" if hf > 0 else "  healthFactor: n/a")
print(f"  collateralUSD: {col}")
print(f"  debtUSD: {debt}")

# ── 1. Fresh supply WETH (need some for collateral) ────────────────────────
print("\n1. Supply 5 WETH as collateral")
supply_weth = 5 * 10**18

# Approve
data = "0x095ea7b3" + ea(GOOD_LEND) + eu(supply_weth)
res = send_tx(MOCK_WETH, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    log("Approve 5 WETH to pool", bool(receipt and receipt["status"] == "0x1"), tx)
else:
    log("Approve 5 WETH", False, note=str(res.get("error")))

# Supply
data = "0xf2b9fdb8" + ea(MOCK_WETH) + eu(supply_weth)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    log("Supply 5 WETH to GoodLendPool", bool(receipt and receipt["status"] == "0x1"), tx)
else:
    log("Supply 5 WETH", False, note=str(res.get("error")))

# ── 2. Borrow USDC ────────────────────────────────────────────────────────
print("\n2. Borrow 3K USDC against WETH collateral")
borrow_usdc = 3_000 * 10**6

# Pre-check via eth_call
raw, err = eth_call(GOOD_LEND, "0x4b8a3529" + ea(MOCK_USDC) + eu(borrow_usdc))
if err:
    print(f"  eth_call preview: would revert -- {err}")
else:
    print(f"  eth_call preview: would succeed")

data = "0x4b8a3529" + ea(MOCK_USDC) + eu(borrow_usdc)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
usdc_before_borrow = erc20_bal(MOCK_USDC, MY_ADDR)
if tx:
    receipt = wait_receipt(tx)
    ok = bool(receipt and receipt["status"] == "0x1")
    log("Borrow 3K USDC from GoodLendPool", ok, tx)
    if ok:
        usdc_after = erc20_bal(MOCK_USDC, MY_ADDR)
        gained = (usdc_after - usdc_before_borrow) / 1e6
        log(f"USDC increased by {gained:.2f}", gained >= 2999)
else:
    log("Borrow 3K USDC", False, note=str(res.get("error")))

# ── 3. Check health factor ─────────────────────────────────────────────────
print("\n3. Health factor after borrow")
hf, col, debt = get_user_account()
hf_human = hf / 1e27 if hf < 10**30 else float("inf")
print(f"  healthFactor: {hf_human:.4f}")
print(f"  collateralUSD: {col}")
print(f"  debtUSD: {debt}")
log("Health factor >= 1.0 after borrow", hf_human >= 1.0, note=f"HF={hf_human:.2f}")

# ── 4. Repay half the USDC debt ─────────────────────────────────────────────
print("\n4. Repay 1.5K USDC (half the debt)")
repay_usdc = 1_500 * 10**6

# Approve repay
data = "0x095ea7b3" + ea(GOOD_LEND) + eu(repay_usdc)
res = send_tx(MOCK_USDC, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    log("Approve USDC for repay", bool(receipt and receipt["status"] == "0x1"), tx)

# Repay: selector 22867d78
data = "0x22867d78" + ea(MOCK_USDC) + eu(repay_usdc)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    ok = bool(receipt and receipt["status"] == "0x1")
    log("Repay 1.5K USDC", ok, tx)
    if not ok:
        raw2, err2 = eth_call(GOOD_LEND, data)
        print(f"  Repay revert: {err2}")
else:
    log("Repay 1.5K USDC", False, note=str(res.get("error")))

# ── 5. Withdraw WETH ────────────────────────────────────────────────────────
print("\n5. Withdraw 2 WETH from GoodLendPool")
withdraw_weth = 2 * 10**18

# Check withdrawal via eth_call: selector f3fef3a3
data = "0xf3fef3a3" + ea(MOCK_WETH) + eu(withdraw_weth)
raw, err = eth_call(GOOD_LEND, data)
if err:
    print(f"  eth_call withdraw preview: would revert -- {err}")
else:
    print(f"  eth_call withdraw preview: OK")

res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    ok = bool(receipt and receipt["status"] == "0x1")
    log("Withdraw 2 WETH from GoodLendPool", ok, tx)
else:
    log("Withdraw 2 WETH", False, note=str(res.get("error")))

# ── 6. Full repay remaining ──────────────────────────────────────────────────
print("\n6. Repay remaining USDC debt (max)")
# type(uint256).max = full repay
max_uint = (2**256) - 1

# Approve max
data = "0x095ea7b3" + ea(GOOD_LEND) + eu(max_uint)
res = send_tx(MOCK_USDC, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    log("Approve max USDC for full repay", bool(receipt and receipt["status"] == "0x1"), tx)

# Repay max
data = "0x22867d78" + ea(MOCK_USDC) + eu(max_uint)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    receipt = wait_receipt(tx)
    ok = bool(receipt and receipt["status"] == "0x1")
    log("Full repay remaining USDC debt", ok, tx)
else:
    log("Full repay", False, note=str(res.get("error")))

# ── 7. Final state ──────────────────────────────────────────────────────────
print("\n=== Final Balances ===")
usdc_end = erc20_bal(MOCK_USDC, MY_ADDR)
weth_end = erc20_bal(MOCK_WETH, MY_ADDR)
print(f"  USDC: {usdc_end/1e6:.2f}")
print(f"  WETH: {weth_end/1e18:.4f}")

hf2, col2, debt2 = get_user_account()
hf2_human = hf2 / 1e27 if hf2 < 10**30 else float("inf")
print(f"  healthFactor: {hf2_human}")
print(f"  debtUSD: {debt2}")
log("Final debt == 0 (fully repaid)", debt2 == 0, note=f"debt={debt2}")

# ── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
passes = sum(1 for r in results if r["pass"])
fails = sum(1 for r in results if not r["pass"])
print(f"FULL CYCLE RESULTS: {passes} passed, {fails} failed")
print("=" * 65)

if fails:
    print("\nFailed:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} -- {r['note']}")

with open("/tmp/lend_full_results.json", "w") as f:
    json.dump({"passes": passes, "fails": fails, "results": results}, f, indent=2)
print("Saved to /tmp/lend_full_results.json")
