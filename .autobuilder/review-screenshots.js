const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const pages = [
    { url: 'http://localhost:3100', name: 'home' },
    { url: 'http://localhost:3100/explore', name: 'explore' },
    { url: 'http://localhost:3100/nonexistent-page', name: '404' },
    { url: 'http://localhost:3100/?token=XYZNOTREAL', name: 'invalid-token' },
  ];

  for (const p of pages) {
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `.autobuilder/screenshots/${p.name}.png`, fullPage: true });
      console.log(`OK: ${p.name} - ${p.url}`);
    } catch (e) {
      console.log(`FAIL: ${p.name} - ${e.message}`);
    }
  }

  // Test explore page with nonsense search
  try {
    await page.goto('http://localhost:3100/explore', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('input[placeholder="Search tokens..."]', 'xyzabc123nonsense');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.autobuilder/screenshots/explore-empty-search.png', fullPage: true });
    console.log('OK: explore-empty-search');
  } catch (e) {
    console.log(`FAIL: explore-empty-search - ${e.message}`);
  }

  // Check what happens with empty swap input
  try {
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Try clicking swap without entering amount
    const swapBtn = await page.$('button:has-text("Connect Wallet"), button:has-text("Swap"), button:has-text("Enter")');
    if (swapBtn) {
      await swapBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.autobuilder/screenshots/home-empty-swap.png', fullPage: true });
      console.log('OK: home-empty-swap');
    } else {
      console.log('SKIP: no swap/connect button found');
    }
  } catch (e) {
    console.log(`FAIL: home-empty-swap - ${e.message}`);
  }

  await browser.close();
  console.log('DONE');
})();
