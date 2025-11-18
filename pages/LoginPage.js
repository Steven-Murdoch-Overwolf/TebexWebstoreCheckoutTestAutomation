export class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameField = '#email';
    this.passwordField = '#password';
    this.loginButton = '#guest-container > div > div.card.border-0 > div > form > div.d-flex.justify-content-between.align-items-center.mt-3 > button.btn.btn-primary';

    // 👇 NEW: selector for the Projects button in sidebar
    this.projectsButton = '#sidebar > div > ul > div > div > li:nth-child(2) > a';

    // 👇 NEW: text selector for "Revenue Report"
    this.revenueReportText = 'text=Revenue Report';
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL || 'https://example.com');
  }

  async login(username, password) {
    await this.page.fill(this.usernameField, username);
    await this.page.fill(this.passwordField, password);
    await this.page.click(this.loginButton);
  }

  // 👇 NEW: click sidebar Projects button
  async navigateToCreatorPanel() {
    await this.page.waitForSelector(this.projectsButton, { timeout: 10000 });
    await this.page.click(this.projectsButton);
    // wait for navigation or network idle (optional)
    await this.page.waitForLoadState('networkidle');
  }

  // 👇 NEW: check for "Revenue Report" text on the page
  async isRevenueReportVisible() {
    await this.page.waitForSelector(this.revenueReportText, { timeout: 10000 });
    return await this.page.isVisible(this.revenueReportText);
  }
}
