// features/support/hooks.js
import { BeforeAll, AfterAll, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';

setDefaultTimeout(60 * 1000); // 60s default per step

let browser;

// ------------------------
// 🔵 Global Hooks
// ------------------------

BeforeAll(async function () {
  console.log('🔵 BeforeAll: Launching browser...');
  browser = await chromium.launch({
    headless: false,                // you can flip to true in CI
    args: ['--start-maximized'],
  });
});

Before(async function () {
  console.log('🟢 Before: Creating new context + page for scenario');

  this.context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();
});

After(async function (scenario) {
  console.log(`🔴 After: Closing context (scenario status: ${scenario.result?.status})`);

  // screenshot on failure
  if (scenario.result?.status === 'FAILED' && this.page) {
    await this.page.screenshot({
      path: `./screenshots/FAILED-${Date.now()}.png`,
      fullPage: true,
    });
    console.log('📸 Saved failure screenshot');
  }

  if (this.context) {
    await this.context.close();
  }
});

AfterAll(async function () {
  console.log('🔵 AfterAll: Closing browser...');
  if (browser) {
    await browser.close();
  }
});
