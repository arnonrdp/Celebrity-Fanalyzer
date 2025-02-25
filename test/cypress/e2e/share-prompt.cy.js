/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />

describe('Sharing a Prompt', () => {
  beforeEach(() => {
    cy.viewport('macbook-16')
    // Adding the uncaught:exception handler
    cy.on('uncaught:exception', (err, runnable) => {
      // Returning false here prevents Cypress from
      // failing the test when ResizeObserver errors occur
      if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false
      }
    })
  })

  it('Should display properly and navigate to /month page', () => {
    let initialValue = 0
    // Visits the month page and waits for 5 seconds for the page to load
    cy.visit('/month')

    // Selects the share button on the page and clicks it
    cy.get('[data-test="share-button"]').click()

    cy.get('[data-test="share-button"] > .q-btn__content > .block')
      .invoke('text')
      .then(($value) => {
        initialValue = parseFloat($value)
      })

    // Selects the first card on the page (copy to clipboard) and clicks it
    cy.get('.q-card > .row > :nth-child(1) > img').should('be.visible').click()

    // Select the amount of shares to see if its value is greater than 0
    cy.get('[data-test="share-button"] > .q-btn__content > .block', { timeout: 10000 })
      .invoke('text')
      .then(parseFloat)
      .should('be.greaterThan', initialValue)

    // Selects the second card on the page and clicks it
    cy.get('[data-test="graph-tab"]').click({ force: true })

    // Selects the second canvas on the page and checks to see if it is visible
    cy.get('canvas').eq(1).should('be.visible')
  })
})
