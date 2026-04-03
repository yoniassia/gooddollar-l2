#!/usr/bin/env python3
"""Test ETH transfer to real UBIFeeSplitter."""
import json, urllib.request, time

RPC = "http://localhost:8545"
REAL_UBI = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
LIFI = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def wait_receipt(tx_hash):
    for _ in range(15):
        r = rpc("eth_getTransactionReceipt", [tx_hash])
        if r.get("result"):
            return r["result"]
        time.sleep(0.5)
    return None

def ea(addr):
    return addr[2:].lower().zfill(64)

def eu(n):
    return hex(n)[2:].zfill(64)

# Direct ETH transfer to check if receive() exists
eth_bal_before = int(rpc("eth_getBalance", [REAL_UBI, "latest"]).get("result","0x0"), 16)
print(f"UBI splitter ETH before: {eth_bal_before/1e18} ETH")

one_eth = 10**18
res = rpc("eth_sendTransaction", [{"from": MY_ADDR, "to": REAL_UBI, "value": hex(one_eth), "gas": "0x30000"}])
tx_hash = res.get("result")
print(f"Send ETH tx: {tx_hash}")

if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    print(f"Status: {'SUCCESS (has receive())' if ok else 'FAIL (no receive())'}")
    if not ok:
        # Check what's at this address
        code = rpc("eth_getCode", [REAL_UBI, "latest"])
        print(f"Code size: {(len(code.get('result','0x'))-2)//2} bytes")
        # Try eth_call fallback
        call_res = rpc("eth_call", [{"to": REAL_UBI, "from": MY_ADDR, "value": hex(one_eth)}, "latest"])
        err = call_res.get("error", {})
        print(f"eth_call result: {err.get('message','no error')}")

    eth_bal_after = int(rpc("eth_getBalance", [REAL_UBI, "latest"]).get("result","0x0"), 16)
    print(f"UBI splitter ETH after: {eth_bal_after/1e18} ETH")
else:
    print("Error:", res)

# Now test initiateSwapETH (ubiFeeSplitter was updated to REAL_UBI in previous test)
print("\nTest initiateSwapETH with real UBIFeeSplitter:")
deadline = int(time.time()) + 3600
eth_amount = 1 * 10**18

data = ("0x8eeb1d0a" +
        eu(1) +
        ea(MOCK_USDC) +
        ea(MY_ADDR) +
        eu(42069) +
        eu(deadline))

# eth_call preview
call_res = rpc("eth_call", [{"to": LIFI, "data": data, "from": MY_ADDR, "value": hex(eth_amount)}, "latest"])
err = call_res.get("error", {})
if err:
    err_data = err.get("data", "")
    if err_data and err_data.startswith("0x08c379a0"):
        raw = bytes.fromhex(err_data[2:])
        length = int.from_bytes(raw[36:68], 'big')
        reason = raw[68:68+length].decode('utf-8', errors='replace')
        print(f"eth_call: FAIL -- {reason}")
    else:
        print(f"eth_call: FAIL -- {err.get('message','?')} data={err_data[:40]}")
else:
    print("eth_call: WOULD SUCCEED")

res = rpc("eth_sendTransaction", [{"from": MY_ADDR, "to": LIFI, "data": data, "value": hex(eth_amount), "gas": hex(500000)}])
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    ok = receipt and receipt.get("status") == "0x1"
    print(f"initiateSwapETH: {'PASS' if ok else 'FAIL'} tx={tx_hash[:14]}")
else:
    print("Failed:", res)
