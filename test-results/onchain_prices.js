#!/usr/bin/env node
/**
 * Verify PriceOracle on-chain prices for stock tickers
 * StocksPriceOracle: 0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A (redeployed 2026-04-03 with 12 tickers)
 * Function: getPrice(string ticker) -> uint256
 *
 * NOTE: The original PriceOracle at 0x0165878A594ca255338adfa4d48449f69242Eb8F
 * is the perp oracle (PerpPriceOracle) and only has partial feeds. The stocks
 * oracle was redeployed — use the address from devnet.ts (StocksPriceOracle).
 */

const http = require('http');

const RPC = 'http://localhost:8545';
const PRICE_ORACLE = '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A';
const TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD'];

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

// Pre-computed keccak256 function selectors (sha3-256 != keccak256 in node crypto)
// Verified via: viem.toFunctionSelector('getPrice(string)') === '0x524f3889'
const SELECTORS = {
  'getPrice(string)': '0x524f3889',
};

// ABI encode string argument
function encodeString(str) {
  const selector = SELECTORS['getPrice(string)']; // 4-byte selector (0x-prefixed)
  // ABI encode: offset (32 bytes) + length (32 bytes) + data (padded to 32 bytes)
  const offset = '0000000000000000000000000000000000000000000000000000000000000020';
  const bytes = Buffer.from(str, 'utf8');
  const lenHex = bytes.length.toString(16).padStart(64, '0');
  const dataHex = bytes.toString('hex').padEnd(Math.ceil(bytes.length / 32) * 64, '0');
  return selector + offset + lenHex + dataHex;
}

async function getPrice(ticker) {
  const data = encodeString(ticker);
  const result = await rpc('eth_call', [{ to: PRICE_ORACLE, data }, 'latest']);
  if (result.error || !result.result || result.result === '0x') return null;
  // Price is 8-decimal fixed point (Chainlink standard); convert to USD float
  const raw = BigInt(result.result);
  return Number(raw) / 1e8;
}

async function run() {
  console.log('=== PriceOracle On-Chain Prices ===\n');

  const prices = {};
  for (const ticker of TICKERS) {
    try {
      const price = await getPrice(ticker);
      prices[ticker] = price;
      console.log(`  ${ticker.padEnd(6)}: ${price !== null ? '$' + price.toLocaleString() : 'NO DATA'}`);
    } catch (e) {
      console.log(`  ${ticker.padEnd(6)}: ERROR - ${e.message}`);
      prices[ticker] = null;
    }
  }

  const hasData = Object.values(prices).some(p => p !== null && p > 0);
  console.log(`\nResult: ${hasData ? 'REAL PRICES FOUND' : 'NO ON-CHAIN PRICES — oracle not seeded?'}`);

  // Write results for E2E suite to consume
  const fs = require('fs');
  fs.writeFileSync(
    require('path').join(__dirname, 'onchain-prices.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), prices }, null, 2)
  );

  return prices;
}

run().catch(console.error);
