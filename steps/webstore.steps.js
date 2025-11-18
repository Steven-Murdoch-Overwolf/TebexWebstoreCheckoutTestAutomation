// steps/webstore.steps.js
import { setDefaultTimeout, Given, When, Then } from '@cucumber/cucumber';
import { WebstorePages } from '../pages/WebstorePages.js';
import dotenv from 'dotenv';

dotenv.config();

setDefaultTimeout(60 * 1000); // 60 seconds per step

let webstore;

Given('I am on the Universal Webstore Homepage', async function () {
  // 👇 Use the page created in hooks.js
  webstore = new WebstorePages(this.page);

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

Then('I add a GiftCard Package to the basket', async function () {
  await webstore.addGiftCardPackageToBasket();
});

Then('I add a Sale Package to the basket', async function () {
  await webstore.addSalePackageToBasket();
});

Then('I proceed to checkout', async function () {
  await webstore.ClickProceedToCheckout();
});
