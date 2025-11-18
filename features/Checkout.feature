Feature: Test Payment Regression using the default card payment method

  Scenario: Purchase a Full Priced Package (Passing)
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Full Price Package to the basket
    And I proceed to checkout
    And I complete the full priced package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Subscription Package (Passing)
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Subscription Package to the basket
    And I proceed to checkout
    And I complete the full priced package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Gift Card Package (Passing)
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a GiftCard Package to the basket
    And I proceed to checkout
    And I complete the full priced package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Sale Package (Passing)
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Sale Package to the basket
    And I proceed to checkout
    And I complete the full priced package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Purchase a Package with a Creator Code (Passing)
    Given I am on the Universal Webstore Homepage
    When I select Packages from the sidebar
    And I add a Sale Package to the basket
    And I proceed to checkout
    And I enter a valid creator code
    And I complete the full priced package payment details and click Pay
    Then I am displayed a purchase confirmation message

  Scenario: Creator Codes
    


