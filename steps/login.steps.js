// steps/login.steps.js
import { Given, When, Then } from '@cucumber/cucumber';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';

dotenv.config();

Given('I am on the login page', async function () {
  this.loginPage = new LoginPage(this.page);     // 👈 use page from hooks
  await this.loginPage.goto();
});

When('I login with valid credentials', async function () {
  await this.loginPage.login(process.env.USERNAME, process.env.PASSWORD);
});

Then('I am able to navigate to the creator panel dashboard', async function () {
  await this.loginPage.navigateToCreatorPanel();

  const visible = await this.loginPage.isRevenueReportVisible();
  if (!visible) {
    throw new Error('Navigation failed — "Revenue Report" not visible on page');
  }
});
