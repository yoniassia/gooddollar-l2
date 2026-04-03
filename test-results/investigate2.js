#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';
const EXPLORER_URL = 'https://explorer.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  // === Perps price investigation ===
  console.log('\n=== PERPS PRICES ===');
  const page1 = await context.newPage();
  await page1.goto(`${FRONTEND_URL}/perps`, { waitUntil: 'networkidle', timeout: 30000 });
  const priceData = await page1.evaluate(() => {
    const text = document.body.innerText;
    const numbers = text.match(/\$[\d,]+\.?\d*/g) || [];
    return {
      allPrices: numbers.slice(0, 20),
      zeroPrices: numbers.filter(n => parseFloat(n.replace(/[$,]/g, '')) === 0),
      bodyLength: text.length,
      bodySnippet: text.slice(0, 500)
    };
  });
  console.log('Prices found:', priceData.allPrices);
  console.log('Zero prices:', priceData.zeroPrices);
  console.log('Body snippet:', priceData.bodySnippet);
  await page1.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/perps-prices.png' });
  await page1.close();

  // === Explorer address transactions investigation ===
  console.log('\n=== EXPLORER ADDRESS TRANSACTIONS ===');
  const page2 = await context.newPage();
  await page2.goto(`${EXPLORER_URL}/address/0x70997970C51812dc3A010C7d01b50e0d17dc79C8`, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait extra for JS hydration
  await page2.waitForTimeout(3000);

  const txData = await page2.evaluate(() => {
    const text = document.body.innerText;
    const hasHashes = /0x[a-f0-9]{8,}/i.test(text);
    const hashes = text.match(/0x[a-f0-9]{8,}/gi) || [];
    return {
      hasHashes,
      hashCount: hashes.length,
      sampleHashes: hashes.slice(0, 3),
      bodySnippet: text.slice(0, 800),
      txTabText: ''
    };
  });
  console.log('Has tx hashes:', txData.hasHashes);
  console.log('Hash count:', txData.hashCount);
  console.log('Sample hashes:', txData.sampleHashes);
  console.log('Body snippet:', txData.bodySnippet);
  await page2.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/explorer-address-tx.png' });
  await page2.close();

  await browser.close();
}

run().catch(console.error);
