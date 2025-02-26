/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests

describe('Commenting', async () => {
  const rand = Math.floor(Math.random() * 1_000)
  let comment = 'Comment ' + rand
  let reply = 'Reply ' + rand

  it('Comment CRUD : Create, like dislike ...', () => {
    cy.viewport('iphone-x')
    cy.login()
    // Visits the prompt of the month
    cy.visit('/month')

    // Programmatically change the q-tab-panel to the comments section
    cy.getByData('comments-tab').click()

    // Wait all comments to be loaded
    cy.getByData('comment-loaded')
    // navigate to the comment input form.
    cy.getByData('comment-main-box').type(comment + '{enter}')

    //Check the form is submitted successfully
    cy.get('.q-notification__message').contains('Comment successfully submitted')

    // Like Comment
    cy.getByData('like' + comment).click()

    // dislike comment
    cy.getByData('dislike' + comment + '').click()

    // expand the add reply form
    cy.wait(3000)
    cy.getByData(comment + '-add-reply').click()

    // fill add reply form input
    cy.getByData('fill-add-reply').type(reply)

    // submit filled add reply form
    cy.getByData('submit-fill-add-reply').click()

    //Check the form is submitted successfully
    cy.get('.q-notification__message').contains('Reply successfully submitted')

    cy.wait(3000)
    // Editing reply text
    cy.scrollTo('bottom')
    // Editing reply
    cy.wait(3000)
    cy.getByData(reply + '-option-button').click()

    cy.getByData('comment-select-edit').click()
    const oldReply = reply
    reply = 'Reply EDITED' + rand

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getByData(oldReply + '-comment-edit')
      .clear()
      .type(reply)

    cy.getByData('submit-edited-comment').click()
    cy.get('.q-notification__message').contains('Comment successfully edited!')
    cy.wait(3000)

    // deleting comment
    cy.getByData(reply + '-option-button').click()

    cy.getByData('comment-select-delete').click()
    cy.get('.q-notification__message').contains('Comment successfully deleted')

    // Editing comment
    cy.getByData(comment + '-option-button').click()

    cy.getByData('comment-select-edit').click()
    const oldComment = comment
    comment = 'Comment EDITED' + rand

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getByData(oldComment + '-comment-edit')
      .clear()
      .type(comment)

    cy.getByData('submit-edited-comment').click()
    cy.get('.q-notification__message').contains('Comment successfully edited!')
    cy.wait(3000)
    // deleting comment
    cy.getByData(comment + '-option-button').click()

    cy.getByData('comment-select-delete').click()
    cy.get('.q-notification__message').contains('Comment successfully deleted')
  })
})
