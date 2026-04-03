#!/usr/bin/env node
/**
 * GoodDollar L2 — Playwright E2E Test Suite
 * Browses all screens, checks UX, verifies blockchain data is real (not mock).
 * Run: npx playwright test test-results/e2e-tests.js --reporter=json
 * Or directly: node test-results/e2e-tests.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'https://goodswap.goodclaw.org';
const EXPLORER_URL = 'https://explorer.goodclaw.org';
const RESULTS_FILE = path.join(__dirname, 'e2e-results.jsonl');

function logResult(test) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...test
  });
  fs.appendFileSync(RESULTS_FILE, line + '\n');
  const icon = test.passed ? '✅' : '❌';
  console.log(`${icon} ${test.page} — ${test.check}: ${test.detail || ''}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  
  let totalTests = 0;
  let passed = 0;
  let failed = 0;

  // ═══ TEST 1: Homepage / Swap Page ═══
  try {
    const page = await context.newPage();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    
    totalTests++;
    if (title && title.length > 0) {
      passed++;
      logResult({ page: 'home', check: 'page_loads', passed: true, detail: title });
    } else {
      failed++;
      logResult({ page: 'home', check: 'page_loads', passed: false, detail: 'Empty title' });
    }

    // Check for error banners
    totalTests++;
    const errorBanner = await page.$('[class*="error"], [class*="Error"], [role="alert"]');
    if (!errorBanner) {
      passed++;
      logResult({ page: 'home', check: 'no_errors', passed: true });
    } else {
      failed++;
      const errorText = await errorBanner.textContent();
      logResult({ page: 'home', check: 'no_errors', passed: false, detail: errorText });
    }

    // Check swap card is present
    totalTests++;
    const swapCard = await page.$('button, [class*="swap"], [class*="Swap"]');
    logResult({ page: 'home', check: 'swap_ui_present', passed: !!swapCard, detail: swapCard ? 'Found' : 'Missing' });
    if (swapCard) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++;
    failed++;
    logResult({ page: 'home', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 2: Stocks Page ═══
  try {
    const page = await context.newPage();
    await page.goto(`${FRONTEND_URL}/stocks`, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const mockCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMockKeyword: /mock|placeholder|dummy|hardcoded/i.test(text),
        hasStockData: /AAPL|GOOGL|MSFT|TSLA|price|market cap/i.test(text),
        bodyLength: text.length
      };
    });
    
    if (mockCheck.hasMockKeyword) {
      failed++;
      logResult({ page: 'stocks', check: 'no_mock_data', passed: false, detail: 'Found mock/placeholder text' });
    } else {
      passed++;
      logResult({ page: 'stocks', check: 'no_mock_data', passed: true });
    }

    totalTests++;
    logResult({ page: 'stocks', check: 'has_content', passed: mockCheck.bodyLength > 100, detail: `${mockCheck.bodyLength} chars` });
    if (mockCheck.bodyLength > 100) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'stocks', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 3: Predict Page ═══
  try {
    const page = await context.newPage();
    await page.goto(`${FRONTEND_URL}/predict`, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const content = await page.evaluate(() => document.body.innerText);
    const hasPredictContent = /market|predict|yes|no|probability/i.test(content);
    logResult({ page: 'predict', check: 'has_market_data', passed: hasPredictContent, detail: hasPredictContent ? 'Markets visible' : 'No market content' });
    if (hasPredictContent) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'predict', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 4: Perps Page ═══
  try {
    const page = await context.newPage();
    await page.goto(`${FRONTEND_URL}/perps`, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const content = await page.evaluate(() => document.body.innerText);
    const hasMockPrices = /\$0\.00|NaN|undefined|null/i.test(content);
    logResult({ page: 'perps', check: 'no_broken_prices', passed: !hasMockPrices, detail: hasMockPrices ? 'Found $0.00/NaN/undefined' : 'Prices look real' });
    if (!hasMockPrices) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'perps', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 5: Explorer ═══
  try {
    const page = await context.newPage();
    await page.goto(EXPLORER_URL, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const title = await page.title();
    logResult({ page: 'explorer', check: 'page_loads', passed: title.length > 0, detail: title });
    if (title.length > 0) passed++; else failed++;

    // Check explorer shows real blocks
    totalTests++;
    const content = await page.evaluate(() => document.body.innerText);
    const hasBlocks = /block|transaction/i.test(content);
    logResult({ page: 'explorer', check: 'shows_blocks', passed: hasBlocks });
    if (hasBlocks) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'explorer', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 6: Explorer Address Page (Tester Alpha) ═══
  try {
    const page = await context.newPage();
    await page.goto(`${EXPLORER_URL}/address/0x70997970C51812dc3A010C7d01b50e0d17dc79C8`, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const hasError = await page.evaluate(() => {
      return /something went wrong|error/i.test(document.body.innerText);
    });
    logResult({ page: 'explorer/address', check: 'no_error_banner', passed: !hasError, detail: hasError ? 'Error visible' : 'Clean' });
    if (!hasError) passed++; else failed++;

    // Check transactions are visible
    totalTests++;
    const hasTxs = await page.evaluate(() => {
      return /0x[a-f0-9]{8,}/i.test(document.body.innerText);
    });
    logResult({ page: 'explorer/address', check: 'transactions_visible', passed: hasTxs });
    if (hasTxs) passed++; else failed++;

    await page.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'explorer/address', check: 'page_loads', passed: false, detail: e.message });
  }

  // ═══ TEST 7: Mobile Responsiveness ═══
  try {
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 812 }); // iPhone
    await mobilePage.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });

    totalTests++;
    const isResponsive = await mobilePage.evaluate(() => {
      const body = document.body;
      return body.scrollWidth <= window.innerWidth + 10; // allow small margin
    });
    logResult({ page: 'mobile', check: 'no_horizontal_scroll', passed: isResponsive });
    if (isResponsive) passed++; else failed++;

    await mobilePage.close();
  } catch (e) {
    totalTests++; failed++;
    logResult({ page: 'mobile', check: 'responsive', passed: false, detail: e.message });
  }

  await browser.close();

  // Summary
  const summary = {
    timestamp: new Date().toISOString(),
    total: totalTests,
    passed,
    failed,
    passRate: ((passed / totalTests) * 100).toFixed(1) + '%'
  };
  
  console.log(`\n══ E2E Summary: ${passed}/${totalTests} passed (${summary.passRate}) ══`);
  
  // Write summary
  fs.writeFileSync(
    path.join(__dirname, 'e2e-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return summary;
}

run().catch(console.error);
