#!/usr/bin/env node
/**
 * Check if https://rpc.goodclaw.org serves same chain/contracts as localhost:8545
 */
const https = require('https');
const http = require('http');

const STOCKS_ORACLE = '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A';
const SELECTOR = '0x524f3889'; // getPrice(string)

function rpcCall(baseUrl, method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const url = new URL(baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname || '/',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = lib.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ABI encode getPrice("AAPL")
function encodeGetPrice(ticker) {
  const offset = '0000000000000000000000000000000000000000000000000000000000000020';
  const bytes = Buffer.from(ticker, 'utf8');
  const lenHex = bytes.length.toString(16).padStart(64, '0');
  const dataHex = bytes.toString('hex').padEnd(Math.ceil(bytes.length / 32) * 64, '0');
  return SELECTOR + offset + lenHex + dataHex;
}

async function checkRpc(url, label) {
  console.log(`\n=== ${label} (${url}) ===`);
  try {
    const chainId = await rpcCall(url, 'eth_chainId', []);
    console.log(`  Chain ID: ${parseInt(chainId.result, 16)}`);

    const blockNum = await rpcCall(url, 'eth_blockNumber', []);
    console.log(`  Block: ${parseInt(blockNum.result, 16)}`);

    const oraclePrice = await rpcCall(url, 'eth_call', [
      { to: STOCKS_ORACLE, data: encodeGetPrice('AAPL') }, 'latest'
    ]);
    if (oraclePrice.error) {
      console.log(`  AAPL oracle: ERROR - ${oraclePrice.error.message}`);
    } else if (!oraclePrice.result || oraclePrice.result === '0x') {
      console.log(`  AAPL oracle: NO DATA (0x)`);
    } else {
      const price = Number(BigInt(oraclePrice.result)) / 1e8;
      console.log(`  AAPL oracle: $${price}`);
    }

    const oracleCode = await rpcCall(url, 'eth_getCode', [STOCKS_ORACLE, 'latest']);
    const deployed = oracleCode.result && oracleCode.result !== '0x' && oracleCode.result.length > 2;
    console.log(`  Oracle deployed: ${deployed}`);
  } catch (e) {
    console.log(`  UNREACHABLE: ${e.message}`);
  }
}

async function run() {
  await checkRpc('http://localhost:8545', 'localhost devnet');
  await checkRpc('https://rpc.goodclaw.org', 'goodclaw.org RPC');
}

run().catch(console.error);
