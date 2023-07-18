/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests

describe('Commenting', async () => {
  beforeEach(() => {
    cy.viewport('iphone-x')
    cy.login()

    // Visits the prompt of the month
    cy.visit('/month').wait(3000)

    // Programmatically change the q-tab-panel to the comments section
    cy.get('[data-test="panel-3-navigator"]').click()

    // Wait all comments to be loaded
    cy.getByData('comment-loaded')
  })

  it('creating comment ', () => {
    // navigate to the comment input form.
    cy.get('[data-test="comment-main-box"]').type('Cypress-testing{enter}')

    //Check the form is submitted successfully
    cy.get('.q-notification__message').contains('Comment successfully submitted')
  })

  it('like comment', () => {
    cy.get('[data-test="likeCypress-testing"]').eq(0).click({ force: true })
  })

  it('dislike comment', () => {
    cy.get('[data-test="dislikeCypress-testing"]').eq(0).click({ force: true })
  })

  it('add reply comment', () => {
    // expand the add reply form
    cy.get('[data-test="Cypress-testing-add-reply"]').eq(0).click({ force: true })

    // fill add reply form input
    cy.get('[data-test="fill-add-reply"]').type('Added-Reply')

    // submit filled add reply form
    cy.get('[data-test="submit-fill-add-reply"]').click({ timeout: 5000 })

    //Check the form is submitted successfully
    cy.get('.q-notification__message').contains('Reply successfully submitted')
  })

  // it('editing reply text', () => {
  //   // expand the add reply form
  //   cy.get('[data-test="Cypress-testing-add-reply"]').click({ multiple: true })
  //
  //   cy.get('[data-test="Added-Reply-open-reply-edit-delete"]').click({ multiple: true, force: true }).wait(1000)
  //
  //   cy.get('[data-test="Added-Reply-open-reply-edit"]').click({ multiple: true, force: true })
  //
  //   cy.get('[data-test="Added-Reply-fillEditReply"]').eq(0).type('Edited-Reply', { multiple: true, force: true })
  //
  //   cy.get('[data-test="Added-ReplyEdited-Reply-submit-reply-edit"]').eq(0).click({ multiple: true, force: true })
  //
  //   //Check the form is submitted successfully
  //   cy.get('.q-notification__message').contains('Comment successfully edited!')
  // })
  //
  // it('deleting reply text', () => {
  //   cy.get('[data-test="Cypress-testing-add-reply"]').click()
  //
  //   cy.get('[data-test="Added-ReplyEdited-Reply-open-reply-edit-delete"]').eq(0).click({ multiple: true, force: true })
  //
  //   cy.get('[data-test="Added-ReplyEdited-Reply-open-reply-delete"]').click()
  // })

  it('editing comment', () => {
    cy.get('[data-test="Cypress-testing-reply-button"]').eq(0).click({ force: true })

    cy.get('[data-test="comment-select-edit"]').click()

    cy.get('[data-test="Cypress-testing-comment-edit"]').type('-EDITED')

    cy.get('[data-test="submit-edited-comment"]').click()
    cy.get('.q-notification__message').contains('Comment successfully edited!')
  })

  it('deleting comment', () => {
    cy.get('[data-test="Cypress-testing-EDITED-reply-button"]').eq(0).click({ force: true })

    cy.get('[data-test = "comment-select-delete"]').click()
    cy.get('.q-notification__message').contains('Comment successfully deleted')
  })
})
