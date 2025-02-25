/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />

describe('Feedback page', () => {
  beforeEach(() => {
    cy.viewport('ipad-2')
    cy.login()
  })

  it('Should user Give us feedback', () => {
    cy.visit('/profile')
    cy.get('.q-icon').contains('feedback').click()

    cy.get('[data-test="subject-input"]').type('Great Experience With Celebrity-Fanalyzer Platform')

    cy.get('[data-test="message-input"]').type(
      'Dear Celebrity-Fanalyzer Team,\n\nI wanted to say that Celebrity-Fanalyzer Platform is fantastic! The design is user-friendly, and the features are very engaging. I enjoy using it every day and look forward to more updates.\n\nThank you for your excellent work!\n\nBest regards,\nCypress Tester'
    )

    // Get the submit button and click it
    cy.get('[data-test="submit-button"] > .q-btn__content').click()

    //Check the Feedback submitted!
    cy.get('.q-notification__message').contains('Feedback submitted!')
  })

  it('should delete feedback with the subject "Great Experience With Celebrity-Fanalyzer Platform"', () => {
    cy.visit('/admin')

    cy.get('[data-test="feedbacks-tab"]').click()
    cy.wait(4000)

    const feedbackSubject = 'Great Experience With Celebrity-Fanalyzer Platform'

    // Ensure feedback with subject is visible in the table
    cy.get('[data-test="feedback-table"]').contains(feedbackSubject).should('be.visible')

    // Find the feedback card for the specific subject and click the delete button
    cy.contains(feedbackSubject)
      // Locate the card element that contains the feedback subject
      .closest('[data-test="feedback-card"]')
      // Find the trash button within the card
      .find('[data-test="trash-button"]')
      // Click the delete button
      .click()

    // Ensure the delete confirmation dialog is visible
    cy.get('[data-test="delete-dialog"]').should('be.visible')
    // Confirm dialog message contains the expected text

    cy.get('[data-test="delete-dialog-message"]').should('contain', `Are you sure you want to delete this feedback from`)
    // Click the delete button in the dialog to confirm deletion
    cy.get('[data-test="delete-button"]').click()

    // Ensure the feedback is removed from the table
    // Feedback should no longer be in the table
    cy.get('[data-test="feedback-table"]').contains(feedbackSubject).should('not.exist')

    // Verify the success notification appears
    cy.get('.q-notification').should('be.visible').and('contain', 'Feedback deleted successfully')
  })
})
