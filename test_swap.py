#!/usr/bin/env python3
"""Test LiFiBridgeAggregator (GoodSwap) on devnet."""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
LIFI = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"

results = []

def rpc_call(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data):
    res = rpc_call("eth_call", [{"to": to, "data": fn_data, "from": MY_ADDR}, "latest"])
    return res.get("result", "0x")

def send_tx(to, data_hex, value=0, gas=300000):
    tx = {"from": MY_ADDR, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    return rpc_call("eth_sendTransaction", [tx])

def wait_receipt(tx_hash, max_wait=30):
    for _ in range(max_wait):
        res = rpc_call("eth_getTransactionReceipt", [tx_hash])
        if res.get("result"):
            return res["result"]
        time.sleep(0.5)
    return None

def log(name, ok, tx=None, note=""):
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" tx={tx[:10]}..." if tx else "") + (f" -- {note}" if note else ""))
    results.append({"test": name, "pass": ok, "tx": tx, "note": note})

def ea(addr):
    return addr[2:].lower().zfill(64)

def eu(n):
    return hex(n)[2:].zfill(64)

print("=" * 60)
print("LiFiBridgeAggregator (GoodSwap) Tests")
print("=" * 60)

# 1. Check admin
print("\n1. Read contract state")
admin_raw = call(LIFI, "0xf851a440")  # admin()
admin = "0x" + admin_raw[-40:]
print(f"  admin: {admin}")
log("Read admin()", bool(admin_raw and admin_raw != "0x"), note=admin)

# 2. Check UBI fee rate
fee_raw = call(LIFI, "0x50d3c933")  # ubiFeeRateBps()
fee = int(fee_raw, 16) if fee_raw and fee_raw != "0x" else 0
print(f"  UBI fee rate: {fee} bps ({fee/100:.2f}%)")
log("ubiFeeRateBps readable", fee > 0, note=f"{fee} bps")

# 3. Check USDC whitelisted
usdc_wl = call(LIFI, "0xdaf9c210" + ea(MOCK_USDC))  # whitelistedTokens(USDC)
is_usdc_wl = bool(usdc_wl and int(usdc_wl, 16) > 0)
print(f"  USDC whitelisted: {is_usdc_wl}")
log("USDC whitelisted", is_usdc_wl)

# 4. Check supported chain (e.g., Ethereum mainnet = 1)
chain1_raw = call(LIFI, "0x548d496f" + eu(1))  # supportedChains(1)
is_chain1 = bool(chain1_raw and int(chain1_raw, 16) > 0)
print(f"  Chain 1 (Ethereum) supported: {is_chain1}")

# 5. Check swap count
sc_raw = call(LIFI, "0x2eff0d9e")  # swapCount()
sc = int(sc_raw, 16) if sc_raw and sc_raw != "0x" else 0
print(f"  swapCount: {sc}")
log("swapCount readable", sc_raw != "0x", note=str(sc))

# 6. Try initiateSwap with USDC -> WETH on chain 1
# Need: srcToken, srcAmount, minDestAmount, destAddress, destToken, destChainId, deadline
# selector: 02095b79
# initiateSwap(address srcToken, uint256 srcAmount, uint256 minDestAmount,
#              address destAddress, address destToken, uint256 destChainId, uint256 deadline)
print("\n6. Test initiateSwap (USDC->WETH on chain 1)")
# First check if USDC is whitelisted, if not we expect failure
if not is_usdc_wl:
    print("  USDC not whitelisted — trying anyway to check revert reason")

swap_amount = 1_000 * 10**6  # 1K USDC
min_dest = 1 * 10**18  # 1 WETH min
deadline = int(time.time()) + 3600

# Approve aggregator for USDC
data = "0x095ea7b3" + ea(LIFI) + eu(swap_amount)
res = send_tx(MOCK_USDC, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("Approve USDC for LiFiBridgeAggregator", bool(ok), tx_hash)
else:
    log("Approve USDC for LiFiBridgeAggregator", False, note=str(res.get("error")))

# Call initiateSwap
data = ("0x02095b79" +
        ea(MOCK_USDC) +       # srcToken
        eu(swap_amount) +      # srcAmount
        eu(min_dest) +         # minDestAmount
        ea(MY_ADDR) +          # destAddress
        ea(MOCK_WETH) +        # destToken
        eu(1) +                # destChainId (Ethereum mainnet)
        eu(deadline))          # deadline

res = send_tx(LIFI, data, gas=500000)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("initiateSwap USDC->WETH chain 1", bool(ok), tx_hash)
    if not ok:
        # Try eth_call to get revert
        eth_call_res = rpc_call("eth_call", [{"to": LIFI, "data": data, "from": MY_ADDR}, "latest"])
        err = eth_call_res.get("error", {})
        err_data = err.get("data", "")
        if err_data and err_data.startswith("0x08c379a0"):
            raw = bytes.fromhex(err_data[2:])
            length = int.from_bytes(raw[36:68], 'big')
            msg = raw[68:68+length].decode('utf-8', errors='replace')
            log("Revert reason captured", True, note=msg)
        else:
            log("Revert (no message)", False, note=err.get("message", ""))
else:
    log("initiateSwap USDC->WETH chain 1", False, note=str(res.get("error")))

# 7. Try initiateSwapETH (ETH -> something cross-chain)
print("\n7. Test initiateSwapETH")
# initiateSwapETH(uint256 minDestAmount, address destAddress, address destToken, uint256 destChainId, uint256 deadline)
eth_amount = 1 * 10**18  # 1 ETH
data = ("0x8eeb1d0a" +
        eu(1) +             # minDestAmount
        ea(MY_ADDR) +       # destAddress
        ea(MOCK_USDC) +     # destToken
        eu(1) +             # destChainId
        eu(deadline))       # deadline

res = send_tx(LIFI, data, value=eth_amount, gas=500000)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("initiateSwapETH 1ETH->USDC chain 1", bool(ok), tx_hash)
    if not ok:
        eth_call_res = rpc_call("eth_call", [{"to": LIFI, "data": data, "from": MY_ADDR, "value": hex(eth_amount)}, "latest"])
        err = eth_call_res.get("error", {})
        err_data = err.get("data", "")
        if err_data and err_data.startswith("0x08c379a0"):
            raw = bytes.fromhex(err_data[2:])
            length = int.from_bytes(raw[36:68], 'big')
            msg = raw[68:68+length].decode('utf-8', errors='replace')
            log("ETH swap revert reason", True, note=msg)
        else:
            log("ETH swap revert (no message)", False, note=err.get("message", ""))
else:
    log("initiateSwapETH 1ETH->USDC chain 1", False, note=str(res.get("error")))

# Summary
print("\n" + "=" * 60)
passes = sum(1 for r in results if r["pass"])
fails = sum(1 for r in results if not r["pass"])
print(f"SWAP TEST RESULTS: {passes} passed, {fails} failed")
print("=" * 60)

if fails:
    print("\nFailed:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} -- {r['note']}")

with open("/tmp/swap_test_results.json", "w") as f:
    json.dump({"passes": passes, "fails": fails, "results": results}, f, indent=2)
print("Saved to /tmp/swap_test_results.json")
