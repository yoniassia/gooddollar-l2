#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  console.log('=== Stocks Page Deep Investigation ===\n');
  await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      bodyText: text,
      bodyLength: text.length,
      // Check for price patterns
      hasDollarPrices: /\$\d+/.test(text),
      hasPercentages: /[+-]?\d+\.?\d*%/.test(text),
      hasTickerSymbols: /AAPL|TSLA|NVDA|MSFT|AMZN|GOOGL|META|JPM/.test(text),
      hasEmptyState: /no stocks|loading|connect wallet|--/i.test(text),
      hasBrokenData: /NaN|undefined|null|\[object/.test(text),
    };
  });

  console.log('Body text (full):\n', data.bodyText);
  console.log('\n--- Analysis ---');
  console.log('Has $ prices:', data.hasDollarPrices);
  console.log('Has % changes:', data.hasPercentages);
  console.log('Has ticker symbols:', data.hasTickerSymbols);
  console.log('Has empty state:', data.hasEmptyState);
  console.log('Has broken data (NaN/undefined):', data.hasBrokenData);

  await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/stocks-deep.png' });

  // Also check Lend page
  console.log('\n=== Lend Page ===\n');
  await page.goto(`${FRONTEND_URL}/lend`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const lendText = await page.evaluate(() => document.body.innerText);
  console.log('Body text (first 400 chars):\n', lendText.slice(0, 400));

  // Also check Stable page
  console.log('\n=== Stable Page ===\n');
  await page.goto(`${FRONTEND_URL}/stable`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const stableText = await page.evaluate(() => document.body.innerText);
  console.log('Body text (first 400 chars):\n', stableText.slice(0, 400));

  // Also check Explore page
  console.log('\n=== Explore Page ===\n');
  await page.goto(`${FRONTEND_URL}/explore`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const exploreText = await page.evaluate(() => document.body.innerText);
  console.log('Body text (first 400 chars):\n', exploreText.slice(0, 400));

  await browser.close();
}

run().catch(console.error);
