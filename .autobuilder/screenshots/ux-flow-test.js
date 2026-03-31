const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const dir = '.autobuilder/screenshots';

  // SCENARIO 1: New user lands on GoodSwap
  console.log('\n=== SCENARIO 1: New user explores the app ===');
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check: Can they understand the value prop?
  const heroText = await page.textContent('h1');
  console.log(`Hero text: "${heroText}"`);
  
  // Check: What does "How It Works" section say?
  const howItWorks = await page.locator('text=How It Works').isVisible();
  console.log(`"How It Works" visible: ${howItWorks}`);
  
  // Check: Are stats visible and meaningful?
  const statsVisible = await page.locator('text=UBI Distributed').isVisible();
  console.log(`Stats visible: ${statsVisible}`);
  
  // Check footer links
  const footerLinks = await page.$$eval('footer a', els => els.map(e => ({text: e.textContent, href: e.href})));
  console.log(`Footer links: ${JSON.stringify(footerLinks)}`);
  
  // SCENARIO 2: User tries to perform a swap
  console.log('\n=== SCENARIO 2: User attempts a swap ===');
  
  // Try typing an amount in "You pay" input
  const payInput = await page.locator('input[type="text"]').first();
  await payInput.click();
  await payInput.fill('100');
  await page.screenshot({ path: `${dir}/flow-swap-amount-entered.png` });
  console.log('Entered 100 in pay input');
  
  // Check: Does "You receive" populate?
  const receiveValue = await page.locator('input[type="text"]').nth(1).inputValue();
  console.log(`Receive value after entering 100: "${receiveValue}"`);
  
  // Try clicking the flip button (↕)
  const flipButton = await page.locator('button:has(svg)').filter({ hasText: '' });
  const buttons = await page.$$('button');
  console.log(`Total buttons on page: ${buttons.length}`);
  
  // Look for the swap button
  const swapButton = await page.locator('text=Connect Wallet to Swap').isVisible();
  console.log(`"Connect Wallet to Swap" visible: ${swapButton}`);
  
  // Try clicking the token selector (ETH dropdown)
  const tokenButtons = await page.$$('button:has-text("ETH"), button:has-text("G$")');
  console.log(`Token selector buttons found: ${tokenButtons.length}`);
  
  if (tokenButtons.length > 0) {
    await tokenButtons[0].click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${dir}/flow-token-selector-open.png` });
    
    // Check if modal opened
    const modalVisible = await page.locator('[role="dialog"], .fixed').first().isVisible().catch(() => false);
    console.log(`Token selector modal opened: ${modalVisible}`);
    
    // Check search in token selector
    const searchInput = await page.locator('input[placeholder*="earch"]').first().isVisible().catch(() => false);
    console.log(`Token search input visible: ${searchInput}`);
    
    // Close modal - press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  
  // Try the settings gear
  console.log('\n--- Testing Settings ---');
  const gearButton = await page.locator('button[aria-label*="etting"], button:has(svg):near(:text("Swap"))');
  const settingsButtons = await page.$$('[aria-label]');
  for (const btn of settingsButtons) {
    const label = await btn.getAttribute('aria-label');
    if (label) console.log(`  aria-label button: "${label}"`);
  }
  
  // Click the settings/gear icon near the swap card
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const svg = await btn.$('svg');
    const text = await btn.textContent();
    if (svg && text.trim() === '' && await btn.isVisible()) {
      const box = await btn.boundingBox();
      if (box && box.y < 400 && box.x > 600) {
        console.log(`Found gear-like button at x:${box.x.toFixed(0)} y:${box.y.toFixed(0)}`);
        await btn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${dir}/flow-settings-open.png` });
        break;
      }
    }
  }
  
  // SCENARIO 3: User browses Explore page
  console.log('\n=== SCENARIO 3: User explores tokens ===');
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Try searching for a token
  const exploreSearch = await page.locator('input[placeholder*="earch"]').first();
  await exploreSearch.fill('ETH');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/flow-explore-search-eth.png` });
  
  // Count visible rows
  const visibleRows = await page.$$('tbody tr');
  console.log(`Rows visible after searching "ETH": ${visibleRows.length}`);
  
  // Clear search and test sorting
  await exploreSearch.fill('');
  await page.waitForTimeout(300);
  
  // Click on "Price" header to sort
  const priceHeader = await page.locator('text=Price').first();
  await priceHeader.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/flow-explore-sorted-price.png` });
  
  // Can user click on a token row to navigate? Check if rows are clickable
  const firstRow = await page.locator('tbody tr').first();
  const cursor = await firstRow.evaluate(el => window.getComputedStyle(el).cursor);
  console.log(`Token row cursor style: "${cursor}"`);
  
  // Try clicking a token row
  await firstRow.click();
  await page.waitForTimeout(500);
  const currentUrl = page.url();
  console.log(`URL after clicking token row: ${currentUrl}`);
  await page.screenshot({ path: `${dir}/flow-explore-token-click.png` });
  
  // SCENARIO 4: User checks activity/transaction history
  console.log('\n=== SCENARIO 4: User checks transaction history ===');
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Look for activity/history button (clock icon in header)
  const headerButtons = await page.$$('header button, nav button');
  console.log(`Header/nav buttons: ${headerButtons.length}`);
  
  // Try to find and click the activity/clock icon
  for (const btn of await page.$$('button')) {
    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    if (ariaLabel?.includes('ctivit') || ariaLabel?.includes('istory') || title?.includes('ctivit')) {
      console.log(`Found activity button: aria-label="${ariaLabel}" title="${title}"`);
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${dir}/flow-activity-panel.png` });
      break;
    }
  }
  
  // Check for the activity panel by looking for any panel/drawer that appeared
  const panels = await page.$$('.fixed, [role="dialog"]');
  console.log(`Panels/overlays after clicking activity: ${panels.length}`);
  
  // SCENARIO 5: Navigation dead ends
  console.log('\n=== SCENARIO 5: Navigation dead ends ===');
  
  // Navigate to Pool page
  await page.goto('http://localhost:3100/pool', { waitUntil: 'networkidle', timeout: 30000 });
  const poolCTA = await page.locator('text=Back to Swap').isVisible();
  console.log(`Pool page has "Back to Swap": ${poolCTA}`);
  
  // Navigate to Bridge page
  await page.goto('http://localhost:3100/bridge', { waitUntil: 'networkidle', timeout: 30000 });
  const bridgeCTA = await page.locator('text=Back to Swap').isVisible();
  console.log(`Bridge page has "Back to Swap": ${bridgeCTA}`);
  
  // Test 404 page
  await page.goto('http://localhost:3100/nonexistent', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${dir}/flow-404.png` });
  const notFoundText = await page.textContent('body');
  console.log(`404 page content: ${notFoundText.substring(0, 200)}`);
  
  // SCENARIO 6: Mobile viewport test
  console.log('\n=== SCENARIO 6: Mobile viewport ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${dir}/flow-mobile-home.png`, fullPage: true });
  
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${dir}/flow-mobile-explore.png`, fullPage: true });
  
  await browser.close();
  console.log('\n=== Done ===');
})();
