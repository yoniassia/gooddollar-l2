const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const routes = [
    { name: 'home', url: 'http://localhost:3100' },
    { name: 'explore', url: 'http://localhost:3100/explore' },
    { name: 'pool', url: 'http://localhost:3100/pool' },
    { name: 'bridge', url: 'http://localhost:3100/bridge' },
  ];

  for (const route of routes) {
    try {
      await page.goto(route.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: `.autobuilder/screenshots/${route.name}.png`, fullPage: true });
      console.log(`✓ ${route.name}`);
    } catch (e) {
      console.error(`✗ ${route.name}: ${e.message}`);
    }
  }

  await browser.close();
})();
