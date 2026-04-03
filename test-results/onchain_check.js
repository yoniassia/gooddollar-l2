#!/usr/bin/env node
/**
 * On-chain data verification — compare UI vs chain state
 * Uses direct JSON-RPC calls to devnet (no cast required)
 * Contracts from devnet.ts (current):
 *   GoodDollarToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3
 *   StocksPriceOracle: 0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A (redeployed 2026-04-03)
 *   PerpEngine: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
 *   MarketFactory: 0xc7cDb7A2E5dDa1B7A0E792Fe1ef08ED20A6F56D4
 *   SyntheticAssetFactory: 0xd9140951d8aE6E5F625a02F5908535e16e3af964 (redeployed 2026-04-03)
 *   CollateralVault: 0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5 (redeployed 2026-04-03)
 *
 * NOTE: PriceOracle at 0x0165878A594ca255338adfa4d48449f69242Eb8F is the legacy perp oracle.
 *       The stocks oracle (StocksPriceOracle) was redeployed with 12 tickers on 2026-04-03.
 */

const http = require('http');

const RPC = 'http://localhost:8545';
const CONTRACTS = {
  GoodDollarToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  StocksPriceOracle: '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A',
  PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  MarketFactory: '0xc7cDb7A2E5dDa1B7A0E792Fe1ef08ED20A6F56D4',
  SyntheticAssetFactory: '0xd9140951d8aE6E5F625a02F5908535e16e3af964',
  CollateralVault: '0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5',
};

let reqId = 1;

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: reqId++, method, params });
    const req = http.request(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// keccak256("name()") = 0x06fdde03
// keccak256("symbol()") = 0x95d89b41
// keccak256("totalSupply()") = 0x18160ddd
// keccak256("decimals()") = 0x313ce567
// keccak256("balanceOf(address)") = 0x70a08231

function hexToAscii(hex) {
  const h = hex.replace('0x', '');
  // ABI encoded string: offset (32 bytes) + length (32 bytes) + data
  const len = parseInt(h.slice(64, 128), 16);
  const data = h.slice(128, 128 + len * 2);
  let str = '';
  for (let i = 0; i < data.length; i += 2) {
    const code = parseInt(data.slice(i, i + 2), 16);
    if (code > 0) str += String.fromCharCode(code);
  }
  return str;
}

async function run() {
  console.log('=== On-Chain Data Verification ===\n');

  // 1. Check RPC is alive
  try {
    const chainId = await rpc('eth_chainId', []);
    console.log(`Chain ID: ${parseInt(chainId.result, 16)} (expected 42069)`);
    const blockNum = await rpc('eth_blockNumber', []);
    console.log(`Block number: ${parseInt(blockNum.result, 16)}`);
  } catch (e) {
    console.log(`RPC UNREACHABLE: ${e.message}`);
    console.log('(devnet may not be running — skipping on-chain checks)');
    return;
  }

  // 2. GoodDollarToken details
  console.log('\n--- GoodDollarToken ---');
  try {
    const name = await rpc('eth_call', [{ to: CONTRACTS.GoodDollarToken, data: '0x06fdde03' }, 'latest']);
    const symbol = await rpc('eth_call', [{ to: CONTRACTS.GoodDollarToken, data: '0x95d89b41' }, 'latest']);
    const totalSupply = await rpc('eth_call', [{ to: CONTRACTS.GoodDollarToken, data: '0x18160ddd' }, 'latest']);
    console.log(`  Name: ${hexToAscii(name.result)}`);
    console.log(`  Symbol: ${hexToAscii(symbol.result)}`);
    const supply = BigInt(totalSupply.result) / BigInt(10 ** 18);
    console.log(`  Total Supply: ${supply.toLocaleString()} G$`);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // 3. Check contract code is deployed (not empty)
  console.log('\n--- Contract Deployment Status ---');
  for (const [name, addr] of Object.entries(CONTRACTS)) {
    try {
      const code = await rpc('eth_getCode', [addr, 'latest']);
      const deployed = code.result && code.result !== '0x' && code.result.length > 2;
      console.log(`  ${name}: ${deployed ? 'DEPLOYED' : 'NOT DEPLOYED'} (${addr})`);
    } catch (e) {
      console.log(`  ${name}: ERROR - ${e.message}`);
    }
  }

  // 4. Block stats
  console.log('\n--- Latest Block ---');
  try {
    const block = await rpc('eth_getBlockByNumber', ['latest', false]);
    const b = block.result;
    console.log(`  Number: ${parseInt(b.number, 16)}`);
    console.log(`  Transactions: ${b.transactions.length}`);
    console.log(`  Timestamp: ${new Date(parseInt(b.timestamp, 16) * 1000).toISOString()}`);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
}

run().catch(console.error);
