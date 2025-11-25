// pages/WebstorePages.js
import { expect } from '@playwright/test';
import fs from 'fs';

export class WebstorePages {
  constructor(page) {
    this.page = page;
  }

  async gotoHome(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(url);
  }
  async selectSidebarPackages() {
    // Find the sidebar link by name Package

    const sidebarLink = this.page.locator(
      '#site-navigation > ul > li:nth-child(2) > a',
    );

    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();

    // Optional: Confirm that navigation worked
    await expect(this.page).toHaveURL(/\/category\/129/);
  }
  async addFullPricePackageToBasket() {
    // 👇 Use the CSS path you provided
    const fullPricePackageLink = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(1) > div > a',
    );

    // Wait for visibility and click
    await expect(fullPricePackageLink).toBeVisible({ timeout: 10000 });
    await fullPricePackageLink.click();
  }

  async ClickProceedToCheckout() {
    console.log('🛒 Attempting to proceed to checkout...');

    // 1. Check if the Basket Sidebar is actually visible
    // The class '.v-navigation-drawer--active' is standard for open drawers in Vuetify
    const basketDrawer = this.page.locator('.v-navigation-drawer--active');
    const isBasketOpen = await basketDrawer.isVisible().catch(() => false);

    if (!isBasketOpen) {
      console.log('⚠️ Basket sidebar not detected. Attempting to open manually...');

      // Try to find the Basket/Cart icon in the header and click it
      // This is the most reliable way to trigger the drawer if it missed the first time
      const basketTrigger = this.page.locator('a[href*="#basket"], button:has(.mdi-basket)');

      if (await basketTrigger.isVisible()) {
        await basketTrigger.first().click();
        console.log('👆 Clicked Basket icon to force open');
      } else {
        // Fallback: If no icon, just wait a moment, maybe animation is slow
        console.log('⚠️ Basket icon not found. Waiting for animation...');
      }
    }

    // 2. Wait for the "Proceed to Checkout" button to appear
    const checkoutBtn = this.page.getByRole('button', { name: /proceed to checkout/i });

    try {
      await checkoutBtn.waitFor({ state: 'visible', timeout: 15000 });
    } catch (e) {
      // Debugging: If it fails, check if the basket is empty
      const emptyMsg = this.page.getByText('Your basket is empty', { exact: false });
      if (await emptyMsg.isVisible()) {
        throw new Error("❌ Test Failed: The basket is EMPTY. The 'Add to Basket' step likely failed.");
      }
      throw e; // Re-throw original error if it wasn't empty
    }

    // 3. Force Click
    // We use force: true because sometimes the drawer animation is still
    // technically "moving" when we try to click, which blocks standard clicks.
    await checkoutBtn.click({ force: true });
    console.log('✅ Clicked Proceed to Checkout');
  }

  async addSubscriptionPackageToBasket() {
    // 👇 Use the CSS path you provided
    const subscriptionPackageLink = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(2) > div > a',
    );

    // Wait for visibility and click
    await expect(subscriptionPackageLink).toBeVisible({ timeout: 10000 });
    await subscriptionPackageLink.click();
  }

  async addGiftCardPackageToBasket() {
    console.log('🛍️ Adding Gift Card Package to basket...');

    // 1️⃣ Load gift card email from data file
    let giftCardEmail = 'fallback@example.com';
    try {
      const giftCardData = JSON.parse(fs.readFileSync('./data/giftCardEmail.json', 'utf-8'));
      giftCardEmail = giftCardData.giftCardEmail;
      console.log(`📧 Loaded gift card email from data file: ${giftCardEmail}`);
    } catch (err) {
      console.warn('⚠️ Could not read giftCardEmail.json — using fallback email', err);
    }

    // 2️⃣ Click the Gift Card package button
    const giftCardPackageButton = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(3) > div > a'
    );
    await giftCardPackageButton.waitFor({ state: 'visible', timeout: 10000 });
    await giftCardPackageButton.click();
    console.log('✅ Clicked Gift Card Package add-to-basket button');

    // 3️⃣ Wait for modal container to appear (allow animation time)
    const modal = this.page.locator('div.popup.product-options-popup');
    await modal.waitFor({ state: 'visible', timeout: 7000 }).catch(() => null);

    if (!(await modal.isVisible().catch(() => false))) {
      console.log('💤 No Gift Card modal detected after clicking package.');
      return;
    }

    console.log('🎁 Gift Card popup detected — waiting for email input...');

    // 4️⃣ Wait for email input to actually become editable
    const emailInput = this.page.locator('div.popup.product-options-popup input[type="email"], input[placeholder*="email" i]');
    await emailInput.waitFor({ state: 'visible', timeout: 7000 });
    await emailInput.fill('');
    await emailInput.fill(giftCardEmail);
    console.log(`✉️ Filled in gift card email: ${giftCardEmail}`);

    // 5️⃣ Click the Continue button (using your exact CSS selector)
    const continueBtn = this.page.locator('body > div.popup.product-options-popup > div > div > form > div.actions > button');
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await continueBtn.click();
    console.log('✅ Clicked Continue button on Gift Card popup');

    // 6️⃣ Wait for modal to close — retry if needed
    try {
      await this.page.waitForSelector('div.popup.product-options-popup', { state: 'detached', timeout: 8000 });
      console.log('🎉 Gift Card popup closed successfully');
    } catch {
      console.warn('⚠️ Modal still visible, retrying click once...');
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await this.page.waitForSelector('div.popup.product-options-popup', { state: 'detached', timeout: 5000 }).catch(() => {});
      }
}
}
      async addSalePackageToBasket() {
        // 👇 Use the CSS path you provided
        const salePackageLink = this.page.locator(
          'body > div.site > div > main > div > article:nth-child(5) > div > a',
        );
        await expect(salePackageLink).toBeVisible({ timeout: 10000 });
        await salePackageLink.click();
    }
}
