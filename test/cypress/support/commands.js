// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress'
import 'cypress-wait-until'
registerCommands()
Cypress.Commands.add('getByData', (selector) => {
  return cy.get(`[data-test="${selector}"]`)
})
Cypress.Commands.add('login', () => {
  cy.session('login', () => {
    cy.visit('/profile')
    // Fill the email and password fields and click the sign in button
    cy.get('[data-test="email-field"]', { timeout: 60000 }).type('test@test.com')
    cy.get('[data-test="password-field"]').type('12345678')
    cy.get('[data-test="sign-button"]').click()
    // Visits the Admin Page
    cy.getByData('tab-profile').click({ force: true })
    cy.visit('/admin')
    // cy.get('[href="/admin"]').click()
    cy.location('pathname').should('eq', '/admin/prompts')
  })
})
