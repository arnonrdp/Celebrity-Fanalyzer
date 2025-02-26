/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />

describe('User Profile page', () => {
  beforeEach(() => {
    cy.viewport('macbook-16')
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false
    })
    // Visits the profile page
    cy.login()
    cy.visit('/profile')
  })
  it('Should user profile edit', () => {
    const name = 'Cypress Tester'

    // Get the edit Name input
    cy.get('[data-test="input-name"]').clear()
    cy.get('[data-test="input-name"]').type(name)

    // Get the copy username button and click it
    cy.get('[data-test="button-username-copy"]', { timeout: 10000 }).click()

    //Check the Link copied to clipboard successfully
    cy.get('.q-notification__message', { timeout: 10000 }).contains('Link copied to clipboard')

    // Get the edit UserName input
    cy.get('[data-test="input-user-name"]').clear()
    cy.get('[data-test="input-user-name"]').type('Cypress Tester')

    // Get the bio input and type 'User Bio Updated' into it
    cy.get('[data-test="input-bio"]', { timeout: 10000 }).clear()
    cy.get('[data-test="input-bio"]').type('User Bio Updated')

    // Get the facebook input and type 'https://www.facebook.com/cypresstester' into it
    cy.get('[data-test="input-facebook"]').clear()
    cy.get('[data-test="input-facebook"]').type('https://www.facebook.com/cypresstester')

    // Get the instagram input and type 'https://www.instagram.com/cypresstester' into it
    cy.get('[data-test="input-instagram"]').clear()
    cy.get('[data-test="input-instagram"]').type('https://www.instagram.com/cypresstester')

    // Get the linkedin input and type 'https://www.linkedin.com/in/cypresstester' into it
    cy.get('[data-test="input-linkedin"]').clear()
    cy.get('[data-test="input-linkedin"]').type('https://www.linkedin.com/in/cypresstester')

    // Get the telegram input and type 'https://www.t.me/cypresstester' into it
    cy.get('[data-test="input-telegram"]').clear()
    cy.get('[data-test="input-telegram"]').type('https://t.me/cypresstester')

    // Get the X input and type 'https://x.com/cypresstester' into it
    cy.get('[data-test="input-x"]').clear()
    cy.get('[data-test="input-x"]').type('https://x.com/cypresstester')

    // Get the submit button and click it
    cy.get('[data-test="button-submit"] > .q-btn__content').click()

    //Check the Profile successfully updated
    cy.get('.q-notification__message').contains('Profile successfully updated')
  })

  it('if a user has Prompts & Entries Subscribe, they should unsubscribe', () => {
    cy.visit('/profile/subscriptions', { timeout: 15000 })
    // cy.get('[href="/profile"]').click().wait(2000)
    // cy.get('[href="/profile/subscriptions"]').click()

    // Check if the Prompts table exists and unsubscribe
    // Ensure table exists
    cy.get('.prompts-table').should('exist')
    cy.get('.prompts-table .q-tr')
      .should('have.length.greaterThan', -1)
      .then((tableRows) => {
        if (tableRows.length > 0) {
          cy.get('[data-test="prompt-unsubscribe"]', { timeout: 10000 }).first().click()
          // Click the first unsubscribe button
        } else {
          cy.log('No prompts subscription found')
        }
      })

    // Check if the Entries table exists and unsubscribe
    // Ensure table exists
    cy.get('.entries-table', { timeout: 10000 }).should('exist')
    cy.get('.entries-table .q-tr')
      .should('have.length.greaterThan', -1)
      .then((tableRows) => {
        if (tableRows.length > 0) {
          cy.get('[data-test="entrie-unsubscribe"]', { timeout: 10000 }).first().click()
          // Click the first unsubscribe button
        } else {
          cy.log('No entries subscription found')
        }
      })
  })

  it('Should display the View Profile button and open the profile link in a new tab', () => {
    cy.intercept('GET', '**/user', {
      body: {
        username: 'Cypress Tester'
      }
    })

    // Ensure the "View Profile" button is visible
    cy.get('[data-test="button-username-view-profile"]', { timeout: 10000 }).should('exist').should('be.visible')

    // Stub the window.open method
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen')
    })
    // Click the button and verify the expected behavior
    cy.get('[data-test="button-username-view-profile"]').click()
    // Assert the new tab opens with the correct URL
    cy.get('@windowOpen').should('be.calledWith', `${window.location.origin}/fan/Cypress Tester`)
  })

  it('Should allow user to upload and delete profile picture', () => {
    // Step 1: Upload a profile picture
    cy.visit('/profile')

    // Open the upload dialog by clicking the avatar
    cy.get('[data-test="avatar-upload"]').click()

    // Ensure the dialog appears
    cy.get('[data-test="upload-dialog"]').should('be.visible')

    // Choose a file
    // File input element in the dialog
    cy.get('[data-test="upload-file-input"]').selectFile('src/assets/cypress.jpg')

    // Wait for the preview image to show
    cy.get('[data-test="upload-preview"]').should('be.visible')

    // Click the Save button in the dialog to upload the image
    cy.get('[data-test="upload-save-btn"]').click()
    // Adjust wait time based on your app's image upload duration

    // Check if the profile was successfully updated after upload
    cy.get('.q-notification__message', { timeout: 15000 }).contains('Profile successfully updated')

    // Delete the profile picture
    cy.get('[data-test="avatar-upload"]').click()

    // Ensure the dialog appears
    cy.get('[data-test="upload-dialog"]').should('be.visible')

    // Wait for the preview image to show
    cy.get('[data-test="upload-preview"]').should('be.visible')

    // Click the delete button in the dialog
    cy.get('[data-test="upload-delete-btn"]').should('be.enabled')

    cy.get('[data-test="upload-delete-btn"]').click()
    // Adjust wait time based on your app's image deletion duration

    // Check if the profile was successfully updated after deletion
    cy.get('.q-notification__message', { timeout: 15000 }).contains('Profile successfully updated')
  })

  // it('should show an error if file size is too large', () => {
  //   // Open the upload dialog by clicking the avatar
  //   cy.get('[data-test="avatar-upload"]').click()

  //   // Ensure the dialog appears
  //   cy.get('[data-test="upload-dialog"]').should('be.visible')

  //   // Choose a large file that exceeds the size limit (5MB)
  //   cy.get('[data-test="upload-file-input"]').selectFile('src/assets/large.jpg')

  //   // Verify the rejection message (this will depend on how the rejection is handled in the code)
  //   cy.get('.q-notification__message').contains('File size is too big. Max file size is 5MB.')
  // })

  it('should handle notifications correctly', () => {
    // Check if the notification button exists
    cy.get('[data-test="notification-bubble-btn"]').should('exist')

    // Click the notification button
    cy.get('[data-test="notification-bubble-btn"]').click()

    // Ensure the notification menu appears
    cy.get('.q-menu').should('be.visible')

    // Check if notifications exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="notification-item"]').length > 0) {
        // Ensure notification message is visible
        cy.get('[data-test="notification-message"]').should('be.visible')

        // Click the clear icon to remove the notification
        cy.get('[data-test="notification-clear-btn"]').first().click()

        // Ensure the notification is removed
        cy.get('[data-test="notification-item"]').should('not.exist')
      } else {
        // Wait for "no notifications" message to appear
        cy.get('[data-test="no-notifications-message"]', { timeout: 10000 }).should('be.visible')
      }
    })
  })

  it('should redirect to social network links correctly in user publicprofile page', () => {
    // Visit user publicprofile page
    cy.visit('/fan/Cypress Tester')

    const socialNetworks = [
      { name: 'facebook', link: 'https://www.facebook.com/cypresstester' },
      { name: 'instagram', link: 'https://www.instagram.com/cypresstester' },
      { name: 'linkedin', link: 'https://www.linkedin.com/in/cypresstester' },
      { name: 'telegram', link: 'https://t.me/cypresstester' },
      { name: 'x', link: 'https://x.com/cypresstester' }
    ]

    socialNetworks.forEach((socialNetwork) => {
      // Assert the URL of the current the button
      cy.get(`[data-test="${socialNetwork.name}-btn"]`, { timeout: 15000 })
        .should('be.visible')
        .should('have.attr', 'href')
        .and('include', socialNetwork.link)
    })
  })
})
