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
    const sidebarLink = this.page.locator(
      '#site-navigation > ul > li:nth-child(2) > a',
    );
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await expect(this.page).toHaveURL(/\/category\/129/);
  }

  async addFullPricePackageToBasket() {
    const fullPricePackageLink = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(1) > div > a',
    );
    await expect(fullPricePackageLink).toBeVisible({ timeout: 10000 });
    await fullPricePackageLink.click();

    // Stability: Wait for sidebar to appear
    console.log('⏳ Waiting for basket sidebar...');
    await this.page.getByRole('button', { name: /proceed to checkout/i }).waitFor({ state: 'visible', timeout: 30000 });
  }

  async addSalePackageToBasket() {
    console.log('🛒 Adding Sale Package to basket...');

    const salePackageLink = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(5) > div > a',
    );

    await expect(salePackageLink).toBeVisible({ timeout: 10000 });
    await salePackageLink.scrollIntoViewIfNeeded();
    await salePackageLink.click();
    console.log('✅ Clicked "Add to Basket" (Sale Package)');

    // 🛑 CRITICAL: Wait for the sidebar to open HERE.
    console.log('⏳ Waiting for Basket Sidebar to slide in...');

    const checkoutBtn = this.page.getByRole('button', { name: /proceed to checkout/i });
    await checkoutBtn.waitFor({ state: 'visible', timeout: 30000 });

    console.log('✅ Basket Sidebar appeared.');
  }

  async ClickProceedToCheckout() {
    console.log('🛒 Attempting to proceed to checkout...');

    // 1. Use the exact locator from your working file
    const checkoutBtn = this.page.getByRole('button', { name: /proceed to checkout/i });

    // 2. Wait for visibility
    await checkoutBtn.waitFor({ state: 'visible', timeout: 15000 });

    // 3. 🛑 ANIMATION FIX: Wait 500ms for the slide-in animation to stop.
    await this.page.waitForTimeout(500);

    // 4. Click (Force ensures we hit it even if overlays exist)
    await checkoutBtn.click({ force: true });
    console.log('✅ Clicked Proceed to Checkout');
  }

  async addSubscriptionPackageToBasket() {
    const subscriptionPackageLink = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(2) > div > a',
    );
    await expect(subscriptionPackageLink).toBeVisible({ timeout: 10000 });
    await subscriptionPackageLink.click();

    console.log('⏳ Waiting for basket sidebar...');
    await this.page.getByRole('button', { name: /proceed to checkout/i }).waitFor({ state: 'visible', timeout: 30000 });
  }

  // ---------------------------------------------------------
  // 🟢 RE-FIXED: Uses Strict Flow + Proven Selectors
  // ---------------------------------------------------------
  async addGiftCardPackageToBasket() {
    console.log('🛍️ Adding Gift Card Package to basket...');

    // 1. Load Data
    let giftCardEmail = 'fallback@example.com';
    try {
      const giftCardData = JSON.parse(fs.readFileSync('./data/giftCardEmail.json', 'utf-8'));
      giftCardEmail = giftCardData.giftCardEmail;
    } catch (err) {
      console.warn('⚠️ Could not read giftCardEmail.json', err);
    }

    // 2. Click the Package Button (Using working selector)
    const giftCardPackageButton = this.page.locator(
      'body > div.site > div > main > div > article:nth-child(3) > div > a'
    );
    await giftCardPackageButton.waitFor({ state: 'visible', timeout: 10000 });
    await giftCardPackageButton.click();
    console.log('✅ Clicked Gift Card package button');

    // 3. Wait for the Modal Container
    console.log('⏳ Waiting for Gift Card email popup...');
    const modal = this.page.locator('div.popup.product-options-popup');
    await modal.waitFor({ state: 'visible', timeout: 15000 });

    // 4. Find & Fill Email (Using working selector + explicit wait)
    // NOTE: This selector matches input[type="email"] OR inputs with placeholder containing "email"
    const emailInput = this.page.locator('div.popup.product-options-popup input[type="email"], input[placeholder*="email" i]');

    // Ensure the input itself is visible (sometimes the modal div appears before the input renders)
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(giftCardEmail);
    console.log(`✉️ Entered gift card email: ${giftCardEmail}`);

    // 5. Click Continue (Using working selector)
    const continueBtn = this.page.locator('body > div.popup.product-options-popup > div > div > form > div.actions > button');
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await continueBtn.click();
    console.log('✅ Clicked Continue on popup');

    // 6. Wait for Modal to Disappear
    console.log('⏳ Waiting for popup to close...');
    await modal.waitFor({ state: 'detached', timeout: 15000 });
    console.log('✅ Popup closed');

    // 7. Wait for basket sidebar
    console.log('⏳ Waiting for basket sidebar...');
    const checkoutBtn = this.page.getByRole('button', { name: /proceed to checkout/i });
    await checkoutBtn.waitFor({ state: 'visible', timeout: 30000 });
    console.log('✅ Basket sidebar is open and ready.');
  }
}