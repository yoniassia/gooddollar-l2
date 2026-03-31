const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE_ERROR: ${err.message}`));

  // Test 1: Pool link (grayed out in nav)
  console.log('\n=== Test 1: Click Pool nav link ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const poolLink = await page.$('a:has-text("Pool"), button:has-text("Pool")');
    if (poolLink) {
      const href = await poolLink.getAttribute('href');
      const isDisabled = await poolLink.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.pointerEvents === 'none' || style.opacity < 0.5 || el.getAttribute('aria-disabled') === 'true';
      });
      console.log(`  Pool link href: ${href}, appears disabled: ${isDisabled}`);
      await poolLink.click({ force: true });
      await page.waitForTimeout(1000);
      const url = page.url();
      console.log(`  After click URL: ${url}`);
      await page.screenshot({ path: '.autobuilder/screenshots/pool-click.png', fullPage: true });
    } else {
      console.log('  Pool link not found');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 2: Bridge link (grayed out in nav)
  console.log('\n=== Test 2: Click Bridge nav link ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const bridgeLink = await page.$('a:has-text("Bridge"), button:has-text("Bridge")');
    if (bridgeLink) {
      const href = await bridgeLink.getAttribute('href');
      console.log(`  Bridge link href: ${href}`);
      await bridgeLink.click({ force: true });
      await page.waitForTimeout(1000);
      const url = page.url();
      console.log(`  After click URL: ${url}`);
      await page.screenshot({ path: '.autobuilder/screenshots/bridge-click.png', fullPage: true });
    } else {
      console.log('  Bridge link not found');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 3: Activity button with no transactions
  console.log('\n=== Test 3: Activity button (clock icon) ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const activityBtn = await page.$('[aria-label*="ctivit"], button:has(svg)');
    // Try to find the clock/activity button - it's likely a button with a clock icon
    const buttons = await page.$$('header button, nav button');
    console.log(`  Found ${buttons.length} header buttons`);
    for (const btn of buttons) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`    Button: text="${text?.trim()}", aria-label="${ariaLabel}"`);
    }
    // Click the clock-looking button (activity)
    const clockBtn = await page.$('button[aria-label*="ctivit"], button[aria-label*="ransaction"], button[title*="ctivit"]');
    if (clockBtn) {
      await clockBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/activity-empty.png', fullPage: true });
      console.log('  Clicked activity button');
    } else {
      console.log('  Activity button not found by aria-label');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 4: Open swap settings and test edge cases
  console.log('\n=== Test 4: Swap settings edge cases ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    // Click settings gear icon
    const gearBtn = await page.$('button:has(svg), [aria-label*="etting"]');
    const settingsBtns = await page.$$('button');
    for (const btn of settingsBtns) {
      const text = (await btn.textContent())?.trim();
      if (text === '' || text?.includes('⚙') || text?.includes('Settings')) {
        const box = await btn.boundingBox();
        if (box && box.x > 400) { // gear is on the right side
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      }
    }
    await page.screenshot({ path: '.autobuilder/screenshots/settings-open.png', fullPage: true });
    console.log('  Settings opened');
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 5: Direct URL to /pool
  console.log('\n=== Test 5: Direct URL /pool ===');
  try {
    await page.goto('http://localhost:3100/pool', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '.autobuilder/screenshots/pool-direct.png', fullPage: true });
    console.log(`  URL: ${page.url()}`);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 6: Direct URL to /bridge
  console.log('\n=== Test 6: Direct URL /bridge ===');
  try {
    await page.goto('http://localhost:3100/bridge', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '.autobuilder/screenshots/bridge-direct.png', fullPage: true });
    console.log(`  URL: ${page.url()}`);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 7: Token selector - search for nonsense
  console.log('\n=== Test 7: Token selector nonsense search ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    // Click token selector dropdown (the ETH button)
    const tokenBtns = await page.$$('button');
    for (const btn of tokenBtns) {
      const text = (await btn.textContent())?.trim();
      if (text?.includes('ETH') && !text?.includes('Connect') && !text?.includes('Swap')) {
        await btn.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    await page.screenshot({ path: '.autobuilder/screenshots/token-selector-open.png', fullPage: true });
    // Type nonsense in search
    const searchInput = await page.$('input[placeholder*="earch"], input[placeholder*="token"]');
    if (searchInput) {
      await searchInput.fill('zzzznotareal42token');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/token-selector-empty.png', fullPage: true });
      console.log('  Token selector empty search captured');
    } else {
      console.log('  Token selector search input not found');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 8: Swap with large number input
  console.log('\n=== Test 8: Swap with very large number ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const input = await page.$('input[type="text"], input[type="number"], input[inputmode="decimal"]');
    if (input) {
      await input.fill('999999999999999999999999999');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/swap-huge-number.png', fullPage: true });
      console.log('  Large number input captured');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 9: Special characters in explore search
  console.log('\n=== Test 9: Special chars in explore search ===');
  try {
    await page.goto('http://localhost:3100/explore', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const searchInput = await page.$('input[placeholder*="earch"]');
    if (searchInput) {
      await searchInput.fill('<script>alert(1)</script>');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/explore-xss-search.png', fullPage: true });
      console.log('  XSS search captured');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Test 10: Swap input with special characters
  console.log('\n=== Test 10: Swap input with special chars ===');
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const input = await page.$('input[type="text"], input[type="number"], input[inputmode="decimal"]');
    if (input) {
      await input.fill('abc!@#$');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/swap-special-chars.png', fullPage: true });
      const val = await input.inputValue();
      console.log(`  Input value after special chars: "${val}"`);
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // Dump console errors
  console.log('\n=== Console Errors ===');
  if (consoleErrors.length === 0) {
    console.log('  No console errors');
  } else {
    for (const err of consoleErrors) {
      console.log(`  ${err.substring(0, 200)}`);
    }
  }

  await browser.close();
  console.log('\nDONE');
})();
