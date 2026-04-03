#!/usr/bin/env python3
"""Check latest contract deployments."""
import json, os

files = [
    ('/home/goodclaw/gooddollar-l2/broadcast/DeployGoodLend.s.sol/42069/run-latest.json', 'GoodLend'),
    ('/home/goodclaw/gooddollar-l2/broadcast/DeployLiFiBridgeAggregator.s.sol/42069/run-latest.json', 'LiFi'),
]

deployments = {}
for path, label in files:
    if os.path.exists(path):
        with open(path) as fp:
            data = json.load(fp)
        ts = data.get('timestamp', 0)
        txs = data.get('transactions', [])
        creates = [(tx.get('contractName'), tx.get('contractAddress'))
                   for tx in txs if tx.get('transactionType') == 'CREATE']
        print(f"{label} (ts={ts}):")
        for name, addr in creates:
            print(f"  {name}: {addr}")
            if name:
                deployments[name] = addr
        print()
    else:
        print(f"{label}: no broadcast file")

print("Key addresses:")
for k in ['GoodLendPool', 'GoodLendToken', 'DebtToken', 'LiFiBridgeAggregator', 'UBIFeeSplitter']:
    if k in deployments:
        print(f"  {k}: {deployments[k]}")
