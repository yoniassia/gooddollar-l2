#!/usr/bin/env node
/**
 * Check stocks page with JS+CSS working — do wagmi reads fire now?
 */
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const rpcCalls = [];
  page.on('request', req => {
    if (req.url().includes('rpc.goodclaw.org')) rpcCalls.push(req.url());
  });

  await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasTickerSymbols: /AAPL|TSLA|NVDA|MSFT/.test(text),
      hasDollarPrices: /\$\d+/.test(text),
      hasEmptyState: /no stocks match/i.test(text),
      bodyLen: text.length,
      snippet: text.slice(0, 700),
    };
  });

  console.log('RPC calls:', rpcCalls.length);
  console.log('Has tickers:', data.hasTickerSymbols, '| Has prices:', data.hasDollarPrices);
  console.log('Empty state:', data.hasEmptyState, '| body len:', data.bodyLen);
  console.log('Body snippet:\n', data.snippet);

  await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/stocks-live.png' });
  await browser.close();
}

run().catch(console.error);
