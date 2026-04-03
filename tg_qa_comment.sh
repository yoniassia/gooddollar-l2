#!/bin/bash
npx paperclipai issue comment GOO-178 \
  --company-id 7e8ba4ed-e545-4394-ad98-c0c855409a4e \
  --body "QA Test Report 2026-04-03: All critical GoodStocks flows PASS on devnet (chain 42069). 11/11 contracts deployed. CV.mint/burn/liquidate all work. UBI fees: 5,050 GD collected, 1,683 GD routed to UBI pool. Stress: 10/10 rapid mints OK (avg 163k gas, avg 2s latency). Bugs filed: GOO-176 (listAsset OOG), GOO-177 (eth_call false errors). Key txs: mint=0xb45b1cd64a2ae7809f65169d4258f4292c6652b4ab5177c0af59eeec0da0350b burn=0xbb983a26333b75693ce312e3c3e702a0754f2cc2b177045a20cf7ddb0dbdffc7 liquidate=0x69165c00d3c3bc7d4e31ac379e4d3e072bea46b8105abb737acbc67b26c99e53"
