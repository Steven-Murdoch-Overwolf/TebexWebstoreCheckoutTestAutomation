// steps/checkout.steps.js
import { When, Then } from '@cucumber/cucumber';
import Checkout from '../pages/Checkout.js';

let checkoutPage;

Then('I complete the payment details for a Visa Card and click Pay', async function () {
  checkoutPage = new Checkout(this.page || global.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetails();
  console.log('✅ Payment step completed.');
});

Then('I complete the full priced package payment details and click Pay', async function () {
  checkoutPage = new Checkout(this.page || global.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetailsForFullPricedPackage();
  console.log('✅ Payment step completed.');
});

Then('I complete the subscription payment details click Pay', async function () {
  checkoutPage = new Checkout(this.page || global.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillSubscriptionPaymentDetails();
  console.log('✅ Subscription Payment step completed.');
});

Then('I complete the gift card payment details for a Visa Card and click Pay', async function () {
  checkoutPage = new Checkout(this.page || global.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetailsForGiftCardPackage();
  console.log('✅ Payment step completed.');
});

  When('confirm Test Payment', async function () {
    console.log('💰 Confirming test payment...');
    checkoutPage = new Checkout(this.page || global.page);
    await checkoutPage.confirmTestPayment();
  });

Then('I am displayed a purchase confirmation message', async function () {
  console.log('🧾 Verifying purchase confirmation...');
  checkoutPage = new Checkout(this.page || global.page);
  await checkoutPage.verifyOrderConfirmation();
});

When(/^I enter a valid creator code$/, async function() {
  console.log('🧾 Entering creator code...');
  checkoutPage = new Checkout(this.page || global.page);
  await checkoutPage.enterCreatorCode();
  });