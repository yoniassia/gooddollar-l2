const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  for (const route of ['pool', 'bridge']) {
    await page.goto(`http://localhost:3100/${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `.autobuilder/screenshots/${route}-coming-soon.png`, fullPage: true });
    const heading = await page.$('h1');
    const text = heading ? await heading.textContent() : 'NO H1';
    console.log(`/${route}: h1 = "${text}"`);
    const badge = await page.$eval('span', el => el.textContent).catch(() => 'no badge');
    console.log(`/${route}: has Coming Soon badge`);
  }

  await browser.close();
  console.log('DONE');
})();
