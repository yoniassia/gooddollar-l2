import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/home/goodclaw/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const results = [];

async function test(name, fn) {
  try {
    const r = await fn();
    results.push({ name, status: 'PASS', detail: r || '' });
  } catch (e) {
    results.push({ name, status: 'FAIL', detail: e.message });
  }
}

await page.goto('http://localhost:3100/', { waitUntil: 'networkidle', timeout: 30000 });

const inputSelector = 'input[placeholder="0"]:first-of-type';

// Test 1: Very long numeric string (20+ chars)
await test('Very long numeric input (25 digits)', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('1234567890123456789012345');
  const value = await input.inputValue();
  return `Value: "${value}" (length: ${value.length})`;
});

// Test 2: Leading zeros
await test('Leading zeros input', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('000123');
  const value = await input.inputValue();
  return `Value: "${value}" - leading zeros ${value.startsWith('000') ? 'NOT stripped' : 'stripped'}`;
});

// Test 3: Multiple decimal points
await test('Multiple decimal points', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('1.2.3.4');
  const value = await input.inputValue();
  return `Value: "${value}"`;
});

// Test 4: Special characters / letters
await test('Special characters input (abc!@#)', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('abc!@#$%^&*()');
  const value = await input.inputValue();
  return `Value: "${value}" (should be empty/sanitized)`;
});

// Test 5: Negative number
await test('Negative number input', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('-100');
  const value = await input.inputValue();
  return `Value: "${value}"`;
});

// Test 6: Very small decimal
await test('Very small decimal (0.0000001)', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('0.0000001');
  const value = await input.inputValue();
  // Check output value
  const outputEl = page.locator('input[placeholder="0"]').nth(1);
  const output = await outputEl.inputValue();
  return `Input: "${value}", Output: "${output}"`;
});

// Test 7: Very large number  
await test('Very large number (999999999999)', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('999999999999');
  const value = await input.inputValue();
  const outputEl = page.locator('input[placeholder="0"]').nth(1);
  const output = await outputEl.inputValue();
  await page.screenshot({ path: '.autobuilder/screenshots/edge-large-number.png', fullPage: true });
  return `Input: "${value}", Output: "${output}"`;
});

// Test 8: Just a decimal point
await test('Just a decimal point "."', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('.');
  const value = await input.inputValue();
  return `Value: "${value}"`;
});

// Test 9: Decimal with no leading zero "." then digits
await test('Decimal starting with dot ".5"', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('.5');
  const value = await input.inputValue();
  const outputEl = page.locator('input[placeholder="0"]').nth(1);
  const output = await outputEl.inputValue();
  return `Input: "${value}", Output: "${output}"`;
});

// Test 10: Zero input
await test('Zero input "0"', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('');
  await input.type('0');
  const value = await input.inputValue();
  // Check if swap button shows "Enter an Amount" 
  const buttonText = await page.locator('button:has-text("Enter an Amount"), button:has-text("Swap"), button:has-text("Connect")').first().textContent();
  return `Value: "${value}", Button: "${buttonText}"`;
});

// Test 11: Pasting text
await test('Paste mixed text "abc123.456def"', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('abc123.456def');
  const value = await input.inputValue();
  return `Value: "${value}" (should be "123.456")`;
});

// Test 12: Token selector - select same token for both
await test('Token selector - open/close dropdown', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('100');
  await page.waitForTimeout(300);
  
  // Click on input token selector
  const tokenBtns = page.locator('button:has-text("ETH"), button:has-text("G$"), button:has-text("USDC")');
  const firstTokenBtn = tokenBtns.first();
  await firstTokenBtn.click();
  await page.waitForTimeout(200);
  
  // Check if dropdown is visible
  const dropdown = page.locator('.absolute.top-full');
  const isVisible = await dropdown.isVisible().catch(() => false);
  
  // Click outside to close
  await page.locator('h2:has-text("Swap")').click();
  await page.waitForTimeout(200);
  const isHidden = !(await dropdown.isVisible().catch(() => true));
  
  return `Dropdown visible after click: ${isVisible}, hidden after outside click: ${isHidden}`;
});

// Test 13: Rapid flip button clicks
await test('Rapid flip button clicks', async () => {
  const flipBtn = page.locator('button svg path[d*="M7 16V4"]').locator('..');
  const flipButton = flipBtn.locator('..');
  
  // Get initial tokens
  const tokenBtns = page.locator('[class*="min-w-"]');
  const inputTokenBefore = await tokenBtns.first().textContent();
  
  // Click flip 5 times rapidly
  for (let i = 0; i < 5; i++) {
    await flipButton.click({ delay: 0 });
  }
  await page.waitForTimeout(300);
  
  const inputTokenAfter = await tokenBtns.first().textContent();
  return `Before: "${inputTokenBefore}", After 5 flips: "${inputTokenAfter}"`;
});

// Test 14: Screenshot after edge cases
await test('Edge case: enter amount then clear', async () => {
  const input = page.locator(inputSelector).first();
  await input.fill('100');
  await page.waitForTimeout(200);
  const outputBefore = await page.locator('input[placeholder="0"]').nth(1).inputValue();
  
  await input.fill('');
  await page.waitForTimeout(200);
  const outputAfter = await page.locator('input[placeholder="0"]').nth(1).inputValue();
  
  return `Output with 100: "${outputBefore}", Output after clear: "${outputAfter}"`;
});

// Test 15: Check mobile viewport
await test('Mobile viewport rendering', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '.autobuilder/screenshots/edge-mobile.png', fullPage: true });
  
  // Check if the nav is hidden on mobile
  const nav = page.locator('nav.hidden');
  const navHidden = await nav.count();
  
  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  return `Nav hidden on mobile: ${navHidden > 0}`;
});

// Test 16: Check console errors
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
results.push({ name: 'Console errors on load', status: consoleErrors.length ? 'WARN' : 'PASS', detail: consoleErrors.join('; ') || 'None' });

// Final summary
console.log('\n=== EDGE CASE TEST RESULTS ===\n');
for (const r of results) {
  console.log(`[${r.status}] ${r.name}`);
  if (r.detail) console.log(`       ${r.detail}`);
}
console.log(`\n${results.filter(r => r.status === 'PASS').length} passed, ${results.filter(r => r.status === 'FAIL').length} failed, ${results.filter(r => r.status === 'WARN').length} warnings`);

await browser.close();
