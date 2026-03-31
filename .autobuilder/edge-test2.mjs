import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/home/goodclaw/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:3100/', { waitUntil: 'networkidle', timeout: 30000 });

const inputField = 'input[placeholder="0"]';

// Test: leading zeros visual
console.log('=== Leading zeros test ===');
const input = page.locator(inputField).first();
await input.fill('007');
await page.waitForTimeout(300);
await page.screenshot({ path: '.autobuilder/screenshots/edge-leading-zeros.png', fullPage: true });
const val = await input.inputValue();
console.log(`Input "007" -> displayed as "${val}"`);

// Test: bare dot with digits after
await input.fill('.');
await page.waitForTimeout(300);
const outputDot = await page.locator(inputField).nth(1).inputValue();
console.log(`Input "." -> output: "${outputDot}"`);

// Test: same token swap (ETH -> ETH) attempt
console.log('\n=== Same token test ===');
await input.fill('100');
await page.waitForTimeout(300);

// Click input token selector (should be ETH)
const inputTokenBtn = page.locator('button:has-text("ETH")').first();
await inputTokenBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: '.autobuilder/screenshots/edge-token-dropdown.png', fullPage: true });

// Check: is G$ excluded from the input selector since it's the output token?
const dropdownItems = await page.locator('.absolute.top-full button').allTextContents();
console.log(`Dropdown items when ETH selected (output is G$): ${JSON.stringify(dropdownItems)}`);

// Try selecting G$ (which is the current output)
const gdOption = page.locator('.absolute.top-full button:has-text("G$")');
if (await gdOption.count() > 0) {
  await gdOption.click();
  await page.waitForTimeout(300);
  // Check if tokens swapped
  const inputTokens = await page.locator('[class*="min-w-"]').allTextContents();
  console.log(`After selecting G$ in input: tokens are ${JSON.stringify(inputTokens)}`);
}

// Test: rate display for same-pair
console.log('\n=== Rate and UBI display test ===');
await input.fill('1');
await page.waitForTimeout(300);
const rateEl = page.locator('text=Rate');
const rateVisible = await rateEl.isVisible().catch(() => false);
console.log(`Rate visible with amount "1": ${rateVisible}`);

// Test: output overflow with very precise number
await input.fill('0.123456789012345678');
await page.waitForTimeout(300);
const preciseVal = await input.inputValue();
const preciseOutput = await page.locator(inputField).nth(1).inputValue();
console.log(`\nPrecise input: "${preciseVal}" -> output: "${preciseOutput}"`);

// Test: UBI breakdown with tiny amounts
await input.fill('0.001');
await page.waitForTimeout(300);
await page.screenshot({ path: '.autobuilder/screenshots/edge-tiny-amount.png', fullPage: true });
const ubiText = await page.locator('[class*="goodgreen"]').allTextContents();
console.log(`\nUBI text with 0.001: ${JSON.stringify(ubiText)}`);

// Test: empty state after clearing
console.log('\n=== Empty state test ===');
await input.fill('');
await page.waitForTimeout(300);
const outputEmpty = await page.locator(inputField).nth(1).inputValue();
console.log(`After clearing: output is "${outputEmpty}", should be empty`);

// Test: check there's no Escape key handling for dropdown
console.log('\n=== Keyboard interaction test ===');
await page.locator('button:has-text("G$")').first().click();
await page.waitForTimeout(200);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const dropdownAfterEsc = await page.locator('.absolute.top-full').isVisible().catch(() => false);
console.log(`Dropdown after Escape: visible=${dropdownAfterEsc} (should be false)`);

// Test: Tab navigation
await input.focus();
await page.keyboard.press('Tab');
await page.waitForTimeout(200);
const focused = await page.evaluate(() => document.activeElement?.tagName + '.' + document.activeElement?.className?.split(' ')[0]);
console.log(`After Tab from input: focused on ${focused}`);

await browser.close();
console.log('\nDone');
