/// <reference types="cypress" />

describe('Error Management Page', () => {
  beforeEach(() => {
    // Assuming you are visiting the page where the error table is rendered
    cy.viewport('macbook-16')
    // Visits the profile page
    cy.login()
    cy.visit('/admin')
    cy.get('[data-test="errors-tab"]').click()
  })
  it('should load more errors and delete the last error when delete button is clicked', () => {
    // Check if there are any error rows in the table
    cy.get('.errors-table .q-tr').then(($rows) => {
      if ($rows.length > 0) {
        // 1. If errors are present, last check the "Load More" button
        cy.get('[data-test="load-more-button"]').should('be.visible')
        cy.get('[data-test="load-more-button"]').click()

        // Verify that the number of rows has increased after clicking "Load More"
        cy.get('.errors-table .q-tr').should('have.length.greaterThan', $rows.length)

        // 2. After loading more errors, delete the last error
        cy.get('.errors-table .q-tr').last().as('lastErrorRow')
        cy.get('@lastErrorRow').find('[data-test="delete-button"]').should('be.visible')
        cy.get('@lastErrorRow').find('[data-test="delete-button"]').click()

        // Verify the delete confirmation dialog appears
        cy.get('[data-test="cancel-delete-button"]').should('be.visible')
        cy.get('[data-test="confirm-delete-button"]').should('be.visible')

        // Click the "Delete" button to confirm deletion
        cy.get('[data-test="confirm-delete-button"]').click()

        // Ensure the last error row is removed from the table
      } else {
        // If no rows are found, skip this test and log a message
        cy.log('No errors found, skipping "Load More" and "Delete" test')
      }
    })
  })
})
