#!/usr/bin/env python3
"""
Tester Alpha devnet test runner.
Tests GoodSwap and GoodLend by executing real on-chain transactions.
"""
import json, urllib.request, struct, hashlib, hmac as hmac_mod, time

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MY_KEY_HEX = "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

GOODSWAP    = "0x5FbDB2315678afecb367f032d93F642f64180aa3"  # GoodDollarToken (also used as swap?)
MOCK_USDC   = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH   = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND   = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"
GOODDOLLAR  = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

CHAIN_ID = 42069

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

def get_nonce():
    res = rpc_call("eth_getTransactionCount", [MY_ADDR, "latest"])
    return int(res.get("result", "0x0"), 16)

def get_gas_price():
    res = rpc_call("eth_gasPrice", [])
    return int(res.get("result", "0x0"), 16)

def keccak256(data: bytes) -> bytes:
    import hashlib
    return hashlib.new("sha3_256", data).digest()

# Use pysha3 / sha3 keccak if available, else fallback to eth_call for encoding
try:
    import sha3 as _sha3
    def keccak256(data: bytes) -> bytes:
        k = _sha3.keccak_256()
        k.update(data)
        return k.digest()
except ImportError:
    pass

def fn_selector(sig: str) -> bytes:
    """Get 4-byte function selector from ABI signature."""
    h = keccak256(sig.encode())
    return h[:4]

def encode_address(addr: str) -> bytes:
    return bytes.fromhex(addr[2:].lower().zfill(64))

def encode_uint256(n: int) -> bytes:
    return n.to_bytes(32, 'big')

def build_calldata(sig: str, *args_bytes: bytes) -> bytes:
    sel = fn_selector(sig)
    return sel + b"".join(args_bytes)

# ─── secp256k1 signing ─────────────────────────────────────────────────────
# Pure-python secp256k1 (minimal, for signing only)
P  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
N  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8

def inv_mod(a, m):
    return pow(a, m-2, m)

def point_add(P1, P2):
    if P1 is None: return P2
    if P2 is None: return P1
    x1,y1 = P1; x2,y2 = P2
    if x1 == x2:
        if y1 != y2: return None
        m = (3*x1*x1 * inv_mod(2*y1, P)) % P
    else:
        m = ((y2-y1) * inv_mod(x2-x1, P)) % P
    x3 = (m*m - x1 - x2) % P
    y3 = (m*(x1-x3) - y1) % P
    return (x3, y3)

def point_mul(k, pt):
    res = None
    while k:
        if k & 1: res = point_add(res, pt)
        pt = point_add(pt, pt)
        k >>= 1
    return res

def sign_tx(msg_hash: bytes, priv_hex: str):
    priv = int(priv_hex, 16)
    z = int.from_bytes(msg_hash, 'big')
    # deterministic k (RFC 6979 simplified)
    import hashlib
    k_bytes = hashlib.sha256(priv.to_bytes(32,'big') + msg_hash).digest()
    k = int.from_bytes(k_bytes, 'big') % N
    if k == 0: k = 1
    R = point_mul(k, (Gx, Gy))
    r = R[0] % N
    s = (inv_mod(k, N) * (z + r * priv)) % N
    if s > N//2: s = N - s
    # recovery id
    v = 0
    Rpt = point_mul(k, (Gx, Gy))
    if Rpt[1] % 2 != 0: v = 1
    return r, s, v

def rlp_encode(items):
    def encode_item(item):
        if isinstance(item, bytes):
            if len(item) == 1 and item[0] < 0x80:
                return item
            prefix = len(item)
            if prefix <= 55:
                return bytes([0x80 + prefix]) + item
            pl = (prefix).to_bytes((prefix.bit_length() + 7) // 8, 'big')
            return bytes([0xb7 + len(pl)]) + pl + item
        elif isinstance(item, list):
            inner = b"".join(encode_item(i) for i in item)
            length = len(inner)
            if length <= 55:
                return bytes([0xc0 + length]) + inner
            pl = length.to_bytes((length.bit_length() + 7) // 8, 'big')
            return bytes([0xf7 + len(pl)]) + pl + inner
    return encode_item(items)

def int_to_bytes(n):
    if n == 0: return b""
    return n.to_bytes((n.bit_length() + 7) // 8, 'big')

def send_tx(to: str, data: bytes, value: int = 0, gas: int = 300000):
    nonce = get_nonce()
    gas_price = get_gas_price()
    to_bytes = bytes.fromhex(to[2:])
    # EIP-155 signing
    raw_list = [
        int_to_bytes(nonce),
        int_to_bytes(gas_price),
        int_to_bytes(gas),
        to_bytes,
        int_to_bytes(value),
        data,
        int_to_bytes(CHAIN_ID),
        b"",
        b"",
    ]
    encoded = rlp_encode(raw_list)
    msg_hash = keccak256(encoded)
    r, s, v = sign_tx(msg_hash, MY_KEY_HEX)
    v_eip155 = v + 2 * CHAIN_ID + 35
    signed_list = [
        int_to_bytes(nonce),
        int_to_bytes(gas_price),
        int_to_bytes(gas),
        to_bytes,
        int_to_bytes(value),
        data,
        int_to_bytes(v_eip155),
        int_to_bytes(r),
        int_to_bytes(s),
    ]
    signed_raw = rlp_encode(signed_list)
    hex_tx = "0x" + signed_raw.hex()
    res = rpc_call("eth_sendRawTransaction", [hex_tx])
    return res

def wait_receipt(tx_hash: str, max_wait: int = 30):
    for _ in range(max_wait):
        res = rpc_call("eth_getTransactionReceipt", [tx_hash])
        if res.get("result"):
            return res["result"]
        time.sleep(1)
    return None

def log_result(test_name, success, tx_hash=None, note=""):
    status = "PASS" if success else "FAIL"
    print(f"  [{status}] {test_name}" + (f" tx={tx_hash[:10]}..." if tx_hash else "") + (f" — {note}" if note else ""))
    results.append({"test": test_name, "pass": success, "tx": tx_hash, "note": note})

# ─── Tests ─────────────────────────────────────────────────────────────────

print("=" * 60)
print("Tester Alpha — GoodSwap & GoodLend Devnet Tests")
print("=" * 60)

# ── 1. Check initial balances ──────────────────────────────────────────────
print("\n1. Initial balances")
eth_res = rpc_call("eth_getBalance", [MY_ADDR, "latest"])
eth_bal = int(eth_res.get("result", "0x0"), 16) / 1e18
usdc_bal = erc20_balance(MOCK_USDC, MY_ADDR)
weth_bal = erc20_balance(MOCK_WETH, MY_ADDR)
gd_bal   = erc20_balance(GOODDOLLAR, MY_ADDR)
print(f"  ETH:        {eth_bal:.4f}")
print(f"  MockUSDC:   {usdc_bal / 1e6:.2f}")
print(f"  MockWETH:   {weth_bal / 1e18:.4f}")
print(f"  G$:         {gd_bal / 1e18:.2f}")

log_result("Initial ETH balance > 0", eth_bal > 0, note=f"{eth_bal:.2f} ETH")

# ── 2. Mint MockUSDC ───────────────────────────────────────────────────────
print("\n2. Mint MockUSDC (100K USDC)")
mint_amount_usdc = 100_000 * 10**6  # 100K USDC (6 decimals)
calldata = build_calldata("mint(address,uint256)", encode_address(MY_ADDR), encode_uint256(mint_amount_usdc))
res = send_tx(MOCK_USDC, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Mint MockUSDC", success, tx_hash)
else:
    log_result("Mint MockUSDC", False, note=str(res.get("error", res)))

# ── 3. Mint MockWETH ───────────────────────────────────────────────────────
print("\n3. Mint MockWETH (50 WETH)")
mint_amount_weth = 50 * 10**18  # 50 WETH
calldata = build_calldata("mint(address,uint256)", encode_address(MY_ADDR), encode_uint256(mint_amount_weth))
res = send_tx(MOCK_WETH, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Mint MockWETH", success, tx_hash)
else:
    log_result("Mint MockWETH", False, note=str(res.get("error", res)))

# ── 4. Check balances after mint ───────────────────────────────────────────
print("\n4. Post-mint balances")
usdc_bal = erc20_balance(MOCK_USDC, MY_ADDR)
weth_bal = erc20_balance(MOCK_WETH, MY_ADDR)
print(f"  MockUSDC: {usdc_bal / 1e6:.2f}")
print(f"  MockWETH: {weth_bal / 1e18:.4f}")
log_result("Post-mint USDC balance", usdc_bal >= mint_amount_usdc, note=f"{usdc_bal/1e6:.2f} USDC")
log_result("Post-mint WETH balance", weth_bal >= mint_amount_weth, note=f"{weth_bal/1e18:.4f} WETH")

# ── 5. Approve GoodLendPool to spend WETH ─────────────────────────────────
print("\n5. Approve GoodLendPool to spend WETH (10 WETH)")
approve_weth = 10 * 10**18
calldata = build_calldata("approve(address,uint256)", encode_address(GOOD_LEND), encode_uint256(approve_weth))
res = send_tx(MOCK_WETH, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Approve WETH for GoodLendPool", success, tx_hash)
else:
    log_result("Approve WETH for GoodLendPool", False, note=str(res.get("error", res)))

# ── 6. Supply WETH to GoodLendPool ────────────────────────────────────────
print("\n6. Supply 10 WETH to GoodLendPool")
supply_weth = 10 * 10**18
calldata = build_calldata("supply(address,uint256)", encode_address(MOCK_WETH), encode_uint256(supply_weth))
res = send_tx(GOOD_LEND, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Supply WETH to GoodLendPool", success, tx_hash)
    if not success and receipt:
        log_result("Supply WETH reverted", False, tx_hash, note="Check pool config")
else:
    log_result("Supply WETH to GoodLendPool", False, note=str(res.get("error", res)))

# ── 7. Approve GoodLendPool to spend USDC ─────────────────────────────────
print("\n7. Approve GoodLendPool to spend USDC (50K USDC)")
approve_usdc = 50_000 * 10**6
calldata = build_calldata("approve(address,uint256)", encode_address(GOOD_LEND), encode_uint256(approve_usdc))
res = send_tx(MOCK_USDC, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Approve USDC for GoodLendPool", success, tx_hash)
else:
    log_result("Approve USDC for GoodLendPool", False, note=str(res.get("error", res)))

# ── 8. Supply USDC to GoodLendPool ────────────────────────────────────────
print("\n8. Supply 50K USDC to GoodLendPool")
supply_usdc = 50_000 * 10**6
calldata = build_calldata("supply(address,uint256)", encode_address(MOCK_USDC), encode_uint256(supply_usdc))
res = send_tx(GOOD_LEND, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Supply USDC to GoodLendPool", success, tx_hash)
else:
    log_result("Supply USDC to GoodLendPool", False, note=str(res.get("error", res)))

# ── 9. Borrow USDC against WETH collateral ────────────────────────────────
print("\n9. Borrow 5K USDC against WETH collateral")
borrow_usdc = 5_000 * 10**6
calldata = build_calldata("borrow(address,uint256)", encode_address(MOCK_USDC), encode_uint256(borrow_usdc))
res = send_tx(GOOD_LEND, calldata)
tx_hash = res.get("result")
if tx_hash:
    receipt = wait_receipt(tx_hash)
    success = receipt and receipt.get("status") == "0x1"
    log_result("Borrow USDC from GoodLendPool", success, tx_hash)
else:
    log_result("Borrow USDC from GoodLendPool", False, note=str(res.get("error", res)))

# ── 10. Check GoodSwap ─────────────────────────────────────────────────────
print("\n10. Check GoodSwap contract")
# Try calling a view function on GoodDollarToken / GoodSwap
gd_total = eth_call(GOODDOLLAR, "0x18160ddd")  # totalSupply()
if gd_total and gd_total != "0x":
    total = int(gd_total, 16) / 1e18
    log_result("GoodDollar totalSupply readable", True, note=f"{total:.0f} G$")
else:
    log_result("GoodDollar totalSupply readable", False)

# ── Summary ────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
passes = sum(1 for r in results if r["pass"])
fails  = sum(1 for r in results if not r["pass"])
print(f"RESULTS: {passes} passed, {fails} failed")
print("=" * 60)

print("\nFailed tests:")
for r in results:
    if not r["pass"]:
        print(f"  - {r['test']}: {r['note']}")

# Export results for Paperclip issue creation
with open("/tmp/test_results.json", "w") as f:
    json.dump({"passes": passes, "fails": fails, "results": results}, f, indent=2)
print("\nResults saved to /tmp/test_results.json")
