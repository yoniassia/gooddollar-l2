#!/usr/bin/env node
/**
 * Capture JS console errors on stocks page to diagnose wagmi reads not firing
 */
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  const logs = [];
  const networkReqs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') errors.push(text);
    else if (type === 'warning') warnings.push(text);
    else if (text.includes('wagmi') || text.includes('RPC') || text.includes('contract')) logs.push(text);
  });

  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));

  page.on('request', req => {
    const url = req.url();
    if (url.includes('rpc') || url.includes('8545') || url.includes('goodclaw')) {
      networkReqs.push(`${req.method()} ${url}`);
    }
  });

  page.on('response', res => {
    const url = res.url();
    if (url.includes('rpc') || url.includes('8545')) {
      networkReqs.push(`RESP ${res.status()} ${url}`);
    }
  });

  await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log(`\n=== Console Errors (${errors.length}) ===`);
  errors.forEach(e => console.log(' ERROR:', e.slice(0, 200)));

  console.log(`\n=== Console Warnings (${warnings.length}) ===`);
  warnings.slice(0, 5).forEach(w => console.log(' WARN:', w.slice(0, 200)));

  console.log(`\n=== Relevant Logs ===`);
  logs.forEach(l => console.log(' LOG:', l));

  console.log(`\n=== Network requests to goodclaw/rpc (${networkReqs.length}) ===`);
  networkReqs.forEach(r => console.log(' ', r));

  // Also check if wagmi is initialized
  const wagmiState = await page.evaluate(() => {
    // Try to find wagmi state in window
    const keys = Object.keys(window).filter(k =>
      k.includes('wagmi') || k.includes('rainbow') || k.includes('__NEXT')
    );
    return keys.slice(0, 10);
  });
  console.log('\n=== Wagmi/RainbowKit globals ===', wagmiState);

  await browser.close();
}

run().catch(console.error);
