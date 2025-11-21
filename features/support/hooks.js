// features/support/hooks.js
import { BeforeAll, AfterAll, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import fs from 'fs'; // 👈 1. Add this import so we can check for the file

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

  // 2. Define your default options here (moved from inside newContext)
  const contextOptions = {
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  };

  // 3. Check if auth.json exists and add it to the options
  if (fs.existsSync('auth.json')) {
    console.log('🍪 Found auth.json — Injecting authenticated Google session!');
    contextOptions.storageState = 'auth.json';
  } else {
    console.log('⚠️ No auth.json found — proceeding as Guest.');
  }

  // 4. Create the context passing in the options we just built
  this.context = await browser.newContext(contextOptions);

  this.page = await this.context.newPage();
});

After(async function (scenario) {
  console.log(`🔴 After: Closing context (scenario status: ${scenario.result?.status})`);

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