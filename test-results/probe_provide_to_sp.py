#!/usr/bin/env python3
"""Quick probe to test provideToSP() directly — GOO-364 investigation.
Tester Gamma reported provideToSP() reverts on all signature variants.
My iter20 confirmed deposit() works. This probes provideToSP() specifically.
"""
import subprocess, os, json

RPC   = "http://localhost:8545"
CAST  = os.path.expanduser("~/.foundry/bin/cast")

MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MY_KEY  = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

SP_NEW = "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07"
GUSD   = "0xc351628eb244ec633d5f21fbd6621e1a683b1181"
PSM    = "0xdbc43ba45381e02825b14322cddd15ec4b3164e6"
USDC6  = "0xb7278a61aa25c888815afc32ad3cc52ff24fe575"

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout.strip(), r.returncode, r.stderr.strip()

def send(contract, sig, *args, gas_limit=None):
    cmd = [CAST, "send", "--rpc-url", RPC, "--private-key", MY_KEY, "--json",
           contract, sig] + list(args)
    if gas_limit:
        cmd += ["--gas-limit", str(gas_limit)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None, r.stderr.strip()
    try:
        return json.loads(r.stdout), None
    except Exception:
        return {"raw": r.stdout}, None

print("=== GOO-364 provideToSP probe ===")

# 1. Check SP pool size
out, rc, err = call(SP_NEW, "totalDeposits()(uint256)")
print(f"SP.totalDeposits = {out}")

# 2. Check SP scaleIndex and drainEpoch
out, rc, err = call(SP_NEW, "scaleIndex()(uint256)")
print(f"SP.scaleIndex = {out}")
out, rc, err = call(SP_NEW, "drainEpoch()(uint256)")
print(f"SP.drainEpoch = {out}")

# 3. Check our gUSD balance
gusd_bal, rc, err = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
print(f"gUSD balance = {gusd_bal}")

# 4. Mint gUSD via PSM if needed
if not gusd_bal or gusd_bal.split()[0] == "0":
    print("No gUSD — minting via PSM...")
    send(USDC6, "mint(address,uint256)", MY_ADDR, "100000000")
    send(USDC6, "approve(address,uint256)", PSM, "100000000")
    out, err = send(PSM, "swapUSDCForGUSD(uint256)", "100000000")
    if err:
        print(f"  PSM swap failed: {err}")
    else:
        print(f"  PSM swap OK")
    gusd_bal, rc, err = call(GUSD, "balanceOf(address)(uint256)", MY_ADDR)
    print(f"  gUSD balance after PSM = {gusd_bal}")

# 5. Check existing deposit state
dep, rc, err = call(SP_NEW, "deposits(address)(uint256)", MY_ADDR)
dep_epoch, rc2, err2 = call(SP_NEW, "depositEpoch(address)(uint256)", MY_ADDR)
dep_snap, rc3, err3 = call(SP_NEW, "depositScaleSnapshot(address)(uint256)", MY_ADDR)
print(f"deposits[me] = {dep}")
print(f"depositEpoch[me] = {dep_epoch}")
print(f"depositScaleSnapshot[me] = {dep_snap}")

# 6. Approve SP
AMOUNT = "5000000000000000000"  # 5e18
print(f"\nApproving SP for {AMOUNT}...")
out, err = send(GUSD, "approve(address,uint256)", SP_NEW, AMOUNT)
if err:
    print(f"  approve FAILED: {err}")
else:
    gas = out.get("gasUsed", "?") if out else "?"
    print(f"  approve OK (gas={gas})")

# Verify allowance
alw, rc, err = call(GUSD, "allowance(address,address)(uint256)", MY_ADDR, SP_NEW)
print(f"  allowance[me][SP] = {alw}")

# 7. Test provideToSP(uint256) — single-arg variant
print(f"\nTesting provideToSP(uint256) = {AMOUNT}...")
out, err = send(SP_NEW, "provideToSP(uint256)", AMOUNT)
if err:
    print(f"  provideToSP(uint256) FAILED: {err}")
else:
    gas = out.get("gasUsed", "?") if out else "?"
    print(f"  provideToSP(uint256) OK (gas={gas})")
    # Withdraw it back
    send(SP_NEW, "withdrawFromSP(uint256)", AMOUNT)
    print("  (withdrawal cleanup done)")

# 8. Also test deposit() directly for comparison
print(f"\nApproving SP for deposit()...")
send(GUSD, "approve(address,uint256)", SP_NEW, AMOUNT)
print(f"Testing deposit(uint256) = {AMOUNT}...")
out, err = send(SP_NEW, "deposit(uint256)", AMOUNT)
if err:
    print(f"  deposit(uint256) FAILED: {err}")
else:
    gas = out.get("gasUsed", "?") if out else "?"
    print(f"  deposit(uint256) OK (gas={gas})")
    send(SP_NEW, "withdraw(uint256)", AMOUNT)
    print("  (withdrawal cleanup done)")

print("\n=== Done ===")
