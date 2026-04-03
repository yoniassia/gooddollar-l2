#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // === 1. Mobile scroll re-investigation ===
  console.log('\n=== MOBILE SCROLL (re-check) ===');
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const scrollData = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const offenders = all.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 5 && el.offsetParent !== null;
      }).slice(0, 5).map(el => ({
        tag: el.tagName,
        id: el.id,
        cls: el.className && el.className.toString().slice(0, 80),
        right: Math.round(el.getBoundingClientRect().right),
      }));
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        overflow: document.body.scrollWidth - window.innerWidth,
        offenders
      };
    });
    console.log('scrollWidth:', scrollData.bodyScrollWidth, 'innerWidth:', scrollData.windowInnerWidth, 'overflow:', scrollData.overflow);
    console.log('Offenders:', JSON.stringify(scrollData.offenders, null, 2));
    await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/mobile-run7.png' });
    await ctx.close();
  }

  // === 2. Stocks page — check for prices ===
  console.log('\n=== STOCKS PAGE (oracle check) ===');
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        bodyText: text,
        hasTickerSymbols: /AAPL|TSLA|NVDA|MSFT|AMZN/i.test(text),
        hasDollarPrices: /\$\d+/.test(text),
        hasEmptyState: /no stocks|coming soon/i.test(text),
        bodyLength: text.length,
      };
    });
    console.log('Has tickers:', data.hasTickerSymbols);
    console.log('Has $ prices:', data.hasDollarPrices);
    console.log('Has empty state:', data.hasEmptyState);
    console.log('Body (first 600):\n', data.bodyText.slice(0, 600));
    await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/stocks-run7.png' });
    await ctx.close();
  }

  await browser.close();
}

run().catch(console.error);
