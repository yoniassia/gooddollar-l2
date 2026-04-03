#!/usr/bin/env python3
"""
Test LiFiBridgeAggregator (GoodSwap) on devnet — corrected parameter order.
initiateSwap(srcToken, srcAmount, destChainId, destToken, destReceiver, minDestAmount, deadline)
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ADMIN_ADDR = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
LIFI = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"

results = []

def rpc_call(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data, from_addr=MY_ADDR):
    res = rpc_call("eth_call", [{"to": to, "data": fn_data, "from": from_addr}, "latest"])
    return res

def send_tx(from_addr, to, data_hex, value=0, gas=300000):
    tx = {"from": from_addr, "to": to, "data": data_hex, "gas": hex(gas)}
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

def get_revert_msg(eth_call_res):
    err = eth_call_res.get("error", {})
    err_data = err.get("data", "")
    if err_data and err_data.startswith("0x08c379a0"):
        raw = bytes.fromhex(err_data[2:])
        length = int.from_bytes(raw[36:68], 'big')
        return raw[68:68+length].decode('utf-8', errors='replace')
    if err_data and err_data.startswith("0x"):
        selector = err_data[2:10]
        data_val = err_data[10:]
        return f"custom error 0x{selector} data={data_val[:64]}"
    return err.get("message", "no message")

print("=" * 60)
print("LiFiBridgeAggregator (GoodSwap) Tests — v2")
print("=" * 60)

# 1. Whitelist USDC and WETH as admin
print("\n1. Whitelist USDC and WETH (admin)")
# batchWhitelistTokens(address[])
# ABI encode: 9a48ba10 + offset(32) + length(2) + addr1 + addr2
batch_data = ("0x9a48ba10" +
              eu(32) +       # offset to array data
              eu(2) +        # array length
              ea(MOCK_USDC) +
              ea(MOCK_WETH))
res = send_tx(ADMIN_ADDR, LIFI, batch_data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("batchWhitelistTokens(USDC, WETH)", bool(ok), tx_hash)
else:
    log("batchWhitelistTokens", False, note=str(res.get("error")))

# Verify whitelist
usdc_wl = call(LIFI, "0xdaf9c210" + ea(MOCK_USDC)).get("result", "0x")
weth_wl = call(LIFI, "0xdaf9c210" + ea(MOCK_WETH)).get("result", "0x")
log("USDC whitelisted post-setup", bool(usdc_wl and int(usdc_wl, 16) > 0))
log("WETH whitelisted post-setup", bool(weth_wl and int(weth_wl, 16) > 0))

# 2. Enable chain 42069 (our devnet) as supported chain
print("\n2. Enable chain 42069 as supported")
# setSupportedChain(uint256 chainId, bool supported)
res = send_tx(ADMIN_ADDR, LIFI, "0x46c6f5f4" + eu(42069) + eu(1))
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("setSupportedChain(42069, true)", bool(ok), tx_hash)
else:
    log("setSupportedChain(42069)", False, note=str(res.get("error")))

# 3. Approve USDC for aggregator (as tester)
print("\n3. Approve USDC for aggregator")
swap_amount = 1_000 * 10**6  # 1K USDC
data = "0x095ea7b3" + ea(LIFI) + eu(swap_amount * 2)
res = send_tx(MY_ADDR, MOCK_USDC, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("Approve 2K USDC for LiFiBridgeAggregator", bool(ok), tx_hash)
else:
    log("Approve USDC", False, note=str(res.get("error")))

# 4. initiateSwap USDC -> WETH on chain 42069
# initiateSwap(srcToken, srcAmount, destChainId, destToken, destReceiver, minDestAmount, deadline)
print("\n4. initiateSwap USDC->WETH on chain 42069")
deadline = int(time.time()) + 3600
min_dest = 1  # tiny minimum, we just want the swap to register
data = ("0x02095b79" +
        ea(MOCK_USDC) +    # srcToken
        eu(swap_amount) +  # srcAmount = 1K USDC
        eu(42069) +        # destChainId
        ea(MOCK_WETH) +    # destToken
        ea(MY_ADDR) +      # destReceiver
        eu(min_dest) +     # minDestAmount = 1 wei (minimal)
        eu(deadline))      # deadline

res = send_tx(MY_ADDR, LIFI, data, gas=500000)
tx_hash = res.get("result")
swap_id = None
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("initiateSwap USDC->WETH", bool(ok), tx_hash)
    if ok:
        # Get swap count to find our swap ID
        sc_raw = call(LIFI, "0x2eff0d9e").get("result", "0x")
        sc = int(sc_raw, 16)
        swap_id = sc - 1
        print(f"    swapCount now: {sc}, our swap ID: {swap_id}")
    else:
        # Get revert reason
        revert_res = call(LIFI, data)
        msg = get_revert_msg(revert_res)
        log("initiateSwap revert reason", True, note=msg)
else:
    log("initiateSwap USDC->WETH", False, note=str(res.get("error")))

# 5. Check swap state
if swap_id is not None:
    print(f"\n5. Read swap state (swap_id={swap_id})")
    # getSwap(uint256 swapId)
    swap_data = call(LIFI, "0x4a0d89ba" + eu(swap_id)).get("result", "0x")
    if swap_data and swap_data != "0x":
        # Parse: user, srcToken, srcAmount, destChainId, destToken, destReceiver, minDestAmount, deadline, status, lifiTxHash
        words = [swap_data[2+i*64:2+(i+1)*64] for i in range(len(swap_data[2:])//64)]
        labels = ["user", "srcToken", "srcAmount", "destChainId", "destToken", "destReceiver", "minDestAmount", "deadline", "status", "lifiTxHash"]
        for i, (label, word) in enumerate(zip(labels, words)):
            val = int(word, 16)
            if label in ["user", "srcToken", "destToken", "destReceiver"]:
                display = "0x" + word[-40:]
            elif label == "status":
                display = ["Pending", "Completed", "Refunded", "Expired"].pop(min(val, 3)) if val < 4 else str(val)
            else:
                display = str(val)
            print(f"    {label}: {display}")
        status_val = int(words[8], 16) if len(words) > 8 else -1
        log("Swap status = Pending(0)", status_val == 0)
    else:
        log("Read swap state", False, note="empty response")

# 6. Test initiateSwapETH (chain 42069, WETH destination)
print("\n6. initiateSwapETH -> USDC on chain 42069")
eth_amount = 1 * 10**18  # 1 ETH
# initiateSwapETH(uint256 minDestAmount, address destToken, address destReceiver, uint256 destChainId, uint256 deadline)
data = ("0x8eeb1d0a" +
        eu(1) +             # minDestAmount
        ea(MOCK_USDC) +     # destToken
        ea(MY_ADDR) +       # destReceiver
        eu(42069) +         # destChainId
        eu(deadline))       # deadline

res = send_tx(MY_ADDR, LIFI, data, value=eth_amount, gas=500000)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    log("initiateSwapETH 1ETH->USDC", bool(ok), tx_hash)
    if ok:
        sc_raw = call(LIFI, "0x2eff0d9e").get("result", "0x")
        sc = int(sc_raw, 16)
        print(f"    swapCount now: {sc}")
    else:
        revert_res = rpc_call("eth_call", [{"to": LIFI, "data": data, "from": MY_ADDR, "value": hex(eth_amount)}, "latest"])
        msg = get_revert_msg(revert_res)
        log("ETH swap revert reason", True, note=msg)
else:
    log("initiateSwapETH", False, note=str(res.get("error")))

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
