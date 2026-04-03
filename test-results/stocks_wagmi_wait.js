#!/usr/bin/env node
/**
 * Wait for wagmi contract reads to complete on stocks page
 * Tests whether prices appear after a longer delay
 */
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Log network requests to see wagmi RPC calls
  const rpcCalls = [];
  page.on('request', req => {
    if (req.url().includes('rpc') || req.url().includes('8545')) {
      rpcCalls.push({ url: req.url(), method: req.method() });
    }
  });

  await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });

  console.log('After networkidle:');
  let data = await page.evaluate(() => ({
    hasTickers: /AAPL|TSLA|NVDA/.test(document.body.innerText),
    hasPrices: /\$\d+/.test(document.body.innerText),
    bodyLen: document.body.innerText.length
  }));
  console.log('  hasTickers:', data.hasTickers, '| hasPrices:', data.hasPrices, '| len:', data.bodyLen);

  // Wait 5 seconds for wagmi reads
  await page.waitForTimeout(5000);

  console.log('\nAfter 5s additional wait:');
  data = await page.evaluate(() => ({
    hasTickers: /AAPL|TSLA|NVDA/.test(document.body.innerText),
    hasPrices: /\$\d+/.test(document.body.innerText),
    bodyLen: document.body.innerText.length,
    snippet: document.body.innerText.slice(0, 400)
  }));
  console.log('  hasTickers:', data.hasTickers, '| hasPrices:', data.hasPrices, '| len:', data.bodyLen);
  if (data.hasTickers) {
    console.log('  Snippet:\n', data.snippet);
  }

  // Wait 10 more seconds
  await page.waitForTimeout(10000);

  console.log('\nAfter 15s total wait:');
  data = await page.evaluate(() => ({
    hasTickers: /AAPL|TSLA|NVDA/.test(document.body.innerText),
    hasPrices: /\$\d+/.test(document.body.innerText),
    bodyLen: document.body.innerText.length,
    snippet: document.body.innerText.slice(0, 500)
  }));
  console.log('  hasTickers:', data.hasTickers, '| hasPrices:', data.hasPrices, '| len:', data.bodyLen);
  console.log('  Snippet:\n', data.snippet);

  console.log('\nRPC calls intercepted:', rpcCalls.length);

  await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/stocks-wagmi-wait.png' });
  await browser.close();
}

run().catch(console.error);
