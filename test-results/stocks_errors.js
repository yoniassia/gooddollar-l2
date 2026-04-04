#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message.slice(0, 200)));

  const allRequests = [];
  page.on('request', req => {
    const u = req.url();
    if (!u.includes('_next') && !u.includes('.woff') && !u.includes('.png')) {
      allRequests.push(`${req.method()} ${u.slice(0, 100)}`);
    }
  });

  await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log(' ', e));

  console.log(`\nAll non-static requests (${allRequests.length}):`);
  allRequests.forEach(r => console.log(' ', r));

  // Check wagmi initialization
  const wagmiState = await page.evaluate(() => {
    return {
      hasRainbowKit: document.querySelectorAll('[data-rk]').length > 0,
      // Check if the hidden element works (Tailwind CSS verification)
      tailwindOk: (() => {
        const el = document.createElement('div');
        el.className = 'hidden';
        el.style.position = 'absolute';
        el.style.top = '-9999px';
        document.body.appendChild(el);
        const d = window.getComputedStyle(el).display;
        document.body.removeChild(el);
        return d === 'none';
      })(),
      // Check for any React context errors
      bodyText200: document.body.innerText.slice(0, 200),
    };
  });
  console.log('\nWagmi/RainbowKit:', wagmiState);

  await browser.close();
}

run().catch(console.error);
