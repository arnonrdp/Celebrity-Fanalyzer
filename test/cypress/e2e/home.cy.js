/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests
// See https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements

// ** This file is an example of how to write Cypress tests, you can safely delete it **

// This test will pass when run against a clean Quasar project
describe('Home page', () => {
  context('Roadmap Section', () => {
    it('Testing accordion', () => {
      cy.viewport(1280, 800)
      cy.visit('/')
      cy.get('h3').should('have.length', 4)
      cy.get('h3').eq(0).contains('“Celebrity Fanalyzer?”')
      cy.getByData('roadmap').find('h3').contains('Development Roadmap')

      cy.getByData('roadmap')
      cy.get('.q-expansion-item').eq(0).click()
    })
  })
  it('Should display properly', () => {
    cy.visit('/')
    cy.get('h2').contains('Welcome to Celebrity Fanalyzer!')
    // cy.get('h3').should('have.length', 3)
    cy.get('h3').eq(0).contains('“Celebrity Fanalyzer?”')
    cy.get('[data-test="roadmap"]').find('h3').contains('Development Roadmap')
  })
})
