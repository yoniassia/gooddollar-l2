const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const dir = '.autobuilder/screenshots';

  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Click hamburger menu
  const menuBtn = await page.locator('button[aria-label="Open menu"]');
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/flow-mobile-nav-open.png` });
    console.log('Mobile nav opened');
    
    const navLinks = await page.$$eval('[data-testid="mobile-nav"] a', els => 
      els.map(e => e.textContent?.trim())
    );
    console.log(`Mobile nav links: ${JSON.stringify(navLinks)}`);
  } else {
    console.log('No hamburger menu button found');
  }

  // Test: On explore page, does the mobile search work well?
  await page.goto('http://localhost:3100/explore', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Focus search and type
  const search = await page.locator('input[placeholder*="earch"]').first();
  await search.fill('G$');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/flow-mobile-search-gd.png` });
  
  const rows = await page.$$eval('tbody tr', rs => rs.length);
  console.log(`Mobile: G$ search results: ${rows}`);

  // Test: swap page on mobile with amount
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  const payInput = await page.locator('input[inputmode="decimal"]').first();
  await payInput.fill('50');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/flow-mobile-swap-amount.png`, fullPage: true });
  
  // Scroll to see full page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/flow-mobile-swap-scrolled.png` });

  await browser.close();
  console.log('Done');
})();
