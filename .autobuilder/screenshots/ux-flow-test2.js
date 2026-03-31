const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const dir = '.autobuilder/screenshots';
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // SCENARIO 1: New user explores the app
  console.log('\n=== SCENARIO 1: New user arrives ===');
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heroText = await page.textContent('h1');
  console.log(`Hero: "${heroText}"`);
  console.log(`Footer links:`, await page.$$eval('footer a', els => els.map(e => `${e.textContent}→${e.href}`)));
  
  // SCENARIO 2: User enters a swap amount
  console.log('\n=== SCENARIO 2: Swap flow ===');
  const payInput = await page.locator('input[inputmode="decimal"]').first();
  await payInput.click();
  await payInput.fill('100');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/flow-swap-100.png` });
  
  // Check the output amount (it's a span, not an input)
  const outputText = await page.locator('[data-testid="output-usd"]').textContent().catch(() => 'NOT FOUND');
  console.log(`Output USD after entering 100 ETH: ${outputText}`);
  
  // Check if rate shows
  const rateVisible = await page.locator('text=Rate').isVisible();
  console.log(`Rate visible: ${rateVisible}`);
  
  // Check swap details
  const detailsVisible = await page.locator('text=Minimum received').isVisible().catch(() => false);
  console.log(`Swap details visible: ${detailsVisible}`);

  // SCENARIO 2b: Open token selector
  console.log('\n--- Token selector ---');
  // The token selector button should have the token name in it
  const tokenBtns = await page.$$eval('button', btns => 
    btns.filter(b => b.textContent?.includes('ETH') || b.textContent?.includes('G$'))
      .map(b => ({ text: b.textContent?.trim(), rect: b.getBoundingClientRect() }))
  );
  console.log(`Token buttons: ${JSON.stringify(tokenBtns)}`);
  
  // Click the first token selector (ETH)
  await page.locator('button:has-text("ETH")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/flow-token-modal.png` });
  
  // Check if a modal/dialog appeared
  const hasDialog = await page.locator('[role="dialog"]').count();
  const hasFixed = await page.locator('.fixed.inset-0, .fixed.top-0').count();
  console.log(`Dialog elements: ${hasDialog}, Fixed overlays: ${hasFixed}`);
  
  // Search in token selector
  const searchInput = await page.locator('input[placeholder*="earch"]');
  const searchCount = await searchInput.count();
  console.log(`Search inputs visible: ${searchCount}`);
  
  if (searchCount > 0) {
    await searchInput.first().fill('USDC');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/flow-token-search.png` });
    
    // Count visible token options
    const tokenOptions = await page.$$eval('button', btns => 
      btns.filter(b => b.textContent?.includes('USDC')).length
    );
    console.log(`USDC options found: ${tokenOptions}`);
  }
  
  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // SCENARIO 2c: Settings
  console.log('\n--- Settings ---');
  // Settings gear should be near the swap heading
  const gearBtn = await page.locator('button[aria-label*="etting"]').first().count() > 0
    ? page.locator('button[aria-label*="etting"]').first()
    : null;
  
  if (!gearBtn) {
    // Try finding it by proximity - look for small icon button near "Swap" header
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      if (ariaLabel) console.log(`  Button with aria-label: "${ariaLabel}"`);
    }
  }
  
  // Try clicking settings via different selector
  const settingsBtn = await page.locator('button').filter({ has: page.locator('svg') }).all();
  for (const btn of settingsBtn) {
    const box = await btn.boundingBox();
    if (box && box.y < 300 && box.x > 500 && box.width < 50) {
      console.log(`Clicking settings-like button at (${box.x.toFixed(0)}, ${box.y.toFixed(0)})`);
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${dir}/flow-settings.png` });
      await page.keyboard.press('Escape');
      break;
    }
  }

  // SCENARIO 3: Explore tokens
  console.log('\n=== SCENARIO 3: Explore tokens ===');
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Search for a token
  const exploreSearch = await page.locator('input[placeholder*="earch"]').first();
  await exploreSearch.fill('LINK');
  await page.waitForTimeout(300);
  const rowsAfterSearch = await page.$$eval('tbody tr', rows => rows.length);
  console.log(`Rows after searching "LINK": ${rowsAfterSearch}`);
  await page.screenshot({ path: `${dir}/flow-explore-search.png` });
  
  // Clear and check full list
  await exploreSearch.fill('');
  await page.waitForTimeout(300);
  const allRows = await page.$$eval('tbody tr', rows => rows.length);
  console.log(`Total token rows: ${allRows}`);
  
  // Test: Can user click a token row to initiate a swap?
  const firstRowCursor = await page.$eval('tbody tr:first-child', el => getComputedStyle(el).cursor);
  console.log(`First row cursor: "${firstRowCursor}"`);
  
  const firstRowOnClick = await page.$eval('tbody tr:first-child', el => el.getAttribute('onclick') || el.style.cursor);
  console.log(`First row onClick/cursor: "${firstRowOnClick}"`);
  
  // Click the first row and see what happens
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(500);
  const urlAfterRowClick = page.url();
  console.log(`URL after clicking token row: ${urlAfterRowClick}`);
  await page.screenshot({ path: `${dir}/flow-explore-row-click.png` });
  
  // Test sorting
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('th:has-text("Price")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/flow-explore-sort.png` });
  
  // SCENARIO 4: Activity / Transaction History
  console.log('\n=== SCENARIO 4: Activity panel ===');
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Find the activity button (clock icon in header)
  const headerButtonsList = await page.$$eval('header button, header a', els => 
    els.map(e => ({ tag: e.tagName, text: e.textContent?.trim(), ariaLabel: e.getAttribute('aria-label'), title: e.getAttribute('title') }))
  );
  console.log('Header buttons:', JSON.stringify(headerButtonsList));
  
  // Click the activity button
  const activityBtn = await page.locator('header button').all();
  for (const btn of activityBtn) {
    const text = await btn.textContent();
    const ariaLabel = await btn.getAttribute('aria-label');
    if (!text?.includes('Connect') && !text?.includes('Swap') && !text?.includes('Explore')) {
      console.log(`Clicking header button: text="${text?.trim()}" aria="${ariaLabel}"`);
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${dir}/flow-activity.png` });
      break;
    }
  }
  
  // Check what's visible - transaction panel
  const panelContent = await page.locator('text=Recent Activity, text=Transaction, text=No transactions').first().textContent().catch(() => 'NOT FOUND');
  console.log(`Activity panel content: ${panelContent}`);

  // SCENARIO 5: Mobile responsive
  console.log('\n=== SCENARIO 5: Mobile ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${dir}/flow-mobile-home.png`, fullPage: true });
  
  // Check if navigation is accessible on mobile
  const navLinks = await page.$$eval('nav a, header a', els => els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim()));
  console.log(`Visible nav links on mobile: ${JSON.stringify(navLinks)}`);
  
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${dir}/flow-mobile-explore.png`, fullPage: true });
  
  // Check horizontal overflow on explore table
  const tableOverflows = await page.$eval('table', el => {
    const parent = el.parentElement;
    return {
      tableWidth: el.scrollWidth,
      containerWidth: parent?.clientWidth || 0,
      overflows: el.scrollWidth > (parent?.clientWidth || 0)
    };
  }).catch(() => 'TABLE NOT FOUND');
  console.log(`Table overflow on mobile: ${JSON.stringify(tableOverflows)}`);

  console.log(`\nConsole errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ERROR: ${e.substring(0, 200)}`));
  
  await browser.close();
  console.log('\n=== Done ===');
})();
