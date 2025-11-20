// steps/checkout.steps.js
import { When, Then } from '@cucumber/cucumber';
import Checkout from '../pages/Checkout.js';

let checkoutPage;

Then('I complete the package payment details and click Pay', async function () {
  checkoutPage = new Checkout(this.page);
  console.log('🧾 Starting to fill payment details...');
  await checkoutPage.fillPaymentDetailsForPackage();
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

When(/^I enter a valid coupon$/, async function () {
  console.log('🧾 Entering coupon...');
  checkoutPage = new Checkout(this.page);
  await checkoutPage.enterCoupon();
});

  When(/^I complete the Google Pay package payment details and click Pay$/, async function () {
    console.log('🧾 Entering coupon...');
    checkoutPage = new Checkout(this.page);
    await checkoutPage.fillPaymentDetailsForGooglePay();
});

  When(/^confirm Google Pay is selected$/, async function () {
    console.log('🧾 Entering coupon...');
    checkoutPage = new Checkout(this.page);
    await checkoutPage.confirmGooglePaySelected();
  });