// steps/webstore.steps.js
import { setDefaultTimeout } from '@cucumber/cucumber';
setDefaultTimeout(60 * 1000); // 60 seconds per step
import { Given, When, Then, AfterAll } from '@cucumber/cucumber'; // ✅ all imported together
import { chromium } from 'playwright';
import { WebstorePages } from '../pages/WebstorePages.js';
import dotenv from 'dotenv';

dotenv.config();

let browser, page, webstore;

Given('I am on the Universal Webstore Homepage', async function () {
  browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'], // open browser maximized
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // force HD desktop layout
  });

  page = await context.newPage();
  global.page = page;
  webstore = new WebstorePages(page);

  const url = process.env.WEBSTORE_URL;
  await webstore.gotoHome(url);
});


When('I select Packages from the sidebar', async function () {
  await webstore.selectSidebarPackages();
});

Then('I add a Full Price Package to the basket', async function () {
  await webstore.addFullPricePackageToBasket();
});

Then('I add a Subscription Package to the basket', async function () {
  await webstore.addSubscriptionPackageToBasket();
});


Then('I proceed to checkout', async function () {
  await webstore.ClickProceedToCheckout();
});

//Teardown
AfterAll(async function () {
  console.log('🧹 Closing browser after all tests...');
  if (browser) {
    await browser.close();
    console.log('✅ Browser closed, tests complete.');
  }
});

  Then('I add a GiftCard Package to the basket', async function () {
    await webstore.addGiftCardPackageToBasket();
  });

  Then('I add a Sale Package to the basket', async function () {
    await webstore.addSalePackageToBasket();

});
