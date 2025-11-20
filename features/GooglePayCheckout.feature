Feature: Test Payment Regression using Google Pay

  Scenario: Purchase a Full Priced Package with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Full Price Package to the basket
    And I proceed to checkout
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Subscription Package with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Subscription Package to the basket
    And I proceed to checkout
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Gift Card Package with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a GiftCard Package to the basket
    And I proceed to checkout
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Sale Package with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Sale Package to the basket
    And I proceed to checkout
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Package with a Creator Code with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Sale Package to the basket
    And I proceed to checkout
    And I enter a valid creator code
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Package with a Coupon with Google Pay
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Sale Package to the basket
    And I proceed to checkout
    And I enter a valid coupon
    And I complete the Google Pay package payment details and click Pay
    Then I am displayed a purchase confirmation message