#!/usr/bin/env python3
"""
Tester Alpha devnet test runner — uses eth_sendTransaction (Anvil unlocked accounts).
Tests GoodSwap and GoodLend by executing real on-chain transactions.
"""
import json, urllib.request, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

MOCK_USDC   = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH   = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND   = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"
GOODDOLLAR  = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

results = []

def rpc_call(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def eth_call(to, data_hex):
    res = rpc_call("eth_call", [{"to": to, "data": data_hex, "from": MY_ADDR}, "latest"])
    return res.get("result", "0x")

def erc20_balance(token, addr):
    padded = addr[2:].lower().zfill(64)
    raw = eth_call(token, "0x70a08231" + padded)
    if raw and raw != "0x":
        return int(raw, 16)
    return 0

def send_tx(to, data_hex, value=0, gas=300000):
    tx = {"from": MY_ADDR, "to": to, "data": data_hex, "gas": hex(gas)}
    if value:
        tx["value"] = hex(value)
    res = rpc_call("eth_sendTransaction", [tx])
    return res

def wait_receipt(tx_hash, max_wait=30):
    for _ in range(max_wait):
        res = rpc_call("eth_getTransactionReceipt", [tx_hash])
        if res.get("result"):
            return res["result"]
        time.sleep(0.5)
    return None

def log_result(test_name, success, tx_hash=None, note=""):
    status = "PASS" if success else "FAIL"
    print(f"  [{status}] {test_name}" + (f" tx={tx_hash[:10]}..." if tx_hash else "") + (f" — {note}" if note else ""))
    results.append({"test": test_name, "pass": success, "tx": tx_hash, "note": note})

def encode_addr(addr):
    return addr[2:].lower().zfill(64)

def encode_uint(n):
    return hex(n)[2:].zfill(64)

def fn4(sig):
    """Simple keccak4 via eth_call trick — encode selector using known sigs."""
    KNOWN = {
        "mint(address,uint256)":     "40c10f19",
        "approve(address,uint256)":  "095ea7b3",
        "transfer(address,uint256)": "a9059cbb",
        "balanceOf(address)":        "70a08231",
        "totalSupply()":             "18160ddd",
        "supply(address,uint256)":   "f2b9fdb8",  # GoodLendPool.supply
        "borrow(address,uint256)":   "4b8a3529",  # GoodLendPool.borrow
        "repay(address,uint256)":    "5ceae9c4",  # GoodLendPool.repay
        "withdraw(address,uint256)": "f3fef3a3",  # GoodLendPool.withdraw
    }
    s = KNOWN.get(sig)
    if s:
        return s
    raise ValueError("Unknown selector: " + sig)

def call_fn(contract, sig, *args):
    data = "0x" + fn4(sig) + "".join(args)
    return send_tx(contract, data)

# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("Tester Alpha — GoodSwap & GoodLend Devnet Tests (Anvil)")
print("=" * 60)

# Check if accounts are unlocked
print("\n0. Checking Anvil account unlock")
accts = rpc_call("eth_accounts", [])
locked_addrs = accts.get("result", [])
print(f"  Unlocked accounts: {locked_addrs[:3]}")
is_unlocked = MY_ADDR.lower() in [a.lower() for a in locked_addrs]
log_result("Tester Alpha account unlocked in Anvil", is_unlocked, note=MY_ADDR)

# ── 1. Initial balances ──────────────────────────────────────────────────────
print("\n1. Initial balances")
eth_res = rpc_call("eth_getBalance", [MY_ADDR, "latest"])
eth_bal = int(eth_res.get("result", "0x0"), 16) / 1e18
usdc_bal = erc20_balance(MOCK_USDC, MY_ADDR)
weth_bal = erc20_balance(MOCK_WETH, MY_ADDR)
gd_bal   = erc20_balance(GOODDOLLAR, MY_ADDR)
print(f"  ETH:      {eth_bal:.4f}")
print(f"  USDC:     {usdc_bal / 1e6:.2f}")
print(f"  WETH:     {weth_bal / 1e18:.4f}")
print(f"  G$:       {gd_bal / 1e18:.0f}")
log_result("ETH balance > 0", eth_bal > 0, note=f"{eth_bal:.2f} ETH")

# ── 2. Mint 100K MockUSDC ────────────────────────────────────────────────────
print("\n2. Mint 100K MockUSDC")
mint_usdc = 100_000 * 10**6
data = "0x" + fn4("mint(address,uint256)") + encode_addr(MY_ADDR) + encode_uint(mint_usdc)
res = send_tx(MOCK_USDC, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Mint 100K MockUSDC", bool(success), tx_hash)
else:
    err = res.get("error", res)
    log_result("Mint 100K MockUSDC", False, note=str(err))

# ── 3. Mint 50 MockWETH ──────────────────────────────────────────────────────
print("\n3. Mint 50 MockWETH")
mint_weth = 50 * 10**18
data = "0x" + fn4("mint(address,uint256)") + encode_addr(MY_ADDR) + encode_uint(mint_weth)
res = send_tx(MOCK_WETH, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Mint 50 MockWETH", bool(success), tx_hash)
else:
    err = res.get("error", res)
    log_result("Mint 50 MockWETH", False, note=str(err))

# ── 4. Post-mint balances ─────────────────────────────────────────────────────
usdc_bal = erc20_balance(MOCK_USDC, MY_ADDR)
weth_bal = erc20_balance(MOCK_WETH, MY_ADDR)
print(f"\n4. Post-mint: USDC={usdc_bal/1e6:.2f}, WETH={weth_bal/1e18:.4f}")
log_result("Post-mint USDC balance correct", usdc_bal >= mint_usdc, note=f"{usdc_bal/1e6:.2f}")
log_result("Post-mint WETH balance correct", weth_bal >= mint_weth, note=f"{weth_bal/1e18:.4f}")

# ── 5. Approve GoodLendPool for WETH ─────────────────────────────────────────
print("\n5. Approve GoodLendPool for 10 WETH")
approve_weth = 10 * 10**18
data = "0x" + fn4("approve(address,uint256)") + encode_addr(GOOD_LEND) + encode_uint(approve_weth)
res = send_tx(MOCK_WETH, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Approve WETH for GoodLendPool", bool(success), tx_hash)
else:
    log_result("Approve WETH for GoodLendPool", False, note=str(res.get("error", res)))

# ── 6. Supply 10 WETH as collateral ───────────────────────────────────────────
print("\n6. Supply 10 WETH to GoodLendPool (as collateral)")
supply_weth = 10 * 10**18
data = "0x" + fn4("supply(address,uint256)") + encode_addr(MOCK_WETH) + encode_uint(supply_weth)
res = send_tx(GOOD_LEND, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Supply 10 WETH to GoodLendPool", bool(success), tx_hash)
    if not success:
        print(f"    Revert — pool may need different selector or asset not supported")
else:
    log_result("Supply 10 WETH to GoodLendPool", False, note=str(res.get("error", res)))

# ── 7. Approve GoodLendPool for USDC ─────────────────────────────────────────
print("\n7. Approve GoodLendPool for 50K USDC")
approve_usdc = 50_000 * 10**6
data = "0x" + fn4("approve(address,uint256)") + encode_addr(GOOD_LEND) + encode_uint(approve_usdc)
res = send_tx(MOCK_USDC, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Approve USDC for GoodLendPool", bool(success), tx_hash)
else:
    log_result("Approve USDC for GoodLendPool", False, note=str(res.get("error", res)))

# ── 8. Supply 50K USDC ────────────────────────────────────────────────────────
print("\n8. Supply 50K USDC to GoodLendPool")
supply_usdc = 50_000 * 10**6
data = "0x" + fn4("supply(address,uint256)") + encode_addr(MOCK_USDC) + encode_uint(supply_usdc)
res = send_tx(GOOD_LEND, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Supply 50K USDC to GoodLendPool", bool(success), tx_hash)
else:
    log_result("Supply 50K USDC to GoodLendPool", False, note=str(res.get("error", res)))

# ── 9. Borrow 5K USDC against WETH collateral ─────────────────────────────────
print("\n9. Borrow 5K USDC from GoodLendPool")
borrow_usdc = 5_000 * 10**6
data = "0x" + fn4("borrow(address,uint256)") + encode_addr(MOCK_USDC) + encode_uint(borrow_usdc)
res = send_tx(GOOD_LEND, data)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Borrow 5K USDC from GoodLendPool", bool(success), tx_hash)
else:
    log_result("Borrow 5K USDC from GoodLendPool", False, note=str(res.get("error", res)))

# ── 10. GoodDollar G$ transfer test ────────────────────────────────────────────
print("\n10. Transfer 1000 G$ (GoodDollar contract read)")
gd_total = eth_call(GOODDOLLAR, "0x18160ddd")
if gd_total and gd_total != "0x":
    total = int(gd_total, 16) / 1e18
    log_result("GoodDollar totalSupply readable", True, note=f"{total:.0f} G$")
else:
    log_result("GoodDollar totalSupply readable", False)

# ── Summary ────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
passes = sum(1 for r in results if r["pass"])
fails  = sum(1 for r in results if not r["pass"])
print(f"RESULTS: {passes} passed, {fails} failed")
print("=" * 60)

if fails:
    print("\nFailed tests:")
    for r in results:
        if not r["pass"]:
            print(f"  FAIL: {r['test']} — {r['note']}")

with open("/tmp/test_results.json", "w") as f:
    json.dump({"passes": passes, "fails": fails, "results": results}, f, indent=2)
print("\nSaved to /tmp/test_results.json")
