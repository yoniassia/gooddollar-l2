#!/usr/bin/env python3
"""
Deploy new UBIFeeSplitter + LiFiBridgeAggregator from compiled bytecode.
Implements what RedeployUBIAndLiFi.s.sol would do.
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
DEPLOYER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
MY_ADDR  = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
GDOLLAR  = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
MOCK_WETH = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def wait(tx_hash, max_wait=30):
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

# Load compiled bytecodes
with open('/home/goodclaw/gooddollar-l2/out/UBIFeeSplitter.sol/UBIFeeSplitter.json') as f:
    ubi_data = json.load(f)
ubi_bc = ubi_data['bytecode']['object']

with open('/home/goodclaw/gooddollar-l2/out/LiFiBridgeAggregator.sol/LiFiBridgeAggregator.json') as f:
    lifi_data = json.load(f)
lifi_bc = lifi_data['bytecode']['object']

print(f"UBIFeeSplitter bytecode: {len(ubi_bc)//2} bytes")
print(f"LiFiBridgeAggregator bytecode: {len(lifi_bc)//2} bytes")

# Check for receive() in UBIFeeSplitter bytecode
# receive() creates a fallback entry with ISZERO JUMPI pattern in bytecode
# Simpler: check bytecode length changed from deployed version
old_code = rpc("eth_getCode", ["0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "latest"])
old_size = (len(old_code.get("result","0x"))-2)//2
print(f"Deployed UBIFeeSplitter size: {old_size} bytes")
print(f"New UBIFeeSplitter size: {len(ubi_bc)//2} bytes")

# ABI-encode constructor args for UBIFeeSplitter(address, address, address)
# constructor(address _goodDollar, address _treasury, address _admin)
ubi_args = ea(GDOLLAR) + ea(DEPLOYER) + ea(DEPLOYER)
ubi_deploy_data = ubi_bc + ubi_args

# Deploy UBIFeeSplitter
print("\n1. Deploying new UBIFeeSplitter...")
res = rpc("eth_sendTransaction", [{"from": DEPLOYER, "data": ubi_deploy_data, "gas": "0x200000"}])
tx_hash = res.get("result")
if not tx_hash:
    print("FAILED:", res)
    exit(1)

receipt = wait(tx_hash)
if not receipt or receipt.get("status") != "0x1":
    print("Deploy failed!")
    exit(1)

new_ubi = receipt.get("contractAddress")
print(f"New UBIFeeSplitter: {new_ubi}")

# Verify it accepts ETH
test_res = rpc("eth_sendTransaction", [{"from": MY_ADDR, "to": new_ubi, "value": "0x16345785D8A0000", "gas": "0x30000"}])
test_tx = test_res.get("result")
if test_tx:
    test_rcpt = wait(test_tx)
    ok = test_rcpt and test_rcpt.get("status") == "0x1"
    print(f"ETH transfer to new UBIFeeSplitter: {'PASS' if ok else 'FAIL'}")
    if not ok:
        print("New UBIFeeSplitter does NOT accept ETH — bytecode lacks receive()")
        exit(1)
else:
    print("ETH test send failed:", test_res)

# ABI-encode constructor args for LiFiBridgeAggregator(address admin, address ubiFeeSplitter)
lifi_args = ea(DEPLOYER) + ea(new_ubi)
lifi_deploy_data = lifi_bc + lifi_args

# Deploy LiFiBridgeAggregator
print("\n2. Deploying new LiFiBridgeAggregator...")
res = rpc("eth_sendTransaction", [{"from": DEPLOYER, "data": lifi_deploy_data, "gas": "0x400000"}])
tx_hash = res.get("result")
if not tx_hash:
    print("FAILED:", res)
    exit(1)

receipt = wait(tx_hash)
if not receipt or receipt.get("status") != "0x1":
    print("LiFi deploy failed!")
    exit(1)

new_lifi = receipt.get("contractAddress")
print(f"New LiFiBridgeAggregator: {new_lifi}")

# Whitelist tokens: batchWhitelistTokens([GDOLLAR, MOCK_WETH, MOCK_USDC])
# selector: 9a48ba10
batch_data = ("0x9a48ba10" + eu(32) + eu(3) + ea(GDOLLAR) + ea(MOCK_WETH) + ea(MOCK_USDC))
res = rpc("eth_sendTransaction", [{"from": DEPLOYER, "to": new_lifi, "data": batch_data, "gas": "0x80000"}])
rcpt = wait(res.get("result",""))
ok = rcpt and rcpt.get("status") == "0x1"
print(f"Whitelist tokens: {'OK' if ok else 'FAIL'}")

# Enable chain 42069
res = rpc("eth_sendTransaction", [{"from": DEPLOYER, "to": new_lifi,
          "data": "0x46c6f5f4" + eu(42069) + eu(1), "gas": "0x30000"}])
rcpt = wait(res.get("result",""))
ok = rcpt and rcpt.get("status") == "0x1"
print(f"Enable chain 42069: {'OK' if ok else 'FAIL'}")

print(f"\n=== Redeployment Complete ===")
print(f"New UBIFeeSplitter:      {new_ubi}")
print(f"New LiFiBridgeAggregator: {new_lifi}")
print(f"\nSave these addresses for testing.")

with open("/tmp/new_addresses.json", "w") as f:
    json.dump({"UBIFeeSplitter": new_ubi, "LiFiBridgeAggregator": new_lifi}, f, indent=2)
print("Saved to /tmp/new_addresses.json")
