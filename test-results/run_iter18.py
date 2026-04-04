#!/usr/bin/env python3
"""Tester Alpha iteration 18 — verify fixed contracts: PSM/CDP/Governance."""
import json, time, subprocess, sys, os
from datetime import datetime, timezone

RPC   = "http://localhost:8545"
CAST  = os.path.expanduser("~/.foundry/bin/cast")
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MY_KEY  = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Latest deployed addresses (DeployGoodStable + DeployGovernance)
VM_NEW  = "0xcfbd78f3d57b620ddeff73f193dd5bf595a730db"
PSM_NEW = "0xa2a0d69221829d6005e31bb187a0a5debead8331"
GUSD    = "0x6b99600dad0a1998337357696827381d122825f3"
CR_NEW  = "0xca9507c5f707103e86b45df4b35c37fe2700bb5b"
SP_NEW  = "0x56cb5406c23d0fb16eac535d6108ca72980c8072"
ORACLE  = "0xb719422a0a484025c1a22a8deeafc67e81f43cfd"  # MockPriceOracle (bytes32 ilk based)
USDC6   = "0xd604c06206f6dedd82d42f90d1f5bb34a2e7c5dd"
WETH18  = "0x7314aeec874a25a1131f49da9679d05f8d931175"
MOCKGD  = "0x132f7d9033b28b08cbc520e1cfd83c6da3abfa36"
VEGDT   = "0x0b7108b29ad73097cf7e549d542915348d885e5f"
GDAO    = "0x53aafbd184086d72fa233ae83e1a7b1339b5415c"

# GoodDollarToken — correct address from governance deploy
GDT_NEW = "0x6533158b042775e2FdFeF3cA1a782EFDbB8EB9b1"

NEW_SPLITTER  = "0xC0BF43A4Ca27e0976195E6661b099742f10507e5"
MOCK_SPLITTER = "0xBA6BfBa894B5cAF04c3462A5C8556fFBa4de6782"  # MockUBIFeeSplitter for stable suite

ITERATION = 18
LOG_FILE = os.path.join(os.path.dirname(__file__), "tester-alpha-iter18.jsonl")

results = []

def ts():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def log(id_, contract, func, success, gas=0, tx="", detail="", error=""):
    entry = {"timestamp": ts(), "iteration": ITERATION, "id": id_,
             "contract": contract, "function": func, "success": success,
             "gas_used": gas, "tx_hash": tx, "detail": detail, "error": error}
    results.append(entry)
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {id_}: {contract}.{func} — {detail or error}")
    return entry

def parse_val(s):
    """Strip cast annotation like '0x... [1e18]' or '100 [1e2]'."""
    if s is None:
        return None
    return s.split()[0].strip()

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None, r.stderr.strip()
    return parse_val(r.stdout.strip()), None

def send(contract, sig, *args, value=None):
    cmd = [CAST, "send", "--rpc-url", RPC, "--private-key", MY_KEY, contract, sig] + list(args)
    if value:
        cmd += ["--value", value]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None, (r.stderr + r.stdout).strip()
    tx_hash = ""
    for line in r.stdout.split("\n"):
        for p in line.split():
            if p.startswith("0x") and len(p) == 66:
                tx_hash = p
                break
        if tx_hash:
            break
    gas = 0
    for line in r.stdout.split("\n"):
        if "gasUsed" in line:
            try:
                gas = int(line.split()[-1], 16)
            except Exception:
                pass
    return {"tx": tx_hash, "gas": gas}, None

# =========================================================
print("\n=== VERIFY NEW CONTRACT ADDRESSES ===")

out, err = call(VM_NEW, "oracle()(address)")
oracle_ok = out and out.lower() == ORACLE.lower()
log("vm_01", "VaultManager", "oracle()", oracle_ok, detail=f"oracle={out} {'OK=GOO-314 FIXED' if oracle_ok else 'WRONG'}", error=err or "")

out, err = call(VM_NEW, "feeSplitter()(address)")
# new VM uses MockUBIFeeSplitter in stable suite (expected)
log("vm_02", "VaultManager", "feeSplitter()", out is not None, detail=f"feeSplitter={out} (MockUBIFeeSplitter for stable suite)", error=err or "")

out, err = call(VM_NEW, "gusd()(address)")
log("vm_03", "VaultManager", "gusd()", out and out.lower() == GUSD.lower(), detail=f"gusd={out}", error=err or "")

out, err = call(VM_NEW, "paused()(bool)")
log("vm_04", "VaultManager", "paused()", out == "false", detail=f"paused={out}", error=err or "")

# VoteEscrowedGD — GOO-313 fix check
out, err = call(VEGDT, "gd()(address)")
vegdt_ok = out and out.lower() == GDT_NEW.lower()
log("gov_01", "VoteEscrowedGD", "gd()", vegdt_ok,
    detail=f"gd={out} {'GOO-313 FIXED' if vegdt_ok else 'WRONG GDT'}",
    error=err or ("wrong GDT addr" if not vegdt_ok else ""))

out, err = call(VEGDT, "totalLocked()(uint256)")
log("gov_02", "VoteEscrowedGD", "totalLocked()", out is not None, detail=f"totalLocked={out}", error=err or "")

# GoodDAO
out, err = call(GDAO, "QUORUM_BPS()(uint256)")
log("gov_03", "GoodDAO", "QUORUM_BPS()", out is not None, detail=f"quorum={out}", error=err or "")

# PSM state
out, err = call(PSM_NEW, "totalUSDCReserves()(uint256)")
log("psm_01", "PSM", "totalUSDCReserves()", out is not None, detail=f"reserves={out}", error=err or "")

out, err = call(PSM_NEW, "swapCap()(uint256)")
log("psm_02", "PSM", "swapCap()", out is not None, detail=f"swapCap={out}", error=err or "")

# gUSD state
out, err = call(GUSD, "totalSupply()(uint256)")
log("gusd_01", "gUSD", "totalSupply()", out is not None, detail=f"supply={out}", error=err or "")

out, err = call(GUSD, "isMinter(address)(bool)", PSM_NEW)
log("gusd_02", "gUSD", "isMinter(PSM)", out == "true", detail=f"PSM isMinter={out}", error=err or "")

out, err = call(GUSD, "isMinter(address)(bool)", VM_NEW)
log("gusd_03", "gUSD", "isMinter(VaultManager)", out == "true",
    detail=f"VM isMinter={out}", error=err or ("VM is not gUSD minter — mintGUSD will fail" if out != "true" else ""))

# CollateralRegistry
out_ilk, err = call(CR_NEW, "ilkList(uint256)(bytes32)", "0")
log("cr_01", "CollateralRegistry", "ilkList(0)", out_ilk is not None, detail=f"ilk0={out_ilk}", error=err or "")
ILK0 = out_ilk if out_ilk else "0x5553444300000000000000000000000000000000000000000000000000000000"

out, err = call(CR_NEW, "getConfig(bytes32)(address,uint256,uint256,uint256,uint256)", ILK0)
coll_token = None
if out:
    parts = out.split("\n") if "\n" in out else out.split()
    coll_token = parts[0].strip()
    log("cr_02", "CollateralRegistry", "getConfig(ilk0)", True, detail=f"token={coll_token}", error="")
else:
    log("cr_02", "CollateralRegistry", "getConfig(ilk0)", False, error=err)

# MockPriceOracle uses bytes32 ilk
out, err = call(ORACLE, "getPrice(bytes32)(uint256)", ILK0)
log("oracle_01", "MockPriceOracle", "getPrice(ilk0)", out is not None and out != "0",
    detail=f"price={out}", error=err or "")

# =========================================================
print("\n=== MINT TEST TOKENS ===")
out, err = send(USDC6, "mint(address,uint256)", MY_ADDR, "2000000000")  # 2000 USDC6
if out:
    log("tok_01", "MockUSDC6", "mint(tester,2000USDC)", True, gas=out["gas"], tx=out["tx"])
else:
    log("tok_01", "MockUSDC6", "mint(tester,2000USDC)", False, error=err)

bal, err = call(USDC6, "balanceOf(address)(uint256)", MY_ADDR)
log("tok_02", "MockUSDC6", "balanceOf(tester)", bal is not None, detail=f"balance={bal}", error=err or "")

# Mint collateral token if different from USDC6
if coll_token and coll_token.lower() != USDC6.lower():
    out, err = send(coll_token, "mint(address,uint256)", MY_ADDR, "2000000000000000000000")
    if out:
        log("tok_03", "coll_token", "mint(tester,2000)", True, gas=out["gas"], tx=out["tx"], detail=f"minted 2000 of {coll_token}")
    else:
        log("tok_03", "coll_token", "mint(tester,2000)", False, error=err)

# =========================================================
print("\n=== PSM SWAP TESTS (GOO-298 fix) ===")
SWAP_USDC = "200000000"  # 200 USDC6

out, err = send(USDC6, "approve(address,uint256)", PSM_NEW, SWAP_USDC)
if out:
    log("psm_10", "MockUSDC6", "approve(PSM,200USDC)", True, gas=out["gas"], tx=out["tx"])
else:
    log("psm_10", "MockUSDC6", "approve(PSM,200USDC)", False, error=err)

out, err = send(PSM_NEW, "swapUSDCForGUSD(uint256)", SWAP_USDC)
if out:
    log("psm_11", "PSM", "swapUSDCForGUSD(200USDC)", True, gas=out["gas"], tx=out["tx"], detail="GOO-298 CONFIRMED FIXED: swapUSDCForGUSD succeeded")
else:
    log("psm_11", "PSM", "swapUSDCForGUSD(200USDC)", False, error=err, detail="GOO-298 may still be broken")

gusd_bal, err = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
log("psm_12", "gUSD", "balanceOf(tester after swap)", gusd_bal is not None and gusd_bal != "0",
    detail=f"gUSD={gusd_bal}", error=err or "")

# swapGUSDForUSDC
if gusd_bal and gusd_bal != "0":
    try:
        half = str(int(gusd_bal) // 2)
    except Exception:
        half = "50000000000000000000"
    out, err = send(GUSD, "approve(address,uint256)", PSM_NEW, half)
    if out:
        log("psm_13", "gUSD", "approve(PSM,halfGUSD)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("psm_13", "gUSD", "approve(PSM,halfGUSD)", False, error=err)
    out, err = send(PSM_NEW, "swapGUSDForUSDC(uint256)", half)
    if out:
        log("psm_14", "PSM", "swapGUSDForUSDC(halfGUSD)", True, gas=out["gas"], tx=out["tx"], detail="PSM round-trip complete")
    else:
        log("psm_14", "PSM", "swapGUSDForUSDC(halfGUSD)", False, error=err)
else:
    log("psm_13", "PSM", "swapGUSDForUSDC", False, error="No gUSD balance from swap")

# =========================================================
print("\n=== CDP CYCLE (new VaultManager, GOO-314 fix) ===")

coll = coll_token if coll_token else USDC6
# Determine collateral amount based on decimals
out_dec, _ = call(coll, "decimals()(uint8)")
dec = int(out_dec) if out_dec else 6
COLL_AMOUNT = str(1000 * (10**dec))  # 1000 units in native decimals

# Mint + approve collateral
out, err = send(coll, "mint(address,uint256)", MY_ADDR, COLL_AMOUNT)
if out:
    log("cdp_01", "collateral", f"mint(tester,1000,dec={dec})", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_01", "collateral", f"mint(tester,1000,dec={dec})", False, error=err)

out, err = send(coll, "approve(address,uint256)", VM_NEW, COLL_AMOUNT)
if out:
    log("cdp_02", "collateral", "approve(VaultManager,1000)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_02", "collateral", "approve(VaultManager,1000)", False, error=err)

# openVault
out, err = send(VM_NEW, "openVault(bytes32)", ILK0)
if out:
    log("cdp_03", "VaultManager", f"openVault(ilk0={ILK0[:10]}...)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_03", "VaultManager", f"openVault(ilk0={ILK0[:10]}...)", False, error=err)

# healthFactor before deposit
out, err = call(VM_NEW, "healthFactor(bytes32,address)(uint256)", ILK0, MY_ADDR)
log("cdp_04", "VaultManager", "healthFactor(ilk0,tester)", True, detail=f"hf before deposit={out}", error=err or "")

# depositCollateral
out, err = send(VM_NEW, "depositCollateral(bytes32,uint256)", ILK0, COLL_AMOUNT)
if out:
    log("cdp_05", "VaultManager", "depositCollateral(ilk0,1000coll)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_05", "VaultManager", "depositCollateral(ilk0,1000coll)", False, error=err)

# healthFactor after deposit
out, err = call(VM_NEW, "healthFactor(bytes32,address)(uint256)", ILK0, MY_ADDR)
log("cdp_06", "VaultManager", "healthFactor(ilk0,tester) after deposit", True, detail=f"hf={out}", error=err or "")

# mintGUSD — KEY TEST (GOO-314 fix: VaultManager now has correct oracle)
MINT_AMOUNT = "10000000000000000000"  # 10 gUSD
out, err = send(VM_NEW, "mintGUSD(bytes32,uint256)", ILK0, MINT_AMOUNT)
if out:
    log("cdp_07", "VaultManager", "mintGUSD(ilk0,10gUSD)", True, gas=out["gas"], tx=out["tx"], detail="GOO-314 FIXED: mintGUSD succeeded!")
else:
    log("cdp_07", "VaultManager", "mintGUSD(ilk0,10gUSD)", False, error=err, detail="mintGUSD failed — check oracle/minter")

# Check gUSD after mint
gbal, err = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
log("cdp_08", "gUSD", "balanceOf(tester after mintGUSD)", gbal is not None, detail=f"gUSD={gbal}", error=err or "")

# vaultDebt
out, err = call(VM_NEW, "vaultDebt(bytes32,address)(uint256)", ILK0, MY_ADDR)
log("cdp_09", "VaultManager", "vaultDebt(ilk0,tester)", out is not None, detail=f"debt={out}", error=err or "")

# repayGUSD
if gbal and gbal != "0":
    try:
        repay_amt = str(min(int(gbal), int(MINT_AMOUNT)))
    except Exception:
        repay_amt = MINT_AMOUNT
    out, err = send(GUSD, "approve(address,uint256)", VM_NEW, repay_amt)
    if out:
        log("cdp_10", "gUSD", "approve(VaultManager,repay)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("cdp_10", "gUSD", "approve(VaultManager,repay)", False, error=err)
    out, err = send(VM_NEW, "repayGUSD(bytes32,uint256)", ILK0, repay_amt)
    if out:
        log("cdp_11", "VaultManager", "repayGUSD(ilk0,debt)", True, gas=out["gas"], tx=out["tx"], detail="repayGUSD succeeded")
    else:
        log("cdp_11", "VaultManager", "repayGUSD(ilk0,debt)", False, error=err)

# withdrawCollateral after repay
WITHDRAW = str(int(COLL_AMOUNT) // 2)
out, err = send(VM_NEW, "withdrawCollateral(bytes32,uint256)", ILK0, WITHDRAW, "--gas-limit", "500000")
if out:
    log("cdp_12", "VaultManager", "withdrawCollateral(ilk0,half)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_12", "VaultManager", "withdrawCollateral(ilk0,half)", False, error=err)

# =========================================================
print("\n=== STABILITY POOL ===")

out, err = call(SP_NEW, "admin()(address)")
log("sp_01", "StabilityPool", "admin()", out is not None, detail=f"admin={out}", error=err or "")

out, err = call(SP_NEW, "poolSize()(uint256)")
log("sp_02", "StabilityPool", "poolSize()", out is not None, detail=f"poolSize={out}", error=err or "")

# Try deposit gUSD
gbal2, _ = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
if gbal2 and gbal2 != "0":
    try:
        dep = str(min(int(gbal2), 5_000000000000000000))  # 5 gUSD
    except Exception:
        dep = "5000000000000000000"
    out, err = send(GUSD, "approve(address,uint256)", SP_NEW, dep)
    if out:
        log("sp_03", "gUSD", "approve(StabilityPool,5gUSD)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("sp_03", "gUSD", "approve(StabilityPool,5gUSD)", False, error=err)
    out, err = send(SP_NEW, "deposit(uint256)", dep)
    if out:
        log("sp_04", "StabilityPool", "deposit(5gUSD)", True, gas=out["gas"], tx=out["tx"], detail="StabilityPool deposit success!")
    else:
        log("sp_04", "StabilityPool", "deposit(5gUSD)", False, error=err)
    out, err = send(SP_NEW, "withdraw(uint256)", dep)
    if out:
        log("sp_05", "StabilityPool", "withdraw(5gUSD)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("sp_05", "StabilityPool", "withdraw(5gUSD)", False, error=err)
else:
    log("sp_03", "StabilityPool", "deposit(gUSD)", False, error="No gUSD balance for StabilityPool test")

# =========================================================
print("\n=== VoteEscrowedGD LOCK TEST (GOO-313 fix) ===")

gdt_bal, err = call(GDT_NEW, "balanceOf(address)(uint256)", MY_ADDR)
log("gov_10", "GoodDollarToken", "balanceOf(tester)", gdt_bal is not None, detail=f"GDT={gdt_bal}", error=err or "")

if gdt_bal and gdt_bal != "0":
    try:
        lock_amt = str(min(int(gdt_bal), 100_000000000000000000))  # up to 100 GDT
    except Exception:
        lock_amt = "100000000000000000000"
    out, err = send(GDT_NEW, "approve(address,uint256)", VEGDT, lock_amt)
    if out:
        log("gov_11", "GDT", "approve(veGDT)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("gov_11", "GDT", "approve(veGDT)", False, error=err)
    # lock(amount, durationInSeconds) — 52 weeks = 52 * 7 * 24 * 3600 = 31449600s
    LOCK_DURATION = str(52 * 7 * 24 * 3600)
    out, err = send(VEGDT, "lock(uint256,uint256)", lock_amt, LOCK_DURATION)
    if out:
        log("gov_12", "VoteEscrowedGD", "lock(GDT,52wks)", True, gas=out["gas"], tx=out["tx"], detail="GOO-313 FIXED: lock with new GDT!")
    else:
        log("gov_12", "VoteEscrowedGD", "lock(GDT,52wks)", False, error=err)
    out, err = call(VEGDT, "getVotes(address)(uint256)", MY_ADDR)
    log("gov_13", "VoteEscrowedGD", "getVotes(tester)", out is not None and out != "0",
        detail=f"votes={out}", error=err or "")
    out, err = call(VEGDT, "totalLocked()(uint256)")
    log("gov_14", "VoteEscrowedGD", "totalLocked()", out is not None, detail=f"totalLocked={out}", error=err or "")
else:
    # Try minting GDT for tester (if we have minter access)
    out, err = send(GDT_NEW, "mint(address,uint256)", MY_ADDR, "10000000000000000000000")
    if out:
        log("gov_10b", "GDT", "mint(tester,10000GDT)", True, gas=out["gas"], tx=out["tx"])
        gdt_bal, _ = call(GDT_NEW, "balanceOf(address)(uint256)", MY_ADDR)
        if gdt_bal and gdt_bal != "0":
            lock_amt = str(min(int(gdt_bal), 100_000000000000000000))
            send(GDT_NEW, "approve(address,uint256)", VEGDT, lock_amt)
            LOCK_DURATION = str(52 * 7 * 24 * 3600)
            out2, err2 = send(VEGDT, "lock(uint256,uint256)", lock_amt, LOCK_DURATION)
            if out2:
                log("gov_12", "VoteEscrowedGD", "lock(GDT,52wks) after mint", True, gas=out2["gas"], tx=out2["tx"], detail="lock succeeded after mint")
            else:
                log("gov_12", "VoteEscrowedGD", "lock(GDT,52wks) after mint", False, error=err2)
    else:
        log("gov_11", "VoteEscrowedGD", "lock test", False, error=f"No GDT balance and mint failed: {err}")

# =========================================================
total = len(results)
passed = sum(1 for r in results if r["success"])
failed = total - passed

print(f"\n=== RESULTS: {passed}/{total} passed ({100*passed//total if total else 0}%) ===")

with open(LOG_FILE, "w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")
print(f"Wrote {total} entries to {LOG_FILE}")

# Exit code non-zero if any failures
sys.exit(0 if failed == 0 else 1)
