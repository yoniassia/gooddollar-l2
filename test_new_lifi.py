#!/usr/bin/env python3
"""Test new LiFiBridgeAggregator + UBIFeeSplitter deployment."""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"

# New addresses
NEW_UBI  = "0x683d9cdd3239e0e01e8dc6315fa50ad92ab71d2d"
NEW_LIFI = "0x1c9fd50df7a4f066884b58a05d91e4b55005876a"

results = []

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data, value=0):
    params = {"to": to, "data": fn_data, "from": MY_ADDR}
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

def send_tx(to, data_hex, value=0, gas=500000):
    tx = {"from": MY_ADDR, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    return rpc("eth_sendTransaction", [tx])

def wait(tx_hash, max_wait=20):
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

print("=" * 60)
print("New LiFiBridgeAggregator + UBIFeeSplitter Tests")
print(f"  UBI:  {NEW_UBI}")
print(f"  LiFi: {NEW_LIFI}")
print("=" * 60)

# ── 1. Verify contracts ───────────────────────────────────────────────────────
print("\n1. Contract verification")

# UBI has receive()
res = send_tx(NEW_UBI, "0x", value=10**17, gas=50000)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"] == "0x1")
    log("UBIFeeSplitter accepts ETH (receive())", ok, tx)
else:
    log("UBIFeeSplitter accepts ETH", False, note=str(res))

# LIFI points to new UBI
r, _ = call(NEW_LIFI, "0x72db3abf")
splitter = "0x" + r[-40:] if r else "?"
log("LiFi.ubiFeeSplitter = new UBI", splitter.lower() == NEW_UBI.lower(), note=splitter)

# Whitelist check
usdc_wl, _ = call(NEW_LIFI, "0xdaf9c210" + ea(MOCK_USDC))
weth_wl, _ = call(NEW_LIFI, "0xdaf9c210" + ea(MOCK_WETH))
log("USDC whitelisted", bool(usdc_wl and int(usdc_wl,16)>0))
log("WETH whitelisted", bool(weth_wl and int(weth_wl,16)>0))

chain_ok, _ = call(NEW_LIFI, "0x548d496f" + eu(42069))
log("Chain 42069 supported", bool(chain_ok and int(chain_ok,16)>0))

# UBI fee rate
fee_r, _ = call(NEW_LIFI, "0x50d3c933")
fee = int(fee_r, 16) if fee_r else 0
log("UBI fee rate readable", fee > 0, note=f"{fee} bps")

# ── 2. initiateSwap (token) ───────────────────────────────────────────────────
print("\n2. initiateSwap (USDC->WETH, chain 42069)")
deadline = int(time.time()) + 3600
swap_amt = 500 * 10**6

# Approve
data = "0x095ea7b3" + ea(NEW_LIFI) + eu(swap_amt)
res = send_tx(MOCK_USDC, data)
rcpt = wait(res.get("result",""))
log("Approve USDC", bool(rcpt and rcpt["status"]=="0x1"))

# Preview
data = ("0x02095b79" + ea(MOCK_USDC) + eu(swap_amt) +
        eu(42069) + ea(MOCK_WETH) + ea(MY_ADDR) + eu(1) + eu(deadline))
preview, err = call(NEW_LIFI, data)
log("initiateSwap eth_call preview", preview is not None, note=err or "would succeed")

res = send_tx(NEW_LIFI, data)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"] == "0x1")
    log("initiateSwap USDC->WETH", ok, tx)
    if ok:
        sc, _ = call(NEW_LIFI, "0x2eff0d9e")
        swap_id = int(sc,16) - 1 if sc else -1
        log("swapCount incremented", swap_id >= 0, note=f"swapId={swap_id}")
        # Read swap state
        swap_data, _ = call(NEW_LIFI, "0x4a0d89ba" + eu(swap_id))
        if swap_data and swap_data != "0x":
            words = [swap_data[2+i*64:2+(i+1)*64] for i in range(9)]
            status = int(words[8],16) if len(words)>8 else -1
            log("Swap status = Pending", status == 0, note=f"status={status}")

# ── 3. initiateSwapETH ────────────────────────────────────────────────────────
print("\n3. initiateSwapETH (1 ETH->USDC, chain 42069)")
eth_amt = 10**18
data = "0x8eeb1d0a" + eu(1) + ea(MOCK_USDC) + ea(MY_ADDR) + eu(42069) + eu(deadline)

# Preview
preview, err = call(NEW_LIFI, data, value=eth_amt)
log("initiateSwapETH eth_call preview", preview is not None, note=err or "would succeed")

ubi_eth_before = int(rpc("eth_getBalance", [NEW_UBI, "latest"]).get("result","0x0"), 16)

res = send_tx(NEW_LIFI, data, value=eth_amt)
tx = res.get("result")
if tx:
    rcpt = wait(tx)
    ok = bool(rcpt and rcpt["status"] == "0x1")
    log("initiateSwapETH 1 ETH->USDC", ok, tx)
    if ok:
        ubi_eth_after = int(rpc("eth_getBalance", [NEW_UBI, "latest"]).get("result","0x0"), 16)
        fee_received = ubi_eth_after - ubi_eth_before
        log("UBIFeeSplitter received ETH fee", fee_received > 0,
            note=f"{fee_received/1e18:.6f} ETH fee")
        sc, _ = call(NEW_LIFI, "0x2eff0d9e")
        log("swapCount = 2 after ETH swap", sc and int(sc,16) == 2,
            note=f"count={int(sc,16) if sc else 0}")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
passes = sum(1 for r in results if r["pass"])
fails = sum(1 for r in results if not r["pass"])
print(f"RESULTS: {passes} passed, {fails} failed")
print("=" * 60)

if fails:
    print("\nFailed:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} -- {r['note']}")
