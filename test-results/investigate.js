#!/usr/bin/env node
/**
 * Investigation script for GOO-180 (explorer error banner) and mobile scroll
 */
const { chromium } = require('playwright');

const FRONTEND_URL = 'https://goodswap.goodclaw.org';
const EXPLORER_URL = 'https://explorer.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // === INVESTIGATION 1: Explorer address error banner ===
  console.log('\n=== EXPLORER ADDRESS ERROR INVESTIGATION ===');
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(`${EXPLORER_URL}/address/0x70997970C51812dc3A010C7d01b50e0d17dc79C8`, { waitUntil: 'networkidle', timeout: 30000 });

    // Get all text and find the "error" match context
    const errorContext = await page.evaluate(() => {
      const text = document.body.innerText;
      const idx = text.toLowerCase().indexOf('error');
      if (idx === -1) return { found: false };
      return {
        found: true,
        snippet: text.slice(Math.max(0, idx - 100), idx + 200),
        fullLength: text.length
      };
    });
    console.log('Error match:', JSON.stringify(errorContext, null, 2));

    // Check for actual error alert elements
    const errorElements = await page.evaluate(() => {
      const selectors = ['[class*="error"]', '[role="alert"]', '.toast', '.notification'];
      return selectors.map(sel => {
        const els = document.querySelectorAll(sel);
        return { selector: sel, count: els.length, texts: Array.from(els).slice(0, 3).map(e => e.textContent && e.textContent.trim().slice(0, 100)) };
      });
    });
    console.log('Error elements:', JSON.stringify(errorElements, null, 2));

    await page.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/explorer-address-error-investigate.png' });
    await context.close();
  } catch (e) {
    console.log('Error:', e.message);
  }

  // === INVESTIGATION 2: Mobile scroll detail ===
  console.log('\n=== MOBILE SCROLL INVESTIGATION ===');
  try {
    const context2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 812 } });
    const page2 = await context2.newPage();
    await page2.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const scrollData = await page2.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const offenders = all.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 5 && el.offsetParent !== null;
      }).slice(0, 10).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className && el.className.toString().slice(0, 60),
        right: Math.round(el.getBoundingClientRect().right),
        width: Math.round(el.getBoundingClientRect().width)
      }));
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        overflow: document.body.scrollWidth - window.innerWidth,
        offenders
      };
    });
    console.log('Scroll data:', JSON.stringify(scrollData, null, 2));

    await page2.screenshot({ path: '/home/goodclaw/gooddollar-l2/test-results/screenshots/mobile-scroll-investigate.png' });
    await context2.close();
  } catch (e) {
    console.log('Mobile error:', e.message);
  }

  await browser.close();
}

run().catch(console.error);
