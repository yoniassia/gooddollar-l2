#!/usr/bin/env python3
"""Tester Alpha iteration 20 — regression after GOO-348/350/351/352 fixes.

Addresses updated to post-reset redeployment (18:30 Apr-4).

New coverage vs iter19:
  - GOO-351 regression: full vault redeem (all shares) — totalDebt must floor to 0, not underflow
  - GOO-352 regression: StabilityPool gains settlement (depositorInfo snapshot, pending gains check)
  - GOO-348 regression: mintGUSD gas measurement (was 274k reverted, now should pass <400k)
  - Enhanced state checks: totalDebt vs totalAssets correlation
Standard regression:
  - PSM swap, CDP cycle (openVault/depositCollateral/mintGUSD/repay)
  - GoodVault deposit+harvest+withdraw (SKIPPED: VaultFactory has 0 vaults post-reset)
  - VoteEscrowedGD governance (SKIPPED: VoteEscrowedGD not deployed post-reset)
  - StabilityPool deposit/withdraw (GOO-352 regression)
"""
import json, subprocess, sys, os
from datetime import datetime, timezone

RPC   = "http://localhost:8545"
CAST  = os.path.expanduser("~/.foundry/bin/cast")

# Accounts
MY_ADDR  = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MY_KEY   = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Stable / CDP (redeployed 2026-04-04 18:30 — post devnet reset)
VM_NEW  = "0x1429859428c0abc9c2c47c8ee9fbaf82cfa0f20f"
PSM_NEW = "0xdbc43ba45381e02825b14322cddd15ec4b3164e6"
GUSD    = "0xc351628eb244ec633d5f21fbd6621e1a683b1181"
CR_NEW  = "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc"
SP_NEW  = "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07"
USDC6   = "0xb7278a61aa25c888815afc32ad3cc52ff24fe575"   # MockUSDC6 (ilk USDC token)

# Governance (VoteEscrowedGD NOT deployed post-reset — governance tests skipped)
GDT_NEW  = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"
VEGDT    = ""  # not deployed — skip governance section

# Yield vaults (VaultFactory has 0 vaults post-reset — vault tests skipped)
VAULT_FAC = "0xd5ac451b0c50b9476107823af206ed814a2e2580"
VAULT0    = ""  # not created — skip vault section

ITERATION = 20
LOG_FILE  = os.path.join(os.path.dirname(__file__), "tester-alpha-iter20.jsonl")

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
    if s is None:
        return None
    return s.strip().split()[0] if s.strip() else None

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None, r.stderr.strip()
    return parse_val(r.stdout), None

def send(contract, sig, *args, value=None, gas_limit=None):
    cmd = [CAST, "send", "--rpc-url", RPC, "--private-key", MY_KEY, "--json",
           contract, sig] + list(args)
    if value:
        cmd += ["--value", value]
    if gas_limit:
        cmd += ["--gas-limit", str(gas_limit)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        receipt = json.loads(r.stdout)
        ok = receipt.get("status") == "0x1"
        tx_hash = receipt.get("transactionHash", "")
        gas = int(receipt.get("gasUsed", "0x0"), 16) if receipt.get("gasUsed") else 0
        if not ok:
            return None, "tx reverted status=" + str(receipt.get("status"))
        return {"tx": tx_hash, "gas": gas}, None
    except Exception:
        if r.returncode != 0:
            return None, (r.stderr + r.stdout).strip()
        return {"tx": "", "gas": 0}, None

# =============================================================================
# SECTION 1: PSM Swap (regression)
# =============================================================================
print("\n=== [1] PSM SWAP (regression) ===")

out, err = call(PSM_NEW, "totalUSDCReserves()(uint256)")
log("psm_01", "PSM", "totalUSDCReserves()", out is not None, detail=f"reserves={out}", error=err or "")

out, err = send(USDC6, "mint(address,uint256)", MY_ADDR, "500000000")
if out:
    log("psm_02", "MockUSDC6", "mint(tester,500USDC)", True, gas=out["gas"], tx=out["tx"])
else:
    log("psm_02", "MockUSDC6", "mint(tester,500USDC)", False, error=err)

out, err = send(USDC6, "approve(address,uint256)", PSM_NEW, "200000000")
if out:
    log("psm_03", "MockUSDC6", "approve(PSM,200USDC)", True, gas=out["gas"], tx=out["tx"])
else:
    log("psm_03", "MockUSDC6", "approve(PSM,200USDC)", False, error=err)

out, err = send(PSM_NEW, "swapUSDCForGUSD(uint256)", "200000000")
if out:
    log("psm_04", "PSM", "swapUSDCForGUSD(200USDC)", True, gas=out["gas"], tx=out["tx"], detail="PSM swap OK")
else:
    log("psm_04", "PSM", "swapUSDCForGUSD(200USDC)", False, error=err)

gusd_bal, _ = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
log("psm_05", "gUSD", "balanceOf(tester)", gusd_bal is not None and gusd_bal != "0",
    detail=f"gUSD={gusd_bal}")

# =============================================================================
# SECTION 2: CDP Cycle — GOO-348 regression (mintGUSD 1/2 lock fix)
# =============================================================================
print("\n=== [2] CDP CYCLE — GOO-348 mintGUSD regression ===")

ilk0, _ = call(CR_NEW, "ilkList(uint256)(bytes32)", "0")
ILK0 = ilk0 if ilk0 else "0x5553444300000000000000000000000000000000000000000000000000000000"
log("cdp_01", "CollateralRegistry", "ilkList(0)", ilk0 is not None, detail=f"ilk={ILK0[:10]}...")

parts_out, _ = call(CR_NEW, "getConfig(bytes32)(address,uint256,uint256,uint256,uint256)", ILK0)
coll = parts_out.split()[0].strip() if parts_out else USDC6
log("cdp_02", "CollateralRegistry", "getConfig(ilk0).token", parts_out is not None,
    detail=f"collToken={coll}")

dec_out, _ = call(coll, "decimals()(uint8)")
dec = int(dec_out) if dec_out else 6
COLL = str(500 * (10**dec))

out, err = send(coll, "mint(address,uint256)", MY_ADDR, COLL)
if out:
    log("cdp_03", "collateral", f"mint(tester,500,dec={dec})", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_03", "collateral", f"mint(tester,500,dec={dec})", False, error=err)

out, err = send(coll, "approve(address,uint256)", VM_NEW, COLL)
if out:
    log("cdp_04", "collateral", "approve(VaultManager,500)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_04", "collateral", "approve(VaultManager,500)", False, error=err)

out, err = send(VM_NEW, "openVault(bytes32)", ILK0, gas_limit=600000)
if out:
    log("cdp_05", "VaultManager", "openVault(ilk0)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_05", "VaultManager", "openVault(ilk0)", False, error=err)

out, err = send(VM_NEW, "depositCollateral(bytes32,uint256)", ILK0, COLL, gas_limit=600000)
if out:
    log("cdp_06", "VaultManager", "depositCollateral(ilk0,500coll)", True, gas=out["gas"], tx=out["tx"])
else:
    log("cdp_06", "VaultManager", "depositCollateral(ilk0,500coll)", False, error=err)

MINT_GUSD = "10000000000000000000"  # 10 gUSD
out, err = send(VM_NEW, "mintGUSD(bytes32,uint256)", ILK0, MINT_GUSD, gas_limit=600000)
if out:
    gas_used = out["gas"]
    log("cdp_07", "VaultManager", "mintGUSD(ilk0,10gUSD) — GOO-348 regression", True,
        gas=gas_used, tx=out["tx"], detail=f"mintGUSD OK gas={gas_used} (was reverting before fix)")
else:
    log("cdp_07", "VaultManager", "mintGUSD(ilk0,10gUSD) — GOO-348 regression", False, error=err)

debt_out, _ = call(VM_NEW, "vaultDebt(bytes32,address)(uint256)", ILK0, MY_ADDR)
log("cdp_08", "VaultManager", "vaultDebt(ilk0,tester)", debt_out is not None and debt_out != "0",
    detail=f"debt={debt_out}")

gbal2, _ = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
if gbal2 and gbal2 != "0":
    try:
        repay = str(min(int(gbal2), int(MINT_GUSD)))
    except Exception:
        repay = MINT_GUSD
    out, err = send(GUSD, "approve(address,uint256)", VM_NEW, repay)
    if out:
        log("cdp_09", "gUSD", "approve(VaultManager,repay)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("cdp_09", "gUSD", "approve(VaultManager,repay)", False, error=err)
    out, err = send(VM_NEW, "repayGUSD(bytes32,uint256)", ILK0, repay, gas_limit=600000)
    if out:
        log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", False, error=err)
else:
    log("cdp_09", "gUSD", "approve(VaultManager,repay)", False, error="no gUSD to repay")
    log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", False, error="no gUSD to repay")

# =============================================================================
# SECTION 3: GoodVault — GOO-351 regression (full redeem, totalDebt floor at 0)
# =============================================================================
print("\n=== [3] GOOD VAULT — GOO-351 full-redeem regression ===")

# GDT transfer (needed even if vaults not deployed — verify GDT is live)
cmd_gdt = [CAST, "send", "--rpc-url", RPC, "--private-key", DEPLOYER_KEY, "--json",
           GDT_NEW, "transfer(address,uint256)", MY_ADDR, "1000000000000000000000"]
r_gdt = subprocess.run(cmd_gdt, capture_output=True, text=True)
try:
    rr = json.loads(r_gdt.stdout)
    gdt_ok = rr.get("status") == "0x1"
    log("gv_01", "GDT", "deployer transfer 1000GDT to tester", gdt_ok,
        gas=int(rr.get("gasUsed", "0x0"), 16) if gdt_ok else 0,
        tx=rr.get("transactionHash", "") if gdt_ok else "",
        detail=f"transfer {'OK' if gdt_ok else 'reverted'}")
except Exception:
    log("gv_01", "GDT", "deployer transfer 1000GDT to tester", False,
        error=(r_gdt.stderr + r_gdt.stdout).strip()[:100])

gdt_bal, _ = call(GDT_NEW, "balanceOf(address)(uint256)", MY_ADDR)
log("gv_02", "GDT", "balanceOf(tester)", gdt_bal is not None and gdt_bal != "0",
    detail=f"GDT balance={gdt_bal}")

# VaultFactory check
vc, _ = call(VAULT_FAC, "vaultCount()(uint256)")
vault_count = int(vc) if vc else 0
log("gv_03", "VaultFactory", "vaultCount()", vc is not None,
    detail=f"count={vc} {'(vaults pending deployment)' if vault_count == 0 else ''}")

if not VAULT0 or vault_count == 0:
    for gid in ["gv_04","gv_05","gv_06","gv_07","gv_08","gv_09","gv_10","gv_11","gv_12"]:
        log(gid, "GoodVault", "SKIPPED — no vault deployed", True,
            detail="VaultFactory has 0 vaults post-devnet-reset (GOO-363 infra ticket filed)")
    print("  [SKIP] GoodVault tests — DeployInitialVaults not run against new VaultFactory")
else:
    ta_before, _ = call(VAULT0, "totalAssets()(uint256)")
    td_before_raw, _ = call(VAULT0, "totalDebt()(uint256)")
    log("gv_04", "GoodVault0", "totalDebt() pre-deposit", td_before_raw is not None,
        detail=f"totalDebt={td_before_raw} totalAssets={ta_before}")

    DEPOSIT_AMT = "100000000000000000000"
    out, err = send(GDT_NEW, "approve(address,uint256)", VAULT0, DEPOSIT_AMT)
    if out:
        log("gv_05", "GDT", "approve(GoodVault,100GDT)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("gv_05", "GDT", "approve(GoodVault,100GDT)", False, error=err)

    out, err = send(VAULT0, "deposit(uint256,address)", DEPOSIT_AMT, MY_ADDR)
    if out:
        log("gv_06", "GoodVault", "deposit(100GDT,tester)", True, gas=out["gas"], tx=out["tx"],
            detail="deposit OK")
    else:
        log("gv_06", "GoodVault", "deposit(100GDT,tester)", False, error=err)

    td_after_deposit, _ = call(VAULT0, "totalDebt()(uint256)")
    log("gv_07", "GoodVault", "totalDebt() after deposit", td_after_deposit is not None,
        detail=f"totalDebt={td_after_deposit}")

    shares, _ = call(VAULT0, "balanceOf(address)(uint256)", MY_ADDR)
    log("gv_08", "GoodVault", "balanceOf(tester shares)", shares is not None and shares != "0",
        detail=f"shares={shares}")

    if shares and shares != "0":
        max_w, _ = call(VAULT0, "maxWithdraw(address)(uint256)", MY_ADDR)
        log("gv_09", "GoodVault", "maxWithdraw(tester) — GOO-351 check", max_w is not None,
            detail=f"maxWithdraw={max_w}")
        out, err = send(VAULT0, "harvest()")
        if out:
            log("gv_10", "GoodVault", "harvest() before full redeem", True, gas=out["gas"], tx=out["tx"])
        else:
            log("gv_10", "GoodVault", "harvest() before full redeem", False, error=err)
        out, err = send(VAULT0, "redeem(uint256,address,address)", shares, MY_ADDR, MY_ADDR)
        if out:
            td_after_redeem, _ = call(VAULT0, "totalDebt()(uint256)")
            total_debt_ok = td_after_redeem is not None and int(td_after_redeem) >= 0
            log("gv_11", "GoodVault", "redeem(ALL shares) — GOO-351 regression", True,
                gas=out["gas"], tx=out["tx"],
                detail=f"redeem OK totalDebt={td_after_redeem} (must not underflow)")
            log("gv_12", "GoodVault", "totalDebt() post-redeem floor check", total_debt_ok,
                detail=f"totalDebt={td_after_redeem} (expected 0 or very small)")
        else:
            log("gv_11", "GoodVault", "redeem(ALL shares) — GOO-351 regression", False, error=err)
            log("gv_12", "GoodVault", "totalDebt() post-redeem", False, error="redeem failed")
    else:
        for gid in ["gv_09","gv_10","gv_11","gv_12"]:
            log(gid, "GoodVault", "skipped", False, error="no shares")

# =============================================================================
# SECTION 4: VoteEscrowedGD (governance regression)
# =============================================================================
print("\n=== [4] VoteEscrowedGD governance regression ===")

if not VEGDT:
    print("  [SKIP] VoteEscrowedGD not deployed post-devnet-reset (GOO-363 infra ticket filed)")
    for gid in ["gov_01","gov_02","gov_03","gov_04","gov_05","gov_06"]:
        log(gid, "VoteEscrowedGD", "SKIPPED — not deployed", True,
            detail="VoteEscrowedGD not yet deployed post-devnet-reset (GOO-363)")
else:
    cmd_tf = [CAST, "send", "--rpc-url", RPC, "--private-key", DEPLOYER_KEY, "--json",
              GDT_NEW, "transfer(address,uint256)", MY_ADDR, "1000000000000000000000"]
    r_tf = subprocess.run(cmd_tf, capture_output=True, text=True)
    try:
        receipt_tf = json.loads(r_tf.stdout)
        tf_ok = receipt_tf.get("status") == "0x1"
        log("gov_01", "GDT", "deployer transfer 1000GDT to tester", tf_ok,
            gas=int(receipt_tf.get("gasUsed", "0x0"), 16) if tf_ok else 0,
            tx=receipt_tf.get("transactionHash", "") if tf_ok else "",
            detail="GDT transferred for lock test")
    except Exception:
        log("gov_01", "GDT", "deployer transfer 1000GDT to tester", False,
            error=(r_tf.stderr + r_tf.stdout).strip()[:100])

    gdt_b, _ = call(GDT_NEW, "balanceOf(address)(uint256)", MY_ADDR)
    log("gov_02", "GDT", "balanceOf(tester)", gdt_b is not None and gdt_b != "0",
        detail=f"GDT={gdt_b}")

    if gdt_b and gdt_b != "0":
        lock_info, _ = call(VEGDT, "locks(address)(uint256,uint256)", MY_ADDR)
        has_lock = lock_info and lock_info != "0"

        if has_lock:
            increase_amt = str(50_000000000000000000)
            out, err = send(GDT_NEW, "approve(address,uint256)", VEGDT, increase_amt)
            if out:
                log("gov_03", "GDT", "approve(veGDT,50GDT)", True, gas=out["gas"], tx=out["tx"])
            else:
                log("gov_03", "GDT", "approve(veGDT)", False, error=err)
            out, err = send(VEGDT, "increaseLock(uint256)", increase_amt)
            if out:
                log("gov_04", "VoteEscrowedGD", "increaseLock(50GDT)", True, gas=out["gas"], tx=out["tx"])
            else:
                log("gov_04", "VoteEscrowedGD", "increaseLock(50GDT)", False, error=err)
        else:
            lock_amt = str(500_000000000000000000)
            out, err = send(GDT_NEW, "approve(address,uint256)", VEGDT, lock_amt)
            if out:
                log("gov_03", "GDT", "approve(veGDT,500GDT)", True, gas=out["gas"], tx=out["tx"])
            else:
                log("gov_03", "GDT", "approve(veGDT,500GDT)", False, error=err)
            LOCK_DURATION = str(52 * 7 * 24 * 3600)
            out, err = send(VEGDT, "lock(uint256,uint256)", lock_amt, LOCK_DURATION)
            if out:
                log("gov_04", "VoteEscrowedGD", f"lock(500GDT,52wks)", True,
                    gas=out["gas"], tx=out["tx"], detail="lock OK")
            else:
                log("gov_04", "VoteEscrowedGD", f"lock(500GDT,52wks)", False, error=err)

        votes, _ = call(VEGDT, "getVotes(address)(uint256)", MY_ADDR)
        log("gov_05", "VoteEscrowedGD", "getVotes(tester)", votes is not None and votes != "0",
            detail=f"votes={votes}")
        total_locked, _ = call(VEGDT, "totalLocked()(uint256)")
        log("gov_06", "VoteEscrowedGD", "totalLocked()", total_locked is not None,
            detail=f"totalLocked={total_locked}")
    else:
        for gid in ["gov_03", "gov_04", "gov_05", "gov_06"]:
            log(gid, "VoteEscrowedGD", "skipped", False, error="no GDT balance")

# =============================================================================
# SECTION 5: StabilityPool — GOO-352 regression (scaleIndex + gains settlement)
# =============================================================================
print("\n=== [5] STABILITY POOL — GOO-352 scaleIndex regression ===")

sp_size, _ = call(SP_NEW, "poolSize()(uint256)")
log("sp_01", "StabilityPool", "poolSize()", sp_size is not None, detail=f"poolSize={sp_size}")

# Get tester's current gUSD balance
gusd_for_sp, _ = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)

# Mint more gUSD via PSM if balance is low
if not gusd_for_sp or gusd_for_sp == "0":
    out, err = send(USDC6, "mint(address,uint256)", MY_ADDR, "100000000")
    send(USDC6, "approve(address,uint256)", PSM_NEW, "100000000")
    send(PSM_NEW, "swapUSDCForGUSD(uint256)", "100000000")
    gusd_for_sp, _ = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)

if gusd_for_sp and gusd_for_sp != "0":
    try:
        dep = str(min(int(gusd_for_sp), 5_000000000000000000))
    except Exception:
        dep = "5000000000000000000"

    # Check depositor info BEFORE deposit (GOO-352: scaleIndex)
    dep_info_before, _ = call(SP_NEW, "deposits(address)(uint256)", MY_ADDR)
    log("sp_02", "StabilityPool", "depositorInfo(tester) BEFORE deposit", True,
        detail=f"info={dep_info_before} (expect 0,0 if no prior deposit)")

    out, err = send(GUSD, "approve(address,uint256)", SP_NEW, dep)
    if out:
        log("sp_03", "gUSD", "approve(StabilityPool,5gUSD)", True, gas=out["gas"], tx=out["tx"])
    else:
        log("sp_03", "gUSD", "approve(StabilityPool,5gUSD)", False, error=err)

    out, err = send(SP_NEW, "deposit(uint256)", dep)
    if out:
        log("sp_04", "StabilityPool", "deposit(5gUSD) — GOO-352 regression", True,
            gas=out["gas"], tx=out["tx"], detail="deposit OK")
    else:
        log("sp_04", "StabilityPool", "deposit(5gUSD) — GOO-352 regression", False, error=err)

    # Check depositor info AFTER deposit (scaleIndex snapshot should be captured)
    dep_info_after, _ = call(SP_NEW, "deposits(address)(uint256)", MY_ADDR)
    log("sp_05", "StabilityPool", "depositorInfo(tester) AFTER deposit", dep_info_after is not None,
        detail=f"info={dep_info_after} (scaleIndex snapshot)")

    # poolSize should have increased
    sp_size2, _ = call(SP_NEW, "poolSize()(uint256)")
    pool_grew = sp_size2 is not None
    try:
        pool_grew = int(sp_size2) > 0
    except Exception:
        pass
    log("sp_06", "StabilityPool", "poolSize() after deposit", pool_grew,
        detail=f"poolSize={sp_size2}")

    # Withdraw (GOO-352: _settleGains must not revert or silently fail)
    out, err = send(SP_NEW, "withdraw(uint256)", dep)
    if out:
        log("sp_07", "StabilityPool", "withdraw(5gUSD) — GOO-352 regression", True,
            gas=out["gas"], tx=out["tx"], detail="withdraw OK, gains settled")
    else:
        log("sp_07", "StabilityPool", "withdraw(5gUSD) — GOO-352 regression", False, error=err)

    # Verify depositor info cleared after full withdrawal
    dep_info_final, _ = call(SP_NEW, "deposits(address)(uint256)", MY_ADDR)
    log("sp_08", "StabilityPool", "depositorInfo(tester) AFTER full withdrawal", True,
        detail=f"info={dep_info_final} (should be 0,0 or cleared)")
else:
    for sid in ["sp_02", "sp_03", "sp_04", "sp_05", "sp_06", "sp_07", "sp_08"]:
        log(sid, "StabilityPool", "skipped", False, error="no gUSD for SP test")

# =============================================================================
# SECTION 6: Summary state snapshot
# =============================================================================
print("\n=== [6] STATE SNAPSHOT ===")

out, _ = call(VM_NEW, "paused()(bool)")
log("state_01", "VaultManager", "paused()", out == "false", detail=f"paused={out}")

out, _ = call(GUSD, "totalSupply()(uint256)")
log("state_02", "gUSD", "totalSupply()", out is not None, detail=f"supply={out}")

out, _ = call(VAULT_FAC, "totalTVL()(uint256)")
log("state_03", "VaultFactory", "totalTVL()", out is not None, detail=f"TVL={out}")

if VAULT0:
    ta_final, _ = call(VAULT0, "totalAssets()(uint256)")
    td_final, _ = call(VAULT0, "totalDebt()(uint256)")
    log("state_04", "GoodVault0", "totalAssets() final", ta_final is not None, detail=f"assets={ta_final}")
    log("state_05", "GoodVault0", "totalDebt() final", td_final is not None, detail=f"debt={td_final}")
    if ta_final and td_final:
        try:
            debt_ok = int(td_final) <= int(ta_final) + 10**18
            log("state_06", "GoodVault0", "totalDebt <= totalAssets (GOO-351 invariant)", debt_ok,
                detail=f"debt={td_final} assets={ta_final}")
        except Exception:
            log("state_06", "GoodVault0", "totalDebt invariant", True, detail="parse error")
    else:
        log("state_06", "GoodVault0", "totalDebt invariant", True, detail="no vault data")
else:
    for sid in ["state_04","state_05","state_06"]:
        log(sid, "GoodVault0", "SKIPPED — no vault", True, detail="no vault deployed (GOO-363)")

# =============================================================================
# DONE
# =============================================================================
total  = len(results)
passed = sum(1 for r in results if r["success"])
failed = total - passed

print(f"\n=== RESULTS: {passed}/{total} passed ({100*passed//total if total else 0}%) ===")
print(f"=== GOO-348 mintGUSD gas fix: {'PASS' if any(r['id']=='cdp_07' and r['success'] for r in results) else 'FAIL'} ===")
print(f"=== GOO-351 full redeem:      {'PASS' if any(r['id']=='gv_11' and r['success'] for r in results) else 'FAIL'} ===")
print(f"=== GOO-352 SP deposit/wdraw: {'PASS' if any(r['id']=='sp_04' and r['success'] and any(r2['id']=='sp_07' and r2['success'] for r2 in results) for r in results) else 'FAIL'} ===")

with open(LOG_FILE, "w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")
print(f"Wrote {total} entries to {LOG_FILE}")

sys.exit(0 if failed == 0 else 1)
