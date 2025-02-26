/// <reference types="cypress" />

describe('Accessing the Terms of Service', () => {
  beforeEach(() => {
    cy.viewport('iphone-x')
  })

  it('Should find the Terms of Service, click on it and access Terms of Service', () => {
    // Visits the home page
    cy.visit('/')

    // Clicks on the Terms of Service button
    cy.get('[data-test="terms-of-service-button"]').click()

    // Checks if the URL is correct
    cy.location('pathname').should('eq', '/terms-of-service')

    // Checks if the page title is correct
    cy.get('h1').should('contain', 'Terms of Service')
  })
})
