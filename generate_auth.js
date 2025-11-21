import { chromium } from '@playwright/test';

(async () => {
  // 1. Launch browser with "AutomationControlled" disabled to avoid Google detection
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // 2. Go to Google and wait for you to log in manually
  console.log('🔓 Opening Google Login...');
  console.log('👉 Please log in manually in the browser window.');

  // Navigate to Google Sign-in
  await page.goto('https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin');

  // 3. Wait for a successful login (redirect to myaccount)
  try {
    // 10 minute timeout to allow for 2FA if needed
    await page.waitForURL('https://myaccount.google.com/?*', { timeout: 600000 });
  } catch (e) {
    console.log('⚠️ Timeout reached or navigation differed. Saving state anyway...');
  }

  // 4. Save the storage state (Cookies & Local Storage)
  await context.storageState({ path: 'auth.json' });
  console.log('✅ Login session saved to "auth.json"');

  await browser.close();
})();