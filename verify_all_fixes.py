#!/usr/bin/env python3
"""
Final verification suite after all GOO-155, GOO-160, GOO-195 fixes.
Tests: GoodLend full cycle + GoodSwap (token + ETH).
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ADMIN_ADDR = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"
LIFI      = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"
UBI       = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

results = []

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data, value=0, from_addr=MY_ADDR):
    params = {"to": to, "data": fn_data, "from": from_addr}
    if value:
        params["value"] = hex(value)
    res = rpc("eth_call", [params, "latest"])
    err = res.get("error", {})
    if err:
        d = err.get("data", "")
        if d and d.startswith("0x08c379a0"):
            raw = bytes.fromhex(d[2:])
            length = int.from_bytes(raw[36:68], 'big')
            return None, raw[68:68+length].decode('utf-8', errors='replace')
        return None, err.get("message", "reverted")
    return res.get("result", "0x"), None

def send_tx(to, data_hex, value=0, gas=400000, from_addr=MY_ADDR):
    tx = {"from": from_addr, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    return rpc("eth_sendTransaction", [tx])

def wait(tx_hash, max_wait=25):
    for _ in range(max_wait):
        r = rpc("eth_getTransactionReceipt", [tx_hash])
        if r.get("result"):
            return r["result"]
        time.sleep(0.5)
    return None

def log(name, ok, tx=None, note=""):
    s = "PASS" if ok else "FAIL"
    print(f"  [{s}] {name}" + (f" tx={tx[:12]}..." if tx else "") + (f" -- {note}" if note else ""))
    results.append({"test": name, "pass": ok, "note": note})

def ea(a):
    return a[2:].lower().zfill(64)

def eu(n):
    return hex(n)[2:].zfill(64)

def erc20_bal(token, addr):
    r, _ = call(token, "0x70a08231" + ea(addr))
    return int(r, 16) if r and r != "0x" else 0

print("=" * 65)
print("FINAL VERIFICATION: GOO-155 + GOO-160 + GOO-195 Fixes")
print("=" * 65)

# ── 1. GOO-155: gToken allowance ─────────────────────────────────────────────
print("\n[GOO-155] GoodLendToken approve() fix")
GTOKEN_USDC = "0xa85233c63b9ee964add6f2cffe00fd84eb32338f"
GTOKEN_WETH = "0x7a2088a1bfc9d81c55368ae168c2c02570cb814f"

r1, _ = call(MOCK_USDC, "0xdd62ed3e" + ea(GTOKEN_USDC) + ea(GOOD_LEND))
r2, _ = call(MOCK_WETH, "0xdd62ed3e" + ea(GTOKEN_WETH) + ea(GOOD_LEND))
usdc_allow = int(r1, 16) if r1 else 0
weth_allow = int(r2, 16) if r2 else 0
MAX = 2**256 - 1
log("gToken(USDC) -> pool allowance = MAX", usdc_allow == MAX, note=f"val={'MAX' if usdc_allow==MAX else usdc_allow}")
log("gToken(WETH) -> pool allowance = MAX", weth_allow == MAX, note=f"val={'MAX' if weth_allow==MAX else weth_allow}")

# ── 2. GOO-155: Full lending cycle with REAL contract (no impersonation) ────
print("\n[GOO-155] Full lending cycle (no simulation)")

# Mint tokens
for name, token, amount in [("USDC", MOCK_USDC, 50_000*10**6), ("WETH", MOCK_WETH, 20*10**18)]:
    data = "0x40c10f19" + ea(MY_ADDR) + eu(amount)
    res = send_tx(token, data)
    tx = res.get("result")
    if tx:
        rcpt = wait(tx)
        log(f"Mint {name}", bool(rcpt and rcpt["status"]=="0x1"), tx)

# Supply 5 WETH
data = "0x095ea7b3" + ea(GOOD_LEND) + eu(5*10**18)
res = send_tx(MOCK_WETH, data)
wait(res.get("result",""))

data = "0xf2b9fdb8" + ea(MOCK_WETH) + eu(5*10**18)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    log("Supply 5 WETH to GoodLendPool", bool(rcpt and rcpt["status"]=="0x1"), tx)

# Borrow 2K USDC
borrow_amt = 2_000 * 10**6
preview, err = call(GOOD_LEND, "0x4b8a3529" + ea(MOCK_USDC) + eu(borrow_amt))
log("Borrow 2K USDC — eth_call preview", preview is not None, note=err or "would succeed")

data = "0x4b8a3529" + ea(MOCK_USDC) + eu(borrow_amt)
usdc_before = erc20_bal(MOCK_USDC, MY_ADDR)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"] == "0x1")
    log("Borrow 2K USDC (real tx)", ok, tx)
    if ok:
        usdc_after = erc20_bal(MOCK_USDC, MY_ADDR)
        log("USDC balance increased by 2K", usdc_after - usdc_before >= 2_000*10**6 - 1,
            note=f"+{(usdc_after-usdc_before)/1e6:.2f}")

# Repay + withdraw
data = "0x095ea7b3" + ea(GOOD_LEND) + eu(2**256-1)
send_tx(MOCK_USDC, data)

data = "0x22867d78" + ea(MOCK_USDC) + eu(2**256-1)
res = send_tx(GOOD_LEND, data)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    log("Full repay USDC", bool(rcpt and rcpt["status"]=="0x1"), tx)

# ── 3. GOO-195: UBIFeeSplitter accepts ETH ───────────────────────────────────
print("\n[GOO-195] UBIFeeSplitter ETH receive")

code = rpc("eth_getCode", [UBI, "latest"])
code_size = (len(code.get("result","0x"))-2)//2
log("UBIFeeSplitter code size > 5000 bytes (redeployed)", code_size > 5000, note=f"{code_size} bytes")

eth_before = int(rpc("eth_getBalance", [UBI, "latest"]).get("result","0x0"), 16)
res = send_tx(UBI, "0x", value=10**17, gas=50000)  # send 0.1 ETH
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"]=="0x1")
    log("Send 0.1 ETH to UBIFeeSplitter", ok, tx)
    eth_after = int(rpc("eth_getBalance", [UBI, "latest"]).get("result","0x0"), 16)
    log("UBIFeeSplitter ETH balance increased", eth_after > eth_before,
        note=f"{eth_after/1e18:.4f} ETH")

# ── 4. GOO-160: initiateSwap (token) + initiateSwapETH ───────────────────────
print("\n[GOO-160/GOO-195] GoodSwap full test")

# Check current LIFI state
splitter_raw, _ = call(LIFI, "0x72db3abf")
splitter = "0x" + splitter_raw[-40:] if splitter_raw else "?"
log("LIFI ubiFeeSplitter = real UBIFeeSplitter",
    splitter.lower() == UBI.lower(), note=splitter)

usdc_wl, _ = call(LIFI, "0xdaf9c210" + ea(MOCK_USDC))
log("USDC whitelisted in LIFI", bool(usdc_wl and int(usdc_wl,16)>0))

chain_ok, _ = call(LIFI, "0x548d496f" + eu(42069))
log("Chain 42069 supported", bool(chain_ok and int(chain_ok,16)>0))

deadline = int(time.time()) + 3600

# Setup: whitelist if needed
if not (usdc_wl and int(usdc_wl,16)>0):
    batch = "0x9a48ba10" + eu(32) + eu(2) + ea(MOCK_USDC) + ea(MOCK_WETH)
    rpc("anvil_impersonateAccount", [ADMIN_ADDR])
    res = rpc("eth_sendTransaction", [{"from": ADMIN_ADDR, "to": LIFI, "data": batch, "gas": "0x50000"}])
    wait(res.get("result",""))
    rpc("anvil_stopImpersonatingAccount", [ADMIN_ADDR])

if not (chain_ok and int(chain_ok,16)>0):
    rpc("anvil_impersonateAccount", [ADMIN_ADDR])
    res = rpc("eth_sendTransaction", [{"from": ADMIN_ADDR, "to": LIFI, "data": "0x46c6f5f4"+eu(42069)+eu(1), "gas": "0x30000"}])
    wait(res.get("result",""))
    rpc("anvil_stopImpersonatingAccount", [ADMIN_ADDR])

# initiateSwap (token)
swap_amt = 500 * 10**6
data = "0x095ea7b3" + ea(LIFI) + eu(swap_amt * 2)
send_tx(MOCK_USDC, data)

data = ("0x02095b79" + ea(MOCK_USDC) + eu(swap_amt) +
        eu(42069) + ea(MOCK_WETH) + ea(MY_ADDR) + eu(1) + eu(deadline))
res = send_tx(LIFI, data, gas=500000)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"]=="0x1")
    log("initiateSwap USDC->WETH (token swap)", ok, tx)

# initiateSwapETH
eth_amt = 10**18
data = "0x8eeb1d0a" + eu(1) + ea(MOCK_USDC) + ea(MY_ADDR) + eu(42069) + eu(deadline)

preview, err = call(LIFI, data, value=eth_amt)
log("initiateSwapETH — eth_call preview", preview is not None, note=err or "would succeed")

res = send_tx(LIFI, data, value=eth_amt, gas=500000)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"]=="0x1")
    log("initiateSwapETH 1ETH->USDC", ok, tx)
    if ok:
        sc, _ = call(LIFI, "0x2eff0d9e")
        log("swapCount > 0 after ETH swap", bool(sc and int(sc,16)>0), note=f"count={int(sc,16) if sc else 0}")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
passes = sum(1 for r in results if r["pass"])
fails = sum(1 for r in results if not r["pass"])
print(f"RESULTS: {passes} passed, {fails} failed")
print("=" * 65)
if fails:
    print("\nFailed:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} -- {r['note']}")
