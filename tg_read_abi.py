#!/usr/bin/env python3
"""Read ABI and extract function signatures for key contracts."""
import json, hashlib

def keccak256(data):
    """Approximate keccak256 using sha3_256 — NOTE: NOT actual keccak, just for display."""
    k = hashlib.sha3_256(data.encode()).hexdigest()
    return k[:8]

contracts = [
    ("SyntheticAssetFactory", "/home/goodclaw/gooddollar-l2/out/SyntheticAssetFactory.sol/SyntheticAssetFactory.json"),
    ("CollateralVault", "/home/goodclaw/gooddollar-l2/out/CollateralVault.sol/CollateralVault.json"),
]

for name, path in contracts:
    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    with open(path) as f:
        artifact = json.load(f)
    abi = artifact.get("abi", [])
    for item in abi:
        if item.get("type") == "function":
            inputs = ", ".join(f"{inp.get('type','')} {inp.get('name','')}" for inp in item.get("inputs", []))
            outputs = ", ".join(out.get("type","") for out in item.get("outputs", []))
            mutability = item.get("stateMutability", "?")
            print(f"  {item['name']}({inputs}) -> ({outputs}) [{mutability}]")
