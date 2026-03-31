import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/home/goodclaw/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const urls = [
  ['http://localhost:3100/', 'home'],
  ['http://localhost:3100/nonexistent', 'not-found'],
];

for (const [url, name] of urls) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `.autobuilder/screenshots/${name}.png`, fullPage: true });
  console.log(`Screenshot saved: ${name}.png`);
}

await browser.close();
console.log('Done');
