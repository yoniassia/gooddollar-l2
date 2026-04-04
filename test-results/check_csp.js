#!/usr/bin/env node
const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.slice(0, 200) }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function run() {
  const r = await fetch('https://goodswap.goodclaw.org/stocks');
  const csp = r.headers['content-security-policy'] || r.headers['x-content-security-policy'] || '(none)';
  console.log('CSP Header:\n', csp);
  console.log('\n--- Connect-src ---');
  const connectSrc = csp.match(/connect-src[^;]*/)?.[0] || 'not found';
  console.log(connectSrc);
  console.log('\nAllows rpc.goodclaw.org:', connectSrc.includes('rpc.goodclaw.org') || connectSrc.includes('goodclaw.org'));
}

run().catch(console.error);
