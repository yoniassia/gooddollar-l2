#!/usr/bin/env node
// Fetch and show raw CSS content
const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, port: 443,
      path: u.pathname + u.search, method: 'GET',
      headers: { 'Accept-Encoding': 'identity' }
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function run() {
  const urls = [
    'https://goodswap.goodclaw.org/_next/static/css/dd4e55cdc5ced9d2.css',
    'https://goodswap.goodclaw.org/_next/static/css/edbafff9265fa3e8.css',
  ];

  for (const url of urls) {
    console.log(`\n=== ${url.split('/').pop()} ===`);
    const r = await fetch(url);
    console.log(`Status: ${r.status}, size: ${r.body.length}`);

    // Search for hidden
    const hiddenIdx = r.body.indexOf('hidden');
    if (hiddenIdx === -1) {
      console.log('hidden: NOT FOUND in CSS');
    } else {
      console.log('hidden found at index', hiddenIdx, ':', r.body.slice(Math.max(0, hiddenIdx-20), hiddenIdx+60));
    }

    // Search for sm
    const smIdx = r.body.indexOf('@media');
    if (smIdx === -1) {
      console.log('@media: NOT FOUND — no responsive breakpoints at all');
    } else {
      console.log('@media first occurrence:', r.body.slice(smIdx, smIdx + 100));
    }

    // Show first 300 chars
    console.log('First 300 chars:', r.body.slice(0, 300));
  }
}

run().catch(console.error);
