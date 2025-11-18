// steps/checkout.steps.js
import { When, Then } from '@cucumber/cucumber';
import Checkout from '../pages/Checkout.js';

let checkoutPage;

Then('I complete the payment details for a Visa Card and click Pay', async function () {
  checkoutPage = new Checkout(this.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetails();
  console.log('✅ Payment step completed.');
});

Then('I complete the full priced package payment details and click Pay', async function () {
  checkoutPage = new Checkout(this.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetailsForFullPricedPackage();
  console.log('✅ Payment step completed.');
});

Then('confirm Test Payment', async function () {
  checkoutPage = new Checkout(this.page);
  await checkoutPage.confirmTestPayment();
});

Then('I am displayed a purchase confirmation message', async function () {
  console.log('🧾 Verifying purchase confirmation...');
  checkoutPage = new Checkout(this.page);
  await checkoutPage.verifyOrderConfirmation();
});

When(/^I enter a valid creator code$/, async function () {
  console.log('🧾 Entering creator code...');
  checkoutPage = new Checkout(this.page);
  await checkoutPage.enterCreatorCode();
});
