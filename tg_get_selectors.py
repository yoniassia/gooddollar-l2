#!/usr/bin/env python3
"""Get correct function selectors from compiled artifacts."""
import json, os

contracts = [
    ("CollateralVault", "/home/goodclaw/gooddollar-l2/out/CollateralVault.sol/CollateralVault.json"),
    ("SyntheticAssetFactory", "/home/goodclaw/gooddollar-l2/out/SyntheticAssetFactory.sol/SyntheticAssetFactory.json"),
    ("GoodLendPool", "/home/goodclaw/gooddollar-l2/out/GoodLendPool.sol/GoodLendPool.json"),
    ("PerpEngine", "/home/goodclaw/gooddollar-l2/out/PerpEngine.sol/PerpEngine.json"),
]

for name, path in contracts:
    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    with open(path) as f:
        art = json.load(f)
    # methodIdentifiers has the selector -> sig mapping
    methods = art.get("methodIdentifiers", {})
    if methods:
        for sig, sel in sorted(methods.items()):
            print(f"  0x{sel}  {sig}")
    else:
        # Fallback to ABI
        abi = art.get("abi", [])
        for item in abi:
            if item.get("type") == "function":
                inputs = ",".join(i.get("type","") for i in item.get("inputs", []))
                print(f"  {item['name']}({inputs})")
