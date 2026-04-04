#!/usr/bin/env node
const { chromium } = require('playwright');
const FRONTEND_URL = 'https://goodswap.goodclaw.org';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  const cssLoaded = [];
  const cssErrors = [];
  page.on('response', res => {
    if (res.url().includes('.css')) {
      cssLoaded.push(`${res.status()} ${res.url().split('/').pop().split('?')[0]}`);
      if (res.status() !== 200) cssErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto(FRONTEND_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);

  console.log('CSS responses:');
  cssLoaded.forEach(c => console.log(' ', c));
  if (cssErrors.length) console.log('CSS ERRORS:', cssErrors);

  // Check computed style of the desktop nav
  const navStyle = await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('nav'));
    return navs.map(nav => ({
      classAttr: nav.className.slice(0, 80),
      computedDisplay: window.getComputedStyle(nav).display,
      childCount: nav.children.length,
    }));
  });
  console.log('\nNav elements computed styles:');
  navStyle.forEach(n => console.log(' ', JSON.stringify(n)));

  // Check the specific Activity link
  const activityLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const activity = links.filter(l => l.textContent.includes('Activity'));
    return activity.map(a => ({
      text: a.textContent.trim().slice(0, 20),
      cls: a.className.slice(0, 80),
      display: window.getComputedStyle(a).display,
      parentDisplay: a.parentElement ? window.getComputedStyle(a.parentElement).display : 'N/A',
      grandparentDisplay: a.parentElement && a.parentElement.parentElement
        ? window.getComputedStyle(a.parentElement.parentElement).display : 'N/A',
      offsetParentTag: a.offsetParent ? a.offsetParent.tagName : 'null',
      right: Math.round(a.getBoundingClientRect().right),
    }));
  });
  console.log('\nActivity link(s):');
  activityLink.forEach(l => console.log(' ', JSON.stringify(l)));

  // Check sm breakpoint is applied
  const smCheck = await page.evaluate(() => {
    // Create a test element to see if sm breakpoint works
    const el = document.createElement('div');
    el.className = 'hidden sm:block test-sm';
    el.style.position = 'absolute';
    el.style.top = '-9999px';
    document.body.appendChild(el);
    const display = window.getComputedStyle(el).display;
    document.body.removeChild(el);
    return { display, viewport: window.innerWidth };
  });
  console.log('\nSm breakpoint test (should be "none" at 375px):', smCheck);

  await browser.close();
}

run().catch(console.error);
