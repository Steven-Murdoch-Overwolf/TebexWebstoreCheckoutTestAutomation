import { expect } from '@playwright/test';
import fs from 'fs';

class Checkout {
  constructor(page) {
    this.page = page;
    this.data = JSON.parse(fs.readFileSync('./data/checkoutData.json', 'utf-8'));
  }

  // ============================================================
  // Step 1: Fill payment form inside Tebex iframe
  // ============================================================
  async fillPaymentDetails() {
    const { email, fullName, zipCode } = this.data;
    console.log('🧾 Starting to fill payment details...');

    // --- Wait for the Tebex iframe to appear ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector('iframe[name^="__zoid__tebex_js_checkout_component__"]', { timeout: 20000 });

    const frameLocator = this.page.frameLocator('iframe[name^="__zoid__tebex_js_checkout_component__"]');
    console.log('✅ Found Tebex iframe — filling fields...');

    // --- Fill form fields inside iframe ---
    await frameLocator.locator('#email').fill(email);
    await frameLocator.locator('input[name*="name" i]').fill(fullName);
    await frameLocator.locator('input[name*="zip" i], input[name*="postal" i]').fill(zipCode);




    console.log('✅ Payment details filled');

    // --- Tick Terms and Conditions checkbox ---

    const termsCheckbox = frameLocator.locator('#checkbox-12');
    if (await termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await termsCheckbox.isChecked();
      if (!isChecked) {
        await termsCheckbox.check();
        console.log('☑️ Checked Terms and Conditions box');
      } else {
        console.log('🔘 Terms box already checked');
      }
    } else {
      console.log('⚠️ Terms checkbox not visible, skipping...');
    }


    // --- Click the Pay button ---
    const payButton = frameLocator.getByRole('button', { name: /pay/i });
    if (await payButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payButton.click();
      console.log('💳 Clicked Pay button');
    } else {
      console.log('⚠️ Pay button not visible');
    }

    // --- Wait for either next step or navigation ---
    console.log('⏳ Waiting for next payment step or navigation...');
    try {
      await Promise.race([
        this.page.waitForSelector('button.btn.btn-success[name="action"][value="complete"]', { timeout: 15000 }),
        this.page.waitForURL(/confirmation|success|thankyou/i, { timeout: 15000 }),
      ]);
      console.log('✅ Checkout flow advanced — continuing...');
    } catch {
      console.log('⚠️ No next page or button detected after Pay (likely still loading). Proceeding anyway...');
    }
  }
  async confirmTestPayment() {
    console.log('💰 Confirming test payment...');
    console.log('⏳ Looking for already open test payment tab...');

    const context = this.page.context();

    // 🔍 Find any existing Tebex test payment tab
    const allPages = context.pages();
    const testPage = allPages.find(p =>
      p.url().includes('checkout.tbxstage.net/testmethod')
    );

    if (testPage) {
      console.log('🆕 Found existing test payment tab — switching...');
      this.page = testPage;
    } else {
      console.log('⚠️ No open test payment tab found — staying on current page.');
    }

    // Wait until test payment tab is ready
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    console.log('🌐 Active page URL:', this.page.url());

    // ✅ Locate and click Complete Payment button
    const completeBtn = this.page.locator('button:has-text("Complete Payment"), .btn.btn-success');
    await completeBtn.waitFor({ state: 'visible', timeout: 20000 });
    await completeBtn.click();
    console.log('✅ Clicked Complete Payment button');

    // ✅ Wait for redirect or success marker
    try {
      await Promise.race([
        this.page.waitForURL(/confirmation|success|thankyou/i, { timeout: 20000 }),
        this.page.waitForSelector('text=Payment Complete', { timeout: 20000 }),
        this.page.waitForSelector('text=Test Payment Complete', { timeout: 20000 }),
      ]);
      console.log('🎉 Test payment confirmed successfully');
    } catch {
      console.log('⚠️ Payment confirmation not detected — may remain on sandbox page.');
    }
  }

  // ============================================================
  // Step 3: Confirm order complete message on main tab
  // ============================================================
  async verifyOrderConfirmation() {
    console.log("🔍 Checking for order confirmation...");

    // ---- Candidate selectors & text ----
    const confirmationChecks = [
      { selector: 'text="Order Complete"', where: "text match: Order Complete" },
      { selector: 'text="Thank you for your purchase"', where: "Thank you message" },
      { selector: '[data-testid="order-complete"]', where: "data-testid=order-complete" },
      { selector: '.order-complete-title', where: "CSS: .order-complete-title" },
    ];

    for (const check of confirmationChecks) {
      try {
        const element = await this.page.locator(check.selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Order confirmation verified successfully (${check.where})`);

          // ---- 📸 SUCCESS SCREENSHOT ----
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const screenshotPath = `./screenshots/order-complete-${timestamp}.png`;
          await this.page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 Saved confirmation screenshot: ${screenshotPath}`);

          return; // important: confirmation found, stop here
        }
      } catch (err) {
        // Ignore individual selector errors and continue searching
      }
    }

    // ---- If all failed, capture a failure screenshot ----
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `./screenshots/order-complete-MISSING-${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`❌ No confirmation message found. Screenshot saved: ${screenshotPath}`);

    throw new Error("Order confirmation message NOT found on page.");
  }


  async enterCreatorCode() {
    console.log('🎟️ Starting to enter Creator Code...');

    // 1️⃣ Load creator code from JSON data file
    let creatorCode = 'DEFAULTCODE';
    try {
      const codeData = JSON.parse(
        fs.readFileSync('./data/creatorCode.json', 'utf-8')
      );
      creatorCode = codeData.creatorCode?.trim() || creatorCode;
      console.log(`🔑 Loaded creator code from data file: ${creatorCode}`);
    } catch (err) {
      console.warn('⚠️ Could not read creatorCode.json — using fallback code', err);
    }

    // 2️⃣ Try to locate the input either on the main page or inside a frame
    const selector = '#creator_code';
    let scope = this.page;                 // 👈 current context (page or frame)
    let input = scope.locator(selector);

    console.log('⏳ Waiting for Creator Code field to appear...');

    // First try on the main page
    if (!(await input.isVisible({ timeout: 4000 }).catch(() => false))) {
      console.log('⚠️ Not found on main page — scanning iframes...');
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const frameInput = frame.locator(selector);
          if (await frameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(
              `✅ Found creator code field inside frame: ${frame.url()}`
            );
            scope = frame;    // 👈 from now on, use this frame as the context
            input = frameInput;
            break;
          }
        } catch {
          /* skip cross-origin errors */
        }
      }
    }

    if (!(await input.isVisible().catch(() => false))) {
      throw new Error('❌ Could not find creator code input on any page or frame.');
    }

    // 3️⃣ Fill in the creator code
    await input.fill('');
    await input.fill(creatorCode);
    console.log(`✅ Entered creator code: ${creatorCode}`);

    // 4️⃣ Wait for Apply/Confirm button to appear and click it
    //    Use the SAME scope (page or frame) where we found the input
    //    Start with a simple, text-based locator
    const applyButton = scope.getByRole('button', {
      name: /apply|confirm/i,
    });

    console.log('⏳ Waiting for Confirm/Apply button to become ready...');

    // Trigger blur to help UI show the button
    await input.press('Tab');
    await scope.waitForTimeout(1000);

    // Wait until button is attached and visible
    await applyButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
      throw new Error('❌ Apply button not visible within 15s.');
    });

    // Short pause to allow any animation
    await scope.waitForTimeout(600);

    // Scroll into view and click safely
    await applyButton.scrollIntoViewIfNeeded();
    try {
      await applyButton.click({ timeout: 5000 });
      console.log('🚀 Clicked Confirm/Apply button');
    } catch (err) {
      console.log('⚠️ Normal click failed, retrying with force...');
      await applyButton.click({ force: true });
      console.log('✅ Clicked Confirm/Apply button (force mode)');
    }

    // 5️⃣ Verify success confirmation message appears
    const successMessage = scope.locator(
      '#app > div > div > nav > div > div > div > div.v-skeleton-loader.bg-background.py-6.mt-auto.align-end > div > div.creator-code-success.text-success'
    );

    console.log('⏳ Waiting for success message...');
    await successMessage.waitFor({ state: 'visible', timeout: 8000 });

    const text = await successMessage.textContent();
    if (text && text.trim()) {
      console.log(`🎉 Creator code applied successfully: "${text.trim()}"`);
    } else {
      console.warn('⚠️ Success message element found but text empty.');
    }
  }

  async enterCoupon() {
    console.log('🎟️ Starting to enter Coupon...');

    // 1️⃣ Load coupon code from JSON
    let couponCode = 'DEFAULTCODE';
    try {
      const codeData = JSON.parse(
        fs.readFileSync('./data/couponCode.json', 'utf-8'),
      );
      couponCode = codeData.couponCode?.trim() || couponCode;
      console.log(`🔑 Loaded coupon from data file: ${couponCode}`);
    } catch (err) {
      console.warn(
        '⚠️ Could not read couponCode.json — using fallback code',
        err,
      );
    }

    // 🔍 Optional debugging pause here
    // await this.page.pause();   // <-- remember the ()

    // 2️⃣ Get the checkout iframe and coupon textbox **inside** it
    const iframeLocator = this.page.locator(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
    );

    console.log('⏳ Waiting for checkout iframe...');
    await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });

    const frame = await iframeLocator.contentFrame();
    if (!frame) {
      throw new Error('❌ Could not get contentFrame() for checkout iframe');
    }

    const couponInput = frame.getByRole('textbox', {
      name: 'Coupon/Gift Card',
    });

    console.log('⏳ Waiting for Coupon/Gift Card textbox...');
    await couponInput.waitFor({ state: 'visible', timeout: 15000 });

    // 3️⃣ Fill in the coupon
    await couponInput.fill('');
    await couponInput.fill(couponCode);
    console.log(`✅ Entered coupon: ${couponCode}`);

    // 4️⃣ Click the Confirm/Apply button that appears
    const confirmButton = frame.getByRole('button', { name: /confirm|apply/i });

    console.log('⏳ Waiting for Confirm/Apply button...');
    await confirmButton.waitFor({ state: 'visible', timeout: 15000 });

    try {
      await confirmButton.click({ timeout: 5000 });
      console.log('🚀 Clicked Confirm/Apply button');
    } catch (err) {
      console.warn('⚠️ Normal click failed, retrying with force...', err);
      await confirmButton.click({ force: true });
      console.log('✅ Clicked Confirm/Apply button (force)');
    }

    // 5️⃣ Wait for "Discounts:" label to appear before ending this step
    const discountsLabel = frame.getByText('Discounts:', { exact: false });

    console.log('⏳ Waiting for Discounts label...');
    await discountsLabel.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Discounts label visible — coupon step complete');
  }

  async fillPaymentDetailsForPackage() {
    const { email, fullName, zipCode, cardNumber, expiryDate, cvc } = this.data;
    console.log('🧾 Starting to fill payment details...');

    // --- Wait for the Tebex iframe to appear ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
      { timeout: 5000 }
    );

    // Outer Tebex iframe
    const outerFrame = this.page.frameLocator(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]'
    );
    console.log('✅ Found Tebex iframe — filling fields...');

    // --- Fill form fields inside outer iframe ---
    await outerFrame.locator('#email').fill(email);
    await outerFrame.locator('input[name*="name" i]').fill(fullName);
    await outerFrame
      .locator('input[name*="zip" i], input[name*="postal" i]')
      .fill(zipCode);
    console.log('✅ Basic customer details filled');

    // 3️⃣ Switch to inner payment iframe where card fields live
    const paymentFrame = outerFrame.frameLocator('#app iframe');

    // Card number
    const cardNumberInput = paymentFrame.getByRole('textbox', {
      name: 'Card number',
    });
    await cardNumberInput.waitFor({ state: 'visible', timeout: 10000 });
    await cardNumberInput.fill(cardNumber);

    // Expiry date
    const expiryInput = paymentFrame.getByRole('textbox', {
      name: 'Expiry date',
    });
    await expiryInput.waitFor({ state: 'visible', timeout: 10000 });
    await expiryInput.fill(expiryDate);

    // CVV / CVC
    const cvcInput = paymentFrame.getByRole('textbox', {
      name: 'CVV / CVC',
    });
    await cvcInput.waitFor({ state: 'visible', timeout: 10000 });
    await cvcInput.fill(cvc);

    console.log('✅ Card details filled');

    // 4️⃣ Tick "I agree to Tebex's Terms & ..." in the outer frame
    const termsCheckbox = outerFrame.getByRole('checkbox', {
      name: /I agree to Tebex's Terms/i,
    });

    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      const checked = await termsCheckbox.isChecked().catch(() => false);
      if (!checked) {
        await termsCheckbox.check();
        console.log('☑️ Checked Terms and Conditions checkbox');
      } else {
        console.log('🔘 Terms checkbox already checked');
      }
    } else {
      console.log("⚠️ Terms checkbox not visible, couldn't click it");
    }

    // 5️⃣ Click the Pay button (also in the outer frame)
    const payButton = outerFrame.getByRole('button', { name: /pay/i });
    if (await payButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payButton.click();
      console.log('💳 Clicked Pay button');
    } else {
      console.log('⚠️ Pay button not visible');
    }

    // --- Wait for either next step or navigation ---
    console.log('⏳ Waiting for next payment step or navigation...');
    try {
      await Promise.race([
        this.page.waitForSelector(
          'button.btn.btn-success[name="action"][value="complete"]',
          { timeout: 15000 }
        ),
        this.page.waitForURL(/confirmation|success|thankyou/i, {
          timeout: 15000,
        }),
      ]);
      console.log('✅ Checkout flow advanced — continuing...');
    } catch {
      console.log(
        '⚠️ No next page or button detected after Pay (likely still loading). Proceeding anyway...'
      );
    }
  }






  async fillPaymentDetailsForGooglePay() {
    const { email, fullName, zipCode } = this.data;
    console.log('🧾 Starting to fill Google Pay payment details...');

    // --- Standard Setup ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector('iframe[name^="__zoid__tebex_js_checkout_component__"]', { timeout: 20000 });
    const outerFrame = this.page.frameLocator('iframe[name^="__zoid__tebex_js_checkout_component__"]');

    await outerFrame.getByText('More Payment Methods', { exact: true }).click();
    await outerFrame.locator('div.payment-methods .v-card:has(img[src*="gpay"])').click();

    await outerFrame.locator('#email').fill(email);
    await outerFrame.locator('input[name*="name" i]').fill(fullName);
    await outerFrame.locator('input[name*="zip" i], input[name*="postal" i]').fill(zipCode);

    const termsCheckbox = outerFrame.getByRole('checkbox', { name: /I agree to Tebex's Terms/i });
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) await termsCheckbox.check();
    }

    // --- Open Popup ---
    console.log('⏳ Preparing to handle Google Pay Popup...');
    const continueButton = outerFrame.getByRole('button', { name: /continue|pay/i });
    await continueButton.scrollIntoViewIfNeeded();

    const [gpayPopup] = await Promise.all([
      this.page.waitForEvent('popup'),
      continueButton.click(),
    ]);

    console.log('🚀 Google Pay Popup opened!');
    await gpayPopup.waitForLoadState('load');

    // --- 7) Click "Buy with GPay" ---
    console.log('⏳ Waiting for "Buy with GPay" button...');
    try {
      const intermediateBtn = gpayPopup.getByRole('button', { name: /buy with/i });
      await intermediateBtn.waitFor({ state: 'visible', timeout: 15000 });
      await intermediateBtn.click({ force: true });
      console.log('💳 Clicked "Buy with GPay" button');
    } catch (err) {
      console.log('⚠️ "Buy with GPay" button not found or timed out. Checking next screen...');
    }

    // ⏳ Wait for the Google UI to fully render
    console.log('⏳ Waiting 5s for Google Pay Interface...');
    await this.page.waitForTimeout(5000);

    // --- 8) DIRECT JS INJECTION (Targeting Screenshot Class) ---
    console.log('⚡️ Attempting Direct JavaScript Click...');

    let payClicked = false;
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
      const frames = gpayPopup.frames();
      // Filter for the Pay Frame
      const googleFrame = frames.find(f => f.url().includes('pay.google.com'));

      if (googleFrame) {
        // Run JS inside the frame to find and click
        const result = await googleFrame.evaluate(() => {
          // Helper to check visibility
          const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

          // 1. Try the EXACT class from your screenshot (.VfPpkd-RLmnJb)
          const screenshotClass = document.querySelector('.VfPpkd-RLmnJb');
          if (screenshotClass && isVisible(screenshotClass)) {
            screenshotClass.click();
            return 'SUCCESS: Clicked .VfPpkd-RLmnJb (Screenshot Class)';
          }

          // 2. Try any div with role="button" (Google often uses this instead of <button>)
          const roleButtons = Array.from(document.querySelectorAll('div[role="button"]'));
          const targetRole = roleButtons.find(b => {
            const t = b.innerText || '';
            return isVisible(b) && (t.includes('Pay') || t.includes('Subscribe')) && !t.includes('Buy with');
          });
          if (targetRole) {
            targetRole.click();
            return 'SUCCESS: Clicked div[role="button"] with text: ' + targetRole.innerText;
          }

          // 3. Fallback to standard buttons
          const stdButtons = Array.from(document.querySelectorAll('button'));
          const targetStd = stdButtons.find(b => {
            const t = b.innerText || '';
            return isVisible(b) && (t.includes('Pay') || t.includes('Subscribe')) && !t.includes('Buy with');
          });
          if (targetStd) {
            targetStd.click();
            return 'SUCCESS: Clicked <button> with text: ' + targetStd.innerText;
          }

          // Diagnostic: Return what we DO see to help debug
          return 'FAIL: Found ' + roleButtons.length + ' role=buttons, ' + stdButtons.length + ' std buttons.';
        });

        if (result.startsWith('SUCCESS')) {
          console.log(`✅ ${result}`);
          payClicked = true;
          break;
        } else {
          console.log(`   ⚠️ JS Search: ${result}`);
        }
      } else {
        console.log('   ⚠️ Google Pay frame not found yet...');
      }

      if (payClicked) break;
      await this.page.waitForTimeout(2000);
    }

    if (!payClicked) {
      console.log("❌ Failed to click 'Pay' via JS.");
      await gpayPopup.screenshot({ path: './screenshots/gpay_js_fail.png' });
      throw new Error("Could not find final Google Pay button via JS.");
    }

    // --- 9) Wait for the popup to close ---
    try {
      await gpayPopup.waitForEvent('close', { timeout: 30000 });
      console.log('✅ Google Pay popup closed automatically.');
    } catch (e) {
      console.log('ℹ️ Popup did not close within timeout.');
    }
  }


  async fillPaymentDetailsForPayPal() {
    // Destructure your existing data
    const { email, fullName, zipCode } = this.data;

    // ⚠️ TODO: Move these to environment variables or your data object for security
    const PAYPAL_LOGIN = 'ollie+personal@tebex.co.uk';
    const PAYPAL_PASS = 'b/N5T7{x';

    console.log('🧾 Starting to fill PayPal payment details...');

    // --- Standard Setup ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
      { timeout: 20000 },
    );

    const outerFrame = this.page.frameLocator(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
    );

    // Select PayPal Method
    await outerFrame.getByText('More Payment Methods', { exact: true }).click();
    await outerFrame
      .locator('div.payment-methods .v-card:has(img[src*="paypal"])')
      .click();

    // Fill Tebex Customer Details
    await outerFrame.locator('#email').fill(email);
    await outerFrame.locator('input[name*="name" i]').fill(fullName);
    await outerFrame
      .locator('input[name*="zip" i], input[name*="postal" i]')
      .fill(zipCode);

    // Handle Terms Checkbox
    const termsCheckbox = outerFrame.getByRole('checkbox', {
      name: /I agree to Tebex's Terms/i,
    });
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) await termsCheckbox.check();
    }

    // --- Handle PayPal Popup Interaction ---
    console.log('⏳ Clicking continue and catching the PayPal Popup...');

    const continueButton = outerFrame.getByRole('button', {
      name: /continue|pay/i,
    });
    await continueButton.scrollIntoViewIfNeeded();

    // 1. Trigger the popup and capture the new page reference
    const [paypalPopup] = await Promise.all([
      this.page.waitForEvent('popup'),
      continueButton.click(),
    ]);

    // 2. Wait for PayPal to load content
    await paypalPopup.waitForLoadState('domcontentloaded');
    console.log('✅ PayPal Popup captured. Entering credentials...');

    // 3. Interact with the Popup (Using your recorded steps)

    // -- Step A: Email --
    // Using regex for 'name' makes it more robust against slight text changes
    await paypalPopup.getByRole('textbox', { name: /email|mobile/i }).fill(PAYPAL_LOGIN);
    await paypalPopup.getByRole('button', { name: /next/i }).click();

    // -- Step B: Password --
    // We explicitly wait for the password field because there is a transition animation
    const passwordField = paypalPopup.getByRole('textbox', { name: /password/i });
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill(PAYPAL_PASS);

    await paypalPopup.getByRole('button', { name: /log in/i }).click();

    // -- Step C: Complete Payment --
    // Waiting for the "Complete Purchase" / "Pay Now" button to appear
    // 'submit-button-initial' is the ID you found in the inspector
    const payButton = paypalPopup.getByTestId('submit-button-initial');
    await payButton.waitFor({ state: 'visible', timeout: 15000 });
    await payButton.click();

    // 4. Wait for the popup to close naturally
    // This confirms the payment was processed and the window destroyed itself
    console.log('⏳ Payment submitted. Waiting for popup to close...');
    await paypalPopup.waitForEvent('close');

    console.log('🎉 PayPal flow complete. Back to main context.');
  }





  async fillPaymentDetailsForPayPalSubscriptions() {
    // Destructure your existing data
    const { email, fullName, zipCode, billingAddress, city, state, phone } = this.data;

    // ⚠️ TODO: Move these to environment variables or your data object for security
    const PAYPAL_LOGIN = 'ollie+personal@tebex.co.uk';
    const PAYPAL_PASS = 'b/N5T7{x';

    console.log('🧾 Starting to fill PayPal payment details...');

    // --- Standard Setup ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
      { timeout: 20000 },
    );

    const outerFrame = this.page.frameLocator(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
    );

    // Select PayPal Method
    await outerFrame.getByText('More Payment Methods', { exact: true }).click();
    await outerFrame
      .locator('div.payment-methods .v-card:has(img[src*="paypal"])')
      .click();

    // Fill Tebex Customer Details
    await outerFrame.locator('#email').fill(email);
    await outerFrame.locator('input[name*="name" i]').fill(fullName);
    await outerFrame.locator('input[name*="zip" i], input[name*="postal" i]').fill(zipCode);
    await outerFrame.locator('input[name*="sender_address_line1" i]').fill(billingAddress);
    await outerFrame.locator('input[name*="city" i]').fill(city);
    await outerFrame.locator('input[name*="state" i]').fill(state);
    await outerFrame.locator('input[name*="phone" i]').fill(phone);

    // Handle Terms Checkbox
    const termsCheckbox = outerFrame.getByRole('checkbox', {
      name: /I agree to Tebex's Terms/i,
    });
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) await termsCheckbox.check();
    }

    // --- Handle PayPal Popup Interaction ---
    console.log('⏳ Clicking continue and catching the PayPal Popup...');

    const continueButton = outerFrame.getByRole('button', {
      name: /continue|pay/i,
    });
    await continueButton.scrollIntoViewIfNeeded();

    // 1. Trigger the popup and capture the new page reference
    const [paypalPopup] = await Promise.all([
      this.page.waitForEvent('popup'),
      continueButton.click(),
    ]);

    // 2. Wait for PayPal to load content
    await paypalPopup.waitForLoadState('domcontentloaded');
    console.log('✅ PayPal Popup captured. Entering credentials...');

    // 3. Interact with the Popup

    // -- Step A: Email --
    // Using regex for 'name' makes it more robust against slight text changes
    await paypalPopup.getByRole('textbox', { name: /email|mobile/i }).fill(PAYPAL_LOGIN);
    await paypalPopup.getByRole('button', { name: /next/i }).click();

    // -- Step B: Password --
    // We explicitly wait for the password field because there is a transition animation
    const passwordField = paypalPopup.getByRole('textbox', { name: /password/i });
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill(PAYPAL_PASS);

    await paypalPopup.getByRole('button', { name: /log in/i }).click();

    // -- Step C: Complete Payment --
    // Waiting for the "Complete Purchase" / "Pay Now" button to appear
    // 'submit-button-initial' is the ID you found in the inspector
    const payButton = paypalPopup.getByTestId('submit-button-initial');
    await payButton.waitFor({ state: 'visible', timeout: 15000 });
    await payButton.click();

    // 4. Wait for the popup to close naturally
    // This confirms the payment was processed and the window destroyed itself
    console.log('⏳ Payment submitted. Waiting for popup to close...');
    await paypalPopup.waitForEvent('close');

    console.log('🎉 PayPal flow complete. Back to main context.');
  }


  async fillPaymentDetailsForNaverPay() {
    const { email, fullName, zipCode } = this.data;
    console.log('🧾 Starting to fill Naver Pay payment details...');

    // --- 1. Standard Setup & Iframe ---
    console.log('⏳ Waiting for Tebex checkout iframe...');
    await this.page.waitForSelector(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]',
      { timeout: 20000 }
    );
    const outerFrame = this.page.frameLocator(
      'iframe[name^="__zoid__tebex_js_checkout_component__"]'
    );

    // --- 2. Select Naver Pay ---
    await outerFrame.getByText('More Payment Methods', { exact: true }).click();
    await outerFrame.locator('div.payment-methods .v-card:has(img[src*="naverpay"])').click();

    // --- 3. Fill Customer Details ---
    await outerFrame.locator('#email').fill(email);
    await outerFrame.locator('input[name*="name" i]').fill(fullName);
    await outerFrame.locator('input[name*="zip" i], input[name*="postal" i]').fill(zipCode);

    // --- 4. Handle Terms Checkbox ---
    const termsCheckbox = outerFrame.getByRole('checkbox', { name: /I agree to Tebex's Terms/i });
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) await termsCheckbox.check();
    }

    // --- 5. Trigger Popup ---
    console.log('⏳ Clicking continue and waiting for Naver Pay popup...');

    // Locate the pay button inside the iframe
    const continueButton = outerFrame.getByRole('button', { name: /continue|pay/i });
    await continueButton.scrollIntoViewIfNeeded();

    // Trigger the popup and capture the reference
    const [naverPopup] = await Promise.all([
      this.page.waitForEvent('popup'),
      continueButton.click(),
    ]);

    // --- 6. Handle New Window (The Fix) ---
    console.log('✅ Naver Pay Popup captured. Waiting for redirects to finish...');

    // CRITICAL FIX: Wait for 'networkidle' instead of 'domcontentloaded'.
    // Your logs showed 3+ redirects (psp.ac.alipay -> ac.alipay).
    // 'networkidle' ensures the final page is actually ready.
    await naverPopup.waitForLoadState('networkidle');

    // Use a "Fuzzy" locator that finds ANY button containing "Confirm" and "Pay"
    // This handles "Confirm & Pay", "Confirm and Pay", or case differences.
    const confirmButton = naverPopup.locator('button, [role="button"]')
      .filter({ hasText: /confirm.*pay/i })
      .first();

    console.log('⏳ Looking for "Confirm & Pay" button...');

    try {
      await confirmButton.waitFor({ state: 'visible', timeout: 20000 });
      await confirmButton.click();
      console.log('✅ Clicked "Confirm & Pay"');
    } catch (e) {
      console.log('❌ "Confirm & Pay" button NOT found. Dumping page text for debugging:');
      console.log(await naverPopup.innerText('body')); // This will show up in your console if it fails again
      throw e;
    }

    // --- 7. Cleanup ---
    // Wait for the window to close itself, signaling success
    await naverPopup.waitForEvent('close', { timeout: 30000 });
    console.log('🎉 Naver Pay popup closed. Payment complete.');
  }







  async confirmTestPayment() {
    console.log('💰 Confirming test payment...');
    console.log('⏳ Looking for already open test payment tab...');

    const context = this.page.context();

    // 🔍 Find any existing Tebex test payment tab
    const allPages = context.pages();
    const testPage = allPages.find(p =>
      p.url().includes('checkout.tbxstage.net/testmethod')
    );

    if (testPage) {
      console.log('🆕 Found existing test payment tab — switching...');
      this.page = testPage;
    } else {
      console.log('⚠️ No open test payment tab found — staying on current page.');
    }

    // Wait until test payment tab is ready
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    console.log('🌐 Active page URL:', this.page.url());

    // ✅ Locate and click Complete Payment button
    const completeBtn = this.page.locator('button:has-text("Complete Payment"), .btn.btn-success');
    await completeBtn.waitFor({ state: 'visible', timeout: 20000 });
    await completeBtn.click();
    console.log('✅ Clicked Complete Payment button');

    // ✅ Wait for redirect or success marker
    try {
      await Promise.race([
        this.page.waitForURL(/confirmation|success|thankyou/i, { timeout: 20000 }),
        this.page.waitForSelector('text=Payment Complete', { timeout: 20000 }),
        this.page.waitForSelector('text=Test Payment Complete', { timeout: 20000 }),
      ]);
      console.log('🎉 Test payment confirmed successfully');
    } catch {
      console.log('⚠️ Payment confirmation not detected — may remain on sandbox page.');
    }
  }

  // ============================================================
  // Step 3: Confirm order complete message on main tab
  // ============================================================
  async verifyOrderConfirmation() {
    console.log('🔍 Checking for purchase confirmation message...');

    const context = this.page.context();
    await this.page.waitForTimeout(1500);

    // 🪄 Ensure we’re on the main checkout tab
    const mainPage = context.pages().find(p =>
      p.url().includes('universal-automation-project.tbxstage.net/checkout/basket')
    );
    if (mainPage) {
      console.log('🔁 Switched back to main checkout tab');
      this.page = mainPage;
    } else {
      console.log('⚠️ Could not find main tab — staying on current page.');
    }

    // Small delay for modal animations
    await this.page.waitForTimeout(2000);

    // ---- Helper: detect confirmation in a given page or frame ----
    const tryDetectInScope = async (scope, label) => {
      // 1️⃣ Role-based heading detection (most robust)
      const h1Role = scope.getByRole('heading', { name: /order complete/i });
      if (await h1Role.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Order Complete" via ARIA role in ${label}`);
        // Try to extract order number (usually visible near confirmation text)
        try {
          const text = await scope.evaluate(() => document.body.innerText);
          const match = text.match(/tbx-[a-z0-9-]+/i);
          if (match) console.log(`🧾 Detected Order Number: ${match[0]}`);
        } catch (e) {
          console.log('⚠️ Could not extract order number:', e.message);
        }
        return { ok: true, where: label };
      }

      // 2️⃣ Check for Continue button (also a strong indicator)
      const continueBtn = scope.locator('button:has-text("Continue")');
      if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Continue" button in ${label} — confirmation modal present`);
        return { ok: true, where: label };
      }

      // 3️⃣ Plain text-based locators
      const textLoc = scope.locator('text=Order Complete');
      if (await textLoc.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Order Complete" text in ${label}`);
        return { ok: true, where: label };
      }

      // 4️⃣ Fallback: scan innerText for the phrase
      try {
        const inner = await scope.evaluate(() => document.body?.innerText || '');
        if (inner && /order complete/i.test(inner)) {
          console.log(`🎉 Found "Order Complete" via innerText in ${label}`);
          return { ok: true, where: label };
        }
      } catch {
        // ignore cross-origin errors
      }

      return { ok: false };
    };

    // ---- Check main page first ----
    let result = await tryDetectInScope(this.page, 'main page');
    if (result.ok) {
      console.log(`✅ Order confirmation verified successfully (${result.where})`);
      return;
    }

    // ---- Search across all frames ----
    const frames = this.page.frames();
    console.log(`🔎 Searching ${frames.length} frame(s) for confirmation…`);
    for (const frame of frames) {
      console.log('   • frame:', frame.url() || '(about:blank)');
      try {
        result = await tryDetectInScope(frame, `frame ${frame.url() || '(blank)'}`);
        if (result.ok) {
          console.log(`✅ Order confirmation verified successfully (${result.where})`);
          return;
        }
      } catch {
        // skip inaccessible frames
      }
    }

    // ---- Final retry after short wait ----
    await this.page.waitForTimeout(2000);
    result = await tryDetectInScope(this.page, 'main page (final retry)');
    if (result.ok) {
      console.log(`✅ Order confirmation verified successfully (${result.where})`);
      return;
    }

    // ---- If all failed, capture a screenshot ----
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `./screenshots/order-complete-missing-${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Saved screenshot for debugging: ${screenshotPath}`);

    throw new Error('❌ Could not detect confirmation (checked main page + all iframes + innerText).');
  }

  async confirmTestPayment() {
    console.log('💰 Confirming test payment...');
    console.log('⏳ Looking for already open test payment tab...');

    const context = this.page.context();

    // 🔍 Find any existing Tebex test payment tab
    const allPages = context.pages();
    const testPage = allPages.find(p =>
      p.url().includes('checkout.tbxstage.net/testmethod')
    );

    if (testPage) {
      console.log('🆕 Found existing test payment tab — switching...');
      this.page = testPage;
    } else {
      console.log('⚠️ No open test payment tab found — staying on current page.');
    }

    // Wait until test payment tab is ready
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    console.log('🌐 Active page URL:', this.page.url());

    // ✅ Locate and click Complete Payment button
    const completeBtn = this.page.locator('button:has-text("Complete Payment"), .btn.btn-success');
    await completeBtn.waitFor({ state: 'visible', timeout: 20000 });
    await completeBtn.click();
    console.log('✅ Clicked Complete Payment button');

    // ✅ Wait for redirect or success marker
    try {
      await Promise.race([
        this.page.waitForURL(/confirmation|success|thankyou/i, { timeout: 20000 }),
        this.page.waitForSelector('text=Payment Complete', { timeout: 20000 }),
        this.page.waitForSelector('text=Test Payment Complete', { timeout: 20000 }),
      ]);
      console.log('🎉 Test payment confirmed successfully');
    } catch {
      console.log('⚠️ Payment confirmation not detected — may remain on sandbox page.');
    }
  }





  // ============================================================
  // Step 3: Confirm order complete message on main tab
  // ============================================================
  async verifyOrderConfirmation() {
    console.log('🔍 Checking for purchase confirmation message...');

    const context = this.page.context();
    await this.page.waitForTimeout(1500);

    // 🪄 Ensure we’re on the main checkout tab
    const mainPage = context.pages().find(p =>
      p.url().includes('universal-automation-project.tbxstage.net/checkout/basket')
    );
    if (mainPage) {
      console.log('🔁 Switched back to main checkout tab');
      this.page = mainPage;
    } else {
      console.log('⚠️ Could not find main tab — staying on current page.');
    }

    // Small delay for modal animations
    await this.page.waitForTimeout(2000);

    // ---- Helper: detect confirmation in a given page or frame ----
    const tryDetectInScope = async (scope, label) => {
      // 1️⃣ Role-based heading detection (most robust)
      const h1Role = scope.getByRole('heading', { name: /order complete/i });
      if (await h1Role.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Order Complete" via ARIA role in ${label}`);
        // Try to extract order number (usually visible near confirmation text)
        try {
          const text = await scope.evaluate(() => document.body.innerText);
          const match = text.match(/tbx-[a-z0-9-]+/i);
          if (match) console.log(`🧾 Detected Order Number: ${match[0]}`);
        } catch (e) {
          console.log('⚠️ Could not extract order number:', e.message);
        }
        return { ok: true, where: label };
      }

      // 2️⃣ Check for Continue button (also a strong indicator)
      const continueBtn = scope.locator('button:has-text("Continue")');
      if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Continue" button in ${label} — confirmation modal present`);
        return { ok: true, where: label };
      }

      // 3️⃣ Plain text-based locators
      const textLoc = scope.locator('text=Order Complete');
      if (await textLoc.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`🎉 Found "Order Complete" text in ${label}`);
        return { ok: true, where: label };
      }

      // 4️⃣ Fallback: scan innerText for the phrase
      try {
        const inner = await scope.evaluate(() => document.body?.innerText || '');
        if (inner && /order complete/i.test(inner)) {
          console.log(`🎉 Found "Order Complete" via innerText in ${label}`);
          return { ok: true, where: label };
        }
      } catch {
        // ignore cross-origin errors
      }

      return { ok: false };
    };

    // ---- Check main page first ----
    let result = await tryDetectInScope(this.page, 'main page');
    if (result.ok) {
      console.log(`✅ Order confirmation verified successfully (${result.where})`);
      return;
    }

    // ---- Search across all frames ----
    const frames = this.page.frames();
    console.log(`🔎 Searching ${frames.length} frame(s) for confirmation…`);
    for (const frame of frames) {
      console.log('   • frame:', frame.url() || '(about:blank)');
      try {
        result = await tryDetectInScope(frame, `frame ${frame.url() || '(blank)'}`);
        if (result.ok) {
          console.log(`✅ Order confirmation verified successfully (${result.where})`);
          return;
        }
      } catch {
        // skip inaccessible frames
      }
    }

    // ---- Final retry after short wait ----
    await this.page.waitForTimeout(2000);
    result = await tryDetectInScope(this.page, 'main page (final retry)');
    if (result.ok) {
      console.log(`✅ Order confirmation verified successfully (${result.where})`);
      return;
    }

    // ---- If all failed, capture a screenshot ----
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `./screenshots/order-complete-missing-${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Saved screenshot for debugging: ${screenshotPath}`);

    throw new Error('❌ Could not detect confirmation (checked main page + all iframes + innerText).');
  }

}

export default Checkout
