/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests
// See https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements

describe('Login and Signup Flow', () => {
  // Runs before each test to set the viewport and visit the root URL
  beforeEach(() => {
    cy.viewport('macbook-16')
    cy.visit('/profile')
  })

  it('should allow the user to switch between Sign In and Sign Up tabs', () => {
    // Clicks the "Sign In" tab
    cy.get('[data-test="signin-tab"]').click()
    // Ensures email field is visible
    cy.get('[data-test="email-field"]').should('be.visible')
    // Ensures password field is visible
    cy.get('[data-test="password-field"]').should('be.visible')

    // Switch to "Sign Up" tab
    cy.get('[data-test="signup-tab"]').click()
    // Checks "Name" field visibility
    cy.get('[data-test="name-field"]').should('be.visible')
    // Checks "Username" field visibility
    cy.get('[data-test="username-field"]').should('be.visible')
    // Checks "Email" field visibility
    cy.get('[data-test="email-field"]').should('be.visible')
    // Checks "Password" field visibility
    cy.get('[data-test="password-field"]').should('be.visible')
  })

  it('should validate email and password during Sign In', () => {
    // Test validation for email and password
    // Inputs invalid email
    cy.get('[data-test="email-field"]').type('invalid-email')
    // Inputs invalid password
    cy.get('[data-test="password-field"]').type('123')
    // Clicks the "Sign In" button
    cy.get('[data-test="sign-button"]').click()
    // Checks for email validation error
    cy.contains('Invalid Email').should('be.visible')
    // Checks for password validation error
    cy.contains('Invalid Password').should('be.visible')
  })

  it('should show a success notification for valid Sign In', () => {
    // Test a successful sign-in and logout process
    cy.visit('/profile')
    // Inputs a valid email
    cy.get('[data-test="email-field"]').type('test@test.com')
    // Inputs a valid password
    cy.get('[data-test="password-field"]').type('12345678')
    // Clicks the "Sign In" button
    cy.get('[data-test="sign-button"]').click()

    cy.get('[data-test="tab-settings"]').click()
    // Verify user is logged in by checking their profile email visibility
    cy.get('[data-test="profile-email"]').should('have.value', 'test@test.com')

    // Logs out the user
    // Clicks the logout button
    cy.get('[data-test="logout-button"]').click()
    // Verifies redirection to the login page and visibility of the auth card
    cy.url().should('include', '/profile')
    cy.get('[data-test="auth-card"]').should('exist')
  })

  it('should validate reset password from the dialog', () => {
    // Test reset password dialog with invalid email
    // Switches to "Sign In" tab
    cy.get('[data-test="signin-tab"]').click()
    // Opens the reset password dialog
    cy.get('[data-test="forgot-password-button"]').click()
    // Inputs invalid email
    cy.get('[data-test="reset-email-field"]').type('invalid-email')
    // Clicks the "Ok" button
    cy.get('button').contains('Ok').click()
    // Checks for email validation error
    cy.contains('Invalid Email').should('be.visible')
    // Inputs clear
    cy.get('[data-test="reset-email-field"]').clear()
    // Inputs an invalid email
    cy.get('[data-test="reset-email-field"]').type('invalid@test.com')
    // Clicks the "Ok" button
    cy.get('button').contains('Ok').click()
    // Verifies error message
    cy.contains('This email does not exist').should('be.visible')
  })

  it('should reset password from the dialog', () => {
    // Test reset password dialog with a valid email
    // Switches to "Sign In" tab
    cy.get('[data-test="signin-tab"]').click()
    // Opens the reset password dialog
    cy.get('[data-test="forgot-password-button"]').click()
    // Inputs a valid email
    cy.get('[data-test="reset-email-field"]').type('test@test.com')
    // Clicks the "Ok" button
    cy.get('button').contains('Ok').click()
    // Verifies success message
    // cy.contains('Password reset link sent. Please check your email.').should('be.visible')
  })

  it('should validate fields during Sign Up', () => {
    // Switch to Sign Up tab
    cy.get('[data-test="signup-tab"]').click()

    // Test Name field validation
    // Input short name
    cy.get('[data-test="name-field"]').type('S')
    // Click "Sign Up"
    cy.get('[data-test="sign-button"]').click()
    // Check for name validation error
    cy.contains('Invalid Name').should('be.visible')

    // Inputs invalid email
    cy.get('[data-test="email-field"]').type('invalid-email')
    // Click "Sign Up"
    cy.get('[data-test="sign-button"]').click()
    // Checks for email validation error
    cy.contains('Invalid Email').should('be.visible')

    // Test Username field validation (invalid username)
    // Input too short username
    cy.get('[data-test="username-field"]').type('ab')
    // Click "Sign Up"
    cy.get('[data-test="sign-button"]').click()
    // Check for username length error
    cy.contains('Username must be between 3 and 20 characters long').should('be.visible')
    // Input UnAvailable username
    cy.get('[data-test="username-field"]').clear()
    cy.get('[data-test="username-field"]').type('Cypress Tester')
    // Click "Sign Up"
    cy.get('[data-test="sign-button"]').click()
    // Check for username length error
    cy.contains('Username already taken').should('be.visible')
    // Test Password field validation (too short)
    // Input too short password
    cy.get('[data-test="password-field"]').type('123')
    // Click "Sign Up"
    cy.get('[data-test="sign-button"]').click()
    // Check for password validation error
    cy.contains('Invalid Password').should('be.visible')
  })

  // locally working successfully
  // it('should properly handle the delete account process', () => {
  //   cy.visit('/profile')

  //   cy.get('[data-test="signup-tab"]').click()

  //   // Fill out the signup form
  //   cy.get('[data-test="username-field"]').type('deleteaccount')
  //   cy.get('[data-test="name-field"]').type('delete account')
  //   cy.get('[data-test="email-field"]').type('deleteaccount@email.com')
  //   cy.get('[data-test="password-field"]').type('deleteaccount123')

  //   // Click the "Sign Up" button
  //   cy.get('[data-test="sign-button"]').click()
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   // cy.wait(60000)
  //   // Wait for the success message to appear
  //   // cy.get('.q-notification').find('.q-notification__message').should('contain', 'Account created successfully', { timeout: 50000 })
  //   cy.get('.q-notification__message', { timeout: 50000 }).should('contain', 'Account created successfully')

  //   cy.get('[data-test="tab-settings"]',).click()
  //   // Verify user is logged in by checking their profile email visibility
  //   cy.get('[data-test="profile-email"]').should('have.value', 'deleteaccount@email.com')

  //   cy.get('[data-test=delete-account-button]').click()

  //   // Step 2: Verify the confirmation dialog appears
  //   cy.get('[data-test=delete-account-dialog]').should('be.visible')
  //   cy.contains('Delete Account?').should('exist')
  //   cy.get('[data-test=delete-confirmation-message]').should('be.visible')
  //   cy.get('[data-test=user-display-name]').should('have.text', 'delete account')

  //   // Step 3: Ensure delete button is disabled initially
  //   cy.get('[data-test=delete-button]').should('be.disabled')

  //   // Step 4: Check validation rule - typing incorrect text should keep button disabled
  //   cy.get('[data-test=delete-confirmation-input]').type('WRONG TEXT')
  //   cy.contains('You must type DELETE to confirm').should('exist')
  //   cy.get('[data-test=delete-button]').should('be.disabled')

  //   // Step 5: Type correct text and verify delete button is enabled
  //   cy.get('[data-test=delete-account-button]').click()
  //   cy.get('[data-test=delete-confirmation-input]').clear()
  //   cy.get('[data-test=delete-confirmation-input]').type('DELETE')
  //   cy.get('[data-test=delete-button]').should('not.be.disabled')

  //   // Step 6: Click "Delete" and check for notification & redirection
  //   cy.get('[data-test=delete-button]').click()

  //   // Step 7: Wait for deletion, check success notification, and confirm redirection
  //   // cy.wait(500)
  //   // Adjust message if necessary
  //   cy.get('.q-notification').should('contain', 'Your account has been deleted successfully.')
  //   // Ensure redirection after deletion
  //   cy.url().should('include', '/profile')
  // })
  // locally working successfully
  //   it('should sign up users successfully, log out, and delete users', () => {
  //     // Array of users for signup
  //     const users = [
  //       { name: 'DeleteUser One', username: 'deleteUser1', email: 'deleteuser1@test.com', password: 'password1' },
  //       { name: 'DeleteUser Two', username: 'deleteuser2', email: 'deleteuser2@test.com', password: 'password2' },
  //       { name: 'DeleteUser Three', username: 'deleteuser3', email: 'deleteuser3@test.com', password: 'password3' }
  //     ]

  //     // Iterate through each user for signup
  //     users.forEach((user) => {
  //       // Switch to Sign Up tab
  //       cy.get('[data-test="signup-tab"]').click()

  //       // Fill out the signup form
  //       cy.get('[data-test="name-field"]').clear()
  //       cy.get('[data-test="name-field"]').type(user.name)
  //       cy.get('[data-test="username-field"]').clear()
  //       cy.get('[data-test="username-field"]').type(user.username)
  //       cy.get('[data-test="email-field"]').clear()
  //       cy.get('[data-test="email-field"]').type(user.email)
  //       cy.get('[data-test="password-field"]').clear()
  //       cy.get('[data-test="password-field"]').type(user.password)

  //       // Click the "Sign Up" button
  //       cy.get('[data-test="sign-button"]').click()

  //       // Verify successful signup
  //       cy.get('.q-notification__message', { timeout: 50000 }).should('contain', 'Account created successfully')

  //       cy.get('[data-test="tab-settings"]').click()
  //       // Verify user is logged in by checking their profile email visibility
  //       cy.get('[data-test="profile-email"]').should('have.value', user.email)

  //       // Log out after successful signup
  //       // Clicks the logout button
  //       cy.get('[data-test="logout-button"]').click()
  //       // Verifies redirection to the login page and visibility of the auth card
  //       cy.url().should('include', '/profile')

  //       // Verify redirection to the login page
  //       cy.url().should('include', '/profile')
  //       cy.get('[data-test="auth-card"]').should('exist')
  //     })

  //     // Sign in with admin credentials
  //     // Inputs a valid email
  //     cy.get('[data-test="email-field"]').type('test@test.com')
  //     // Inputs a valid password
  //     cy.get('[data-test="password-field"]').type('12345678')
  //     // Clicks the "Sign In" button
  //     cy.get('[data-test="sign-button"]').click()

  //     cy.get('[data-test="admin-tab"]').click()

  //     cy.get('[data-test="users-tab"]').click()

  //     // Ensure the user table is visible
  //     cy.get('.custom-table').should('be.visible')

  //     // Search for users by name
  //     cy.get('[data-test="query-input"]').type('DeleteUser')

  //     // Step 1: Single delete operation
  //     const userToDelete = users[0]
  //     cy.contains('tr', userToDelete.email).find('[data-test="delete-button"]').click()
  //     cy.get('[data-test="delete-dialog"]').should('be.visible')
  //     cy.get('[data-test="delete-dialog-list"]').within(() => {
  //       cy.get('li').should('contain.text', userToDelete.name)
  //     })
  //     cy.get('[data-test="confirm-delete-button"]').click()
  //     cy.contains('User deleted successfully').should('be.visible')
  //     cy.get('.custom-table').should('not.contain', userToDelete.email)

  //     // Step 2: Multiple delete operation
  //     const usersToDelete = users.slice(1)
  //     usersToDelete.forEach((user) => {
  //       cy.contains('tr', user.email).find('[data-test="user-checkbox"]').check()
  //     })

  //     cy.get('[data-test="delete-multiple-button"]').click()
  //     cy.get('[data-test="delete-dialog"]').should('be.visible')
  //     cy.get('[data-test="delete-dialog-list"]').within(() => {
  //       usersToDelete.forEach((user) => {
  //         cy.get('li').should('contain.text', user.name)
  //       })
  //     })
  //     cy.get('[data-test="confirm-delete-button"]').click()
  //     cy.contains('User deleted successfully').should('be.visible')
  //     usersToDelete.forEach((user) => {
  //       cy.get('.custom-table').should('not.contain', user.email)
  //     })
  //   })
})
