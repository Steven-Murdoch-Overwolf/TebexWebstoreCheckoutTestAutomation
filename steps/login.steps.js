import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';

dotenv.config();

let browser, context, page, loginPage;

Before(async () => {
  browser = await chromium.launch({ headless: false });
  context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  page = await context.newPage();
  loginPage = new LoginPage(page);
});

After(async () => {
  await browser.close();
});

Given('I am on the login page', async () => {
  await loginPage.goto();
});

When('I login with valid credentials', async () => {
  await loginPage.login(process.env.USERNAME, process.env.PASSWORD);
});

Then('I am able to navigate to the creator panel dashboard', async () => {
  await loginPage.navigateToCreatorPanel();

  const visible = await loginPage.isRevenueReportVisible();
  if (!visible) {
    throw new Error('Navigation failed — "Revenue Report" not visible on page');
  }
});