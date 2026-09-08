Feature: Authentication
  Doctors, patients, and admins sign in with a user ID and PIN.

  Scenario: Doctor signs in with valid credentials
    Given I am on the home page
    When I fill "user id" with "DOC-001"
    And I fill "pin" with "4242"
    And I click the "sign in" button
    Then I should see "Doctor Workspace"

  Scenario: Login fails with the wrong PIN
    Given I am on the home page
    When I fill "user id" with "DOC-001"
    And I fill "pin" with "0000"
    And I click the "sign in" button
    Then I should see "invalid"

  Scenario: Patient can read the seeded synthetic patient record
    Given I am signed in as "PAT-001"
    When I request the patient record "PAT-001"
    Then the API response status should be 200

  Scenario: Patient cannot access the staff directory
    Given I am signed in as "PAT-001"
    When I request the staff directory
    Then the API response status should be 403

  Scenario: Facility admin can access the staff directory
    Given I am signed in as "ADM-001"
    When I request the staff directory
    Then the API response status should be 200
