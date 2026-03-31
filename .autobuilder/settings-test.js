const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Test settings panel edge cases
  await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open settings - click the gear icon (aria-label="Settings")
  const settingsBtn = await page.$('button[aria-label="Settings"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.autobuilder/screenshots/settings-panel.png', fullPage: true });

    // Test: set deadline to 0
    const deadlineInput = await page.$('input[inputmode="numeric"]');
    if (deadlineInput) {
      await deadlineInput.fill('0');
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.autobuilder/screenshots/settings-deadline-zero.png', fullPage: true });
      console.log('Deadline set to 0');

      // Test: set deadline to negative
      await deadlineInput.fill('-5');
      await page.waitForTimeout(300);
      const deadlineVal = await deadlineInput.inputValue();
      console.log(`Deadline after -5: "${deadlineVal}"`);

      // Test: set deadline to very large
      await deadlineInput.fill('99999');
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.autobuilder/screenshots/settings-deadline-huge.png', fullPage: true });
      console.log('Deadline set to 99999');
    }

    // Test: set custom slippage to 100
    const customInput = await page.$('input[placeholder="Custom"]');
    if (customInput) {
      await customInput.fill('100');
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.autobuilder/screenshots/settings-slippage-100.png', fullPage: true });
      console.log('Slippage set to 100%');

      // Test: set custom slippage to 50
      await customInput.fill('50');
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.autobuilder/screenshots/settings-slippage-50.png', fullPage: true });
      console.log('Slippage set to 50%');
    }
  } else {
    console.log('Settings button not found');
  }

  // Test: footer links
  console.log('\n=== Footer links ===');
  await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const footerLinks = await page.$$('footer a');
  for (const link of footerLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  ${text}: href="${href}"`);
  }

  await browser.close();
  console.log('\nDONE');
})();
