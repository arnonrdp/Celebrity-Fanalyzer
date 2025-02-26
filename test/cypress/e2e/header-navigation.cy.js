/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />

describe('Header navigation', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
    cy.wait(3000)
    cy.viewport('macbook-16')
    cy.login()
  })

  it('Should show the header with all elements', () => {
    cy.visit('/search')

    cy.get('.q-toolbar__title').should('exist')

    cy.get('[data-test="feedback-button"]').should('be.visible')
    cy.get('[data-test="notification-bubble-btn"]').should('be.visible')
    cy.get('[data-test="dropdown-menu"]').should('be.visible').click()
    cy.get('[data-test="create-prompt"]').should('be.visible')
    cy.get('[data-test="create-entry"]').should('be.visible')
    cy.get('[data-test="create-advertise"]').should('be.visible')
  })

  it('Should navigate between pages from the header', () => {
    cy.visit('/month', { timeout: 3000 })
    cy.get('[data-test="title"]').should('contain.text', 'Prompt Page')
    cy.visit('/search')
    cy.get('[data-test="title"]').should('contain.text', 'Search Archive')
    cy.get('[data-test="back-btn"]').click()
    cy.get('[data-test="title"]').should('contain.text', 'Prompt Page')
    cy.location('pathname').should('eq', '/month')
  })

  it('Should open dialogs for creating prompts, entries, and advertisements', () => {
    cy.visit('/search')

    // Open create prompt dialog
    cy.get('[data-test="dropdown-menu"]').click()
    cy.get('[data-test="create-prompt"]').click()
    cy.get('.q-dialog').should('be.visible')
    cy.get('.q-stepper__title').should('contain.text', 'New Prompt')
    cy.get('.q-dialog [data-test="button-cancel"]').click()

    // Open create entry dialog
    cy.get('[data-test="dropdown-menu"]').click()
    cy.get('[data-test="create-entry"]').click()
    cy.get('.q-dialog').should('be.visible')
    cy.get('.q-dialog').should('contain.text', 'New Entry')
    cy.get('.q-dialog [data-test="close-button"]').click()

    // Open create advertisement dialog
    cy.get('[data-test="dropdown-menu"]').click()
    cy.get('[data-test="create-advertise"]').click()
    cy.get('.q-dialog').should('be.visible')
    cy.get('w3m-modal', { timeout: 10000 }).should('be.visible')
  })
})
