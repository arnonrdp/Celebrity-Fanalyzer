/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests
// See https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements

// ** This file is an example of how to write Cypress tests, you can safely delete it **

// This test will pass when run against a clean Quasar project
describe('Home page', () => {
  const name = 'Hello World!'

  // it('Should create a prompt', () => {
  //   cy.login()
  //   // cy.wait(1000)
  //   cy.visit('/admin')
  //   // Get the dropdown button and click it
  //   cy.get('[data-test="dropdown-menu"]').click()
  //   // Get the first button (New Prompt) and click it
  //   cy.get('[data-test="create-prompt"]').should('be.visible').click()
  //   // Get the date input and choose the last option
  //   cy.get('[data-test="date-picker"]').should('be.visible').click()
  //   cy.get('[data-test="close-btn"]').click()
  //
  //   // Get the title input and type 'Hello World!' into it
  //   cy.get('[data-test="input-title"]').type(name)
  //
  //   // Get the description input and type 'This is a sample prompt' into it
  //   cy.get('[data-test="input-description"]').type('This is a sample prompt')
  //
  //   // Get the file image input and upload the Cypress logo
  //   cy.get('[data-test="file-image"]').selectFile('src/assets/cypress.jpg')
  //
  //   // Get the categories select and choose add 'Cypress' and 'Test' categories
  //   cy.get('[data-test="select-categories"]').type('Cypress{enter}')
  //
  //   cy.get('[data-test="select-categories"]').type('Test{enter}')
  //   // Get the submit button and click it
  //   cy.get('[data-test="button-submit"] > .q-btn__content').click()
  //   // cy.get('[data-test="button-submit"]').click()
  //
  //   //Check the Prompt is submitted successfully
  //   cy.get('.q-notification__message').contains('Prompt successfully submitted')
  // })

  // it('should redirect to login and display a notification when attempting to create an entry without logging in', () => {
  //   // Clear local storage
  //   cy.clearLocalStorage()
  //
  //   cy.visit('/hello-world-')
  //   // Ensure the "Create Entry" button exists and is visible
  //   cy.get('[data-test="create-entry"]').should('exist').and('be.visible')
  //
  //   // Click the "Create entry" button without login
  //   cy.get('[data-test="create-entry"]').click()
  //
  //   // Assert that the user is redirected to the login page
  //   cy.url().should('include', '/profile')
  //
  //   // Assert the notification message
  //   cy.get('.q-notification').should('be.visible').and('contain.text', 'Please log in to create a new entry')
  // })

  // it('Should delete the prompt', () => {
  //   cy.login()
  //   cy.visit('/admin')
  //   // Get the second button (Delete Prompt) and click it
  //   cy.get('[data-test="input-search"]').type('Cypress Tester')
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(2000)
  //
  //   // Get the delete button and click it
  //   cy.get(`[data-test="item-card"] > .text-right > [data-test="button-delete-prompt"]`).click()
  //
  //   // Get the confirm button and click it
  //   cy.get('[data-test="confirm-delete-prompt"]').click()
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(2000)
  //
  //   // Wait the notification
  //   cy.get('.q-notification__message').contains('Prompt successfully deleted')
  // })
})
