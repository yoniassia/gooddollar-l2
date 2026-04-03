#!/usr/bin/env python3
"""
Tester Gamma — Set oracle price and complete GoodStocks workflow.
Continues from where tg_goodstocks_test.py left off.
"""
import json, time, urllib.request, urllib.error

RPC     = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ADMIN   = "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266"
ORACLE  = "0x0165878A594ca255338adfa4d48449f69242Eb8f"  # CV.oracle()

C = {
    "GoodDollarToken": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "UBIFeeSplitter":  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "CollateralVault": "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "SAF":             "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    "MockUSDC":        "0x0b306bf915c4d645ff596e518faf3f9669b97016",
}

AAPL_ADDR = "0x6f1216d1bfe15c98520ca1434fc1d9d57ac95321"  # deployed in previous step

SEL = {
    "setManualPrice(string,uint256,bool)": "953dc87e",
    "getPriceByKey(bytes32)":              "832321bf",
    "getPosition(address,string)":         "b1ad0fa0",
    "getCollateralRatio(address,string)":  "6dc827d9",
    "depositCollateral(string,uint256)":   "c63e3835",
    "mint(string,uint256)":                "056b01ce",
    "burn(string,uint256)":                "b48272cc",
    "withdrawCollateral(string,uint256)":  "1ce96712",
    "liquidate(address,string)":           "1f33a888",
    "balanceOf(address)":                  "70a08231",
    "approve(address,uint256)":            "095ea7b3",
    "transfer(address,uint256)":           "a9059cbb",
    "mint(address,uint256)":               "40c10f19",
    "totalCollateral(bytes32)":            "ffe3142e",
}

RID = [0]
def rpc(method, params):
    RID[0] += 1
    body = json.dumps({"jsonrpc":"2.0","id":RID[0],"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
        if "error" in resp:
            return None, resp["error"]
        return resp.get("result"), None
    except Exception as e:
        return None, str(e)

def pad32h(v):
    return v.zfill(64)

def h(v):
    return pad32h(hex(v)[2:])

def eth_call(to, data_hex):
    r, e = rpc("eth_call", [{"to": to, "data": data_hex}, "latest"])
    return r, e

def send_tx(frm, to, data_hex, gas=500_000):
    tx = {"from": frm, "to": to, "data": data_hex, "gas": hex(gas)}
    r, e = rpc("eth_sendTransaction", [tx])
    return r, e

def wait_receipt(tx_hash, retries=40):
    for _ in range(retries):
        r, e = rpc("eth_getTransactionReceipt", [tx_hash])
        if r:
            return r
        time.sleep(0.3)
    return None

def erc20_bal(token, addr):
    data = "0x" + SEL["balanceOf(address)"] + pad32h(addr[2:].lower())
    res, _ = eth_call(token, data)
    return int(res, 16) if res and res != "0x" and len(res) > 2 else 0

def encode_string(s):
    enc = s.encode("utf-8")
    return (32).to_bytes(32,"big").hex() + len(enc).to_bytes(32,"big").hex() + enc.hex().ljust(64*((len(enc)+31)//32),"0")

def encode_str_uint_bool(s, uint_val, bool_val):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        (3*32).to_bytes(32,"big").hex() +
        h(uint_val) +
        h(1 if bool_val else 0) +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
    )

def encode_str_uint(s, amount):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        (2*32).to_bytes(32,"big").hex() +
        h(amount) +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
    )

def encode_addr_str(addr, s):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        pad32h(addr[2:].lower()) +
        (2*32).to_bytes(32,"big").hex() +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
    )

results = []
tx_hashes = []
gas_costs = {}
failures = []

def record(name, ok, detail="", tx_hash=None, gas=None):
    results.append((name, ok, detail))
    if tx_hash:
        tx_hashes.append((name, tx_hash))
    if gas is not None:
        gas_costs[name] = gas
    icon = "PASS" if ok else "FAIL"
    g = f" [gas:{gas:,}]" if gas else ""
    print(f"  [{icon}] {name}: {detail}{g}")
    if not ok:
        failures.append((name, detail))

print("=" * 65)
print("TESTER GAMMA — GoodStocks: Oracle + Mint/Burn/Liquidate Test")
print("=" * 65)

# ─────────────────────────────────────────────────────────────
print("\n[1] Set AAPL manual price in PriceOracle")
# AAPL price: $189.50 = 18950000000 (8 decimals)
AAPL_PRICE_8 = 18950000000  # $189.50

# setManualPrice(string ticker, uint256 price, bool active)
args = encode_str_uint_bool("AAPL", AAPL_PRICE_8, True)
data = "0x" + SEL["setManualPrice(string,uint256,bool)"] + args

# Also set TSLA and MSFT for stress test
tx_hash, err = send_tx(ADMIN, ORACLE, data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    record("Oracle.setManualPrice(AAPL, $189.50)", success, f"price={AAPL_PRICE_8}", tx_hash, gas)
else:
    record("Oracle.setManualPrice(AAPL)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[2] Verify oracle price for AAPL")
# keccak256("AAPL") via sha3 — we know the key from previous error
aapl_key = "3a54a9a690616fbc26cfc409bf11f89d51f1d57a4ab2791fb86026cee74ed2f3"
res, err = eth_call(ORACLE, "0x" + SEL["getPriceByKey(bytes32)"] + aapl_key)
if res and res != "0x" and len(res) > 2:
    price = int(res, 16)
    record("Oracle.getPriceByKey(AAPL)", price == AAPL_PRICE_8, f"${price/1e8:.2f}")
else:
    record("Oracle.getPriceByKey(AAPL)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[3] Check existing collateral balance")
gd_bal = erc20_bal(C["GoodDollarToken"], MY_ADDR) / 1e18
print(f"  GD balance: {gd_bal:.2f}")

# Check how much collateral is already deposited for AAPL
pos_args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
existing_collateral = 0
if res and res != "0x" and len(res) > 130:
    existing_collateral = int(res[2:66], 16)
    existing_debt = int(res[66:130], 16)
    print(f"  Existing collateral: {existing_collateral/1e18:.2f} GD")
    print(f"  Existing debt: {existing_debt/1e18:.4f} sAAPL")
    record("CV.getPosition (baseline)", True, f"coll={existing_collateral/1e18:.2f}")

# Deposit more if needed
if existing_collateral < 100_000 * 10**18:
    top_up = 100_000 * 10**18 - existing_collateral
    print(f"\n  Topping up collateral: {top_up/1e18:.2f} GD")
    # Check allowance
    allowance_data = "0xdd62ed3e" + pad32h(MY_ADDR[2:].lower()) + pad32h(C["CollateralVault"][2:].lower())
    alw, _ = eth_call(C["GoodDollarToken"], allowance_data)
    alw_val = int(alw, 16) if alw and alw != "0x" else 0
    print(f"  Current allowance: {alw_val/1e18:.2f} GD")

# ─────────────────────────────────────────────────────────────
print("\n[4] Mint 5 sAAPL")
# With 100k GD collateral and AAPL at $189.50:
# Position value = 5 sAAPL * $189.50 = $947.50
# Required collateral = $947.50 * 150% = $1421.25
# Fee = $947.50 * 0.3% = $2.84
# We have 100k GD >>> $1421 so this should work

mint_amount = 5 * 10**18  # 5 sAAPL
args = encode_str_uint("AAPL", mint_amount)
data = "0x" + SEL["mint(string,uint256)"] + args

# Simulate
sim, sim_err = eth_call(C["CollateralVault"], data)
print(f"  Sim: {sim_err or 'OK'}")

tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data, gas=300_000)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    saapl_bal = erc20_bal(AAPL_ADDR, MY_ADDR) / 1e18
    record("CV.mint('AAPL', 5 sAAPL)", success, f"sAAPL_bal={saapl_bal:.4f}", tx_hash, gas)
else:
    record("CV.mint('AAPL', 5 sAAPL)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[5] Check position after mint")
pos_args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
if res and res != "0x" and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    ratio = int(res[130:194], 16)
    print(f"  collateral: {collateral / 1e18:.4f} GD")
    print(f"  debt:       {debt / 1e18:.6f} sAAPL")
    print(f"  c-ratio:    {ratio/100:.0f}%" if ratio < 2**250 else "  c-ratio: max (no debt)")
    record("CV.getPosition (post-mint)", debt > 0, f"coll={collateral/1e18:.2f} debt={debt/1e18:.4f}")
else:
    record("CV.getPosition (post-mint)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[6] Burn 2 sAAPL")
burn_amount = 2 * 10**18
args = encode_str_uint("AAPL", burn_amount)
data = "0x" + SEL["burn(string,uint256)"] + args

# Approve sAAPL to CV for burn
approve_data = "0x" + SEL["approve(address,uint256)"] + pad32h(C["CollateralVault"][2:].lower()) + h(2**256-1)
tx_approve, _ = send_tx(MY_ADDR, AAPL_ADDR, approve_data)
if tx_approve:
    wait_receipt(tx_approve)

sim, sim_err = eth_call(C["CollateralVault"], data)
print(f"  Sim: {sim_err or 'OK'}")

tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data, gas=300_000)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    saapl_bal = erc20_bal(AAPL_ADDR, MY_ADDR) / 1e18
    gd_bal_after = erc20_bal(C["GoodDollarToken"], MY_ADDR) / 1e18
    record("CV.burn('AAPL', 2 sAAPL)", success, f"sAAPL={saapl_bal:.4f} GD={gd_bal_after:.2f}", tx_hash, gas)
else:
    record("CV.burn('AAPL', 2 sAAPL)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[7] UBI fee check after mint+burn")
ubi_bal = erc20_bal(C["GoodDollarToken"], C["UBIFeeSplitter"]) / 1e18
cv_bal = erc20_bal(C["GoodDollarToken"], C["CollateralVault"]) / 1e18
print(f"  UBIFeeSplitter GD balance: {ubi_bal:.6f}")
print(f"  CollateralVault GD balance: {cv_bal:.2f}")
record("UBI fee after mint+burn", ubi_bal > 0, f"{ubi_bal:.6f} GD")

# ─────────────────────────────────────────────────────────────
print("\n[8] STRESS TEST — 10 rapid mint+burn cycles")
stress_results = []
for i in range(10):
    small_amt = (i + 1) * 10**17  # 0.1 to 1.0 sAAPL
    args = encode_str_uint("AAPL", small_amt)
    mint_data = "0x" + SEL["mint(string,uint256)"] + args
    t0 = time.time()
    tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], mint_data, gas=300_000)
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        success = receipt and receipt.get("status") == "0x1"
        gas = int(receipt["gasUsed"], 16) if receipt else 0
        elapsed = (time.time() - t0) * 1000
        stress_results.append((success, gas, elapsed))
        print(f"  [{i+1}] mint {(i+1)*0.1:.1f} sAAPL: {'OK' if success else 'FAIL'} {elapsed:.0f}ms gas={gas:,}")
    else:
        print(f"  [{i+1}] FAIL send: {err}")

if stress_results:
    ok_count = sum(1 for ok, _, _ in stress_results if ok)
    avg_gas = sum(g for _, g, _ in stress_results) / len(stress_results)
    avg_ms = sum(ms for _, _, ms in stress_results) / len(stress_results)
    record("Stress: 10x mint", ok_count == 10, f"{ok_count}/10 ok, avg_gas={avg_gas:.0f}, avg_time={avg_ms:.0f}ms")

# ─────────────────────────────────────────────────────────────
print("\n[9] Post-stress UBI fee check")
ubi_bal_final = erc20_bal(C["GoodDollarToken"], C["UBIFeeSplitter"]) / 1e18
cv_bal_final = erc20_bal(C["GoodDollarToken"], C["CollateralVault"]) / 1e18
print(f"  UBIFeeSplitter GD: {ubi_bal_final:.6f}")
print(f"  CollateralVault GD: {cv_bal_final:.2f}")

ubi_increased = ubi_bal_final > ubi_bal
record("UBI fees collected during stress", ubi_increased, f"{ubi_bal_final:.6f} GD (was {ubi_bal:.6f})")

# ─────────────────────────────────────────────────────────────
print("\n[10] Liquidation test — set AAPL price very high to make position undercollateralized")
# Current position: 100k GD collateral, some small debt
# To trigger liquidation: raise price so debt value > collateral/liquidation_ratio
pos_args = encode_addr_str(MY_ADDR, "AAPL")
res, _ = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
if res and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    if debt > 0:
        # Set price so collateral_ratio < 120%
        # ratio = (collateral * 10000) / (debt * price / 1e18) < 12000 (in BPS units)
        # Want collateral * 10000 / (debt * price / 1e18) < 12000
        # price > collateral * 10000 * 1e8 / (debt * 12000) [price in 8 decimals]
        liquidation_price = (collateral * 10000 * 10**8) // (debt * 12000) + 1
        print(f"  Current collateral: {collateral/1e18:.2f} GD, debt: {debt/1e18:.4f} sAAPL")
        print(f"  Setting price to trigger liquidation: ${liquidation_price/1e8:.2f}")

        args_liq = encode_str_uint_bool("AAPL", liquidation_price, True)
        data_liq = "0x" + SEL["setManualPrice(string,uint256,bool)"] + args_liq
        tx_hash, err = send_tx(ADMIN, ORACLE, data_liq)
        if tx_hash:
            receipt = wait_receipt(tx_hash)
            success = receipt and receipt.get("status") == "0x1"
            record("Oracle: set liquidation price", success, f"${liquidation_price/1e8:.2f}")

        # Get some sAAPL for the liquidator (use admin)
        # Admin mints AAPL tokens to itself via SAF admin setup
        # Actually easier: just use MY_ADDR which already has sAAPL

        # Check if we have enough sAAPL to liquidate
        saapl_bal = erc20_bal(AAPL_ADDR, MY_ADDR)
        print(f"  sAAPL balance for liquidation: {saapl_bal/1e18:.4f}")
        if saapl_bal >= debt:
            # Approve all sAAPL to CV
            approve_data = "0x" + SEL["approve(address,uint256)"] + pad32h(C["CollateralVault"][2:].lower()) + h(2**256-1)
            tx_approve, _ = send_tx(MY_ADDR, AAPL_ADDR, approve_data)
            if tx_approve:
                wait_receipt(tx_approve)

            # Liquidate MY_ADDR's own position (for testing)
            liq_args = encode_addr_str(MY_ADDR, "AAPL")
            data_liq2 = "0x" + SEL["liquidate(address,string)"] + liq_args
            sim, sim_err = eth_call(C["CollateralVault"], data_liq2)
            print(f"  Liquidation sim: {sim_err or 'OK'}")

            tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data_liq2, gas=400_000)
            if tx_hash:
                receipt = wait_receipt(tx_hash)
                gas = int(receipt["gasUsed"], 16) if receipt else 0
                success = receipt and receipt.get("status") == "0x1"
                gd_after = erc20_bal(C["GoodDollarToken"], MY_ADDR) / 1e18
                record("CV.liquidate(self, 'AAPL')", success, f"GD={gd_after:.2f}", tx_hash, gas)
            else:
                record("CV.liquidate()", False, str(err))
        else:
            record("CV.liquidate()", False, f"insufficient sAAPL: {saapl_bal/1e18:.4f} < {debt/1e18:.4f}")
    else:
        print("  No debt to liquidate")
        record("Liquidation test", False, "no debt to liquidate")

# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("FINAL SUMMARY")
print("=" * 65)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Tests passed: {passed}/{total}")

print("\nTRANSACTIONS:")
for name, tx in tx_hashes:
    print(f"  {tx}")
    print(f"    ({name})")

print("\nGAS COSTS:")
for name, gas in sorted(gas_costs.items(), key=lambda x: -x[1]):
    print(f"  {gas:>10,}  {name}")

if failures:
    print(f"\nFAILURES ({len(failures)}):")
    for name, detail in failures:
        print(f"  FAIL: {name}")
        if detail:
            print(f"        {detail}")
else:
    print("\nAll tests passed!")
