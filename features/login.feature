Feature: Login functionality

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I login with valid credentials
    Then I am able to navigate to the creator panel dashboard
