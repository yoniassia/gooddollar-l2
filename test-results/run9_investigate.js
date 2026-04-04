#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // === 1. Mobile scroll with JS loaded ===
  console.log('\n=== MOBILE SCROLL (post-GOO-209 fix) ===');
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
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
        width: Math.round(el.getBoundingClientRect().width),
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
      }));
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        overflow: document.body.scrollWidth - window.innerWidth,
        offenders
      };
    });
    console.log('overflow:', scrollData.overflow, 'px');
    console.log('Offenders:', JSON.stringify(scrollData.offenders, null, 2));
    await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/mobile-run9.png' });
    await ctx.close();
  }

  // === 2. Stocks with JS loaded — wait for wagmi reads ===
  console.log('\n=== STOCKS PAGE (with JS, wagmi reads) ===');
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const rpcCalls = [];
    page.on('request', req => {
      if (req.url().includes('rpc.goodclaw.org') || req.url().includes('8545')) {
        rpcCalls.push(req.url());
      }
    });
    await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000); // wait for wagmi reads
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTickerSymbols: /AAPL|TSLA|NVDA|MSFT/.test(text),
        hasDollarPrices: /\$\d+/.test(text),
        hasEmptyState: /no stocks match/i.test(text),
        bodyLen: text.length,
        snippet: text.slice(0, 600),
      };
    });
    console.log('Has tickers:', data.hasTickerSymbols, '| Has prices:', data.hasDollarPrices);
    console.log('Empty state:', data.hasEmptyState, '| body len:', data.bodyLen);
    console.log('RPC calls:', rpcCalls.length);
    console.log('Snippet:\n', data.snippet);
    await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/stocks-run9.png' });
    await ctx.close();
  }

  await browser.close();
}

run().catch(console.error);
