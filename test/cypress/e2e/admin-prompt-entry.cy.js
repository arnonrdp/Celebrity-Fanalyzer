/* eslint-disable cypress/unsafe-to-chain-command */
/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />
// Use `cy.dataCy` custom command for more robust tests
// See https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements

describe('Admin Prompt & Entry', () => {
  const name = 'Hello World!'
  let date = ''
  let visit = '/'
  beforeEach(() => {
    cy.viewport('macbook-16')
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false
    })
    cy.login()
    cy.visit('/admin')
  })

  it('Try to access non existing prompt page', () => {
    cy.visit('/not-exist-prompt')
    cy.get('.q-notification__message').contains('Not found')
    cy.get('.q-notification__message').contains('You will be redirected in 3 seconds')
    cy.location('pathname').should('eq', '/404')
  })

  it('Try To access non existing Entry page', () => {
    cy.visit('/not-exist-prompt')
    cy.get('.q-notification__message').contains('Not found')
    cy.get('.q-notification__message').contains('You will be redirected in 3 seconds')
    cy.location('pathname').should('eq', '/404')
    cy.get('.q-btn').click()
    cy.location('pathname').should('eq', '/')
  })

  it('should redirect to login and display a notification when attempting to create an entry without logging in', () => {
    // Clear local storage
    cy.clearLocalStorage()

    cy.visit('/month')
    // Ensure the "Create Entry" button exists and is visible
    cy.get('[data-test="create-entry"]').should('exist').and('be.visible')

    // Click the "Create entry" button without login
    cy.get('[data-test="create-entry"]').click()

    // Assert that the user is redirected to the login page
    cy.url().should('include', '/profile')

    // Assert the notification message
    cy.get('.q-notification').should('be.visible').and('contain.text', 'Please log in to create a new entry')
  })

  it('Cleanup: Delete Existing "Cypress Tester" Prompts Before Test', () => {
    // Search for the prompt
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(10000)

    // Check if the item cards exist
    cy.get('body').then(($body) => {
      const itemCards = $body.find('[data-test="item-card"]')

      if (itemCards.length > 0) {
        cy.log(`Found ${itemCards.length} "Cypress Tester" prompts. Deleting all...`)

        // Iterate through all item cards and delete them
        Array.from(itemCards).forEach(() => {
          // Delete the first visible prompt
          cy.get('[data-test="item-card"] > .text-right > [data-test="button-delete-prompt"]').first().click()

          // Confirm deletion
          cy.get('[data-test="confirm-delete-prompt"]').click()
          cy.wait(3000)

          // Verify the success notification
          cy.get('.q-notification__message').contains('Prompt successfully deleted')
        })

        cy.log('All "Cypress Tester" prompts successfully deleted.')
      } else {
        cy.log('No "Cypress Tester" prompts found to delete.')
      }
    })
  })

  it('Should correctly handle prompt creation time navigation and month selection process', () => {
    // Ensure initial number of item cards
    cy.get('[id="item-card"]', { timeout: 20000 }).should('have.length', 6)
    cy.wait(2000)

    // Open the dropdown and navigate to the MonthPicker
    cy.get('[data-test="dropdown-menu"]').click()
    cy.get('[data-test="create-prompt"]').should('be.visible').click()
    cy.get('[data-test="date-picker"]').click()

    // Verify the left navigation button is enabled initially and navigate to the previous year
    cy.get('[data-test="navigate-left"]').should('not.be.disabled').click()

    // Verify the year has decreased by one
    cy.get('[data-test="month-picker"]')
      .contains(new Date().getFullYear() - 1)
      .should('exist')

    // Navigate to the next year
    cy.get('[data-test="navigate-right"]').click()
    cy.get('[data-test="month-picker"]').contains(new Date().getFullYear()).should('exist')

    // Iterate over each month button to test disabled and enabled states
    cy.get('[data-test="month-btn"]').each(($monthBtn) => {
      if ($monthBtn.hasClass('disabled-month')) {
        // If the month is disabled, it should not be clickable
        cy.wrap($monthBtn).should('have.class', 'disabled-month').click({ force: true }).should('not.have.class', 'q-btn--active')
      } else {
        // If the month is enabled, it should be clickable and selected(Check background color change)
        cy.wrap($monthBtn)
          .click({ force: true })
          .should(($el) => {
            const bgColor = window.getComputedStyle($el[0]).backgroundColor
            expect(bgColor).to.not.equal('rgba(0, 0, 0, 0)')
          })
      }
    })

    // Verify the popup closes when clicking the "Close" button
    cy.get('[data-test="close-btn"]').click()
  })

  it('Should create a prompt', () => {
    // Get the dropdown button and click it
    cy.get('[data-test="dropdown-menu"]').click()
    // Get the first button (New Prompt) and click it
    cy.get('[data-test="create-prompt"]').should('be.visible').click()
    // Get the date input and choose the last option
    cy.get('[data-test="date-picker"]').should('be.visible').click()
    cy.get('[data-test="close-btn"]').click()
    cy.get('input[data-test="date"]')
      .invoke('val')
      .then((value) => {
        date = value
        visit += value.replace('-', '/')
      })

    // Get the title input and type 'Hello World!' into it
    cy.get('[data-test="input-title"]').type(name)

    // Get the description input and type 'This is a sample prompt' into it
    cy.get('[data-test="input-description"]').type('This is a sample prompt')

    // Get the file image input and upload the Cypress logo
    cy.get('[data-test="file-image"]').selectFile('src/assets/cypress.jpg')

    // Get the categories select and choose add 'Cypress' and 'Test' categories
    cy.get('[data-test="select-categories"]').type('Cypress{enter}').type('Test{enter}')

    // Get the submit button and click it
    cy.get('[data-test="button-submit"] > .q-btn__content').click()
    // cy.get('[data-test="button-submit"]').click()

    //Check the Prompt is submitted successfully
    cy.get('.q-notification__message').contains('Prompt successfully submitted')
  })

  it('should open the dialog when clicking the add button, display correct content, and close on hideDialog event', () => {
    cy.visit('/admin')

    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')

    const promptSlug = '/hello-world-'
    const promptTitle = 'Hello World!'

    // Check if the prompt title link is visible and clickable
    cy.get('[data-test="prompt-title"]').contains(promptTitle).should('have.attr', 'href', promptSlug).click()

    // Click the "Create entry" button
    cy.get('[data-test="create-entry"]').click()

    // Verify the dialog is visible
    cy.get('.q-dialog[data-test="entry-dialog"]').should('be.visible')
    // Click the "Close Entry Card" button
    cy.get('[data-test="close-button"]').click()

    // Verify the dialog is closed
    cy.get('.q-dialog[data-test="entry-dialog"]').should('not.exist')
  })

  it('Should create an entry', () => {
    // Get the dropdown button and click it
    cy.get('[data-test="dropdown-menu"]').click()

    // Get the first button (New Entry) and click it
    cy.get('[data-test="create-entry"]').should('be.visible').click()

    // Get the prompt select and choose the "Hello World!" option
    cy.get('[data-test="select-prompt"]').wait(4000).select('Hello World!')
    // Get the title input and type 'Hello World!' into it
    cy.get('[data-test="input-title"]').type(name)

    // Get the description input and type 'This is a sample entry' into it
    cy.get('[data-test="input-description"]').type('This is a sample entry')

    // Get the file image input and upload the Cypress logo
    cy.get('[data-test="file-image"]').selectFile('src/assets/cypress.jpg')

    // Get the submit button and click it
    cy.get('[data-test="button-submit"]').click()

    // Check the Entry is submitted successfully
    cy.get('.q-notification__message').contains('Entry successfully submitted')
  })

  it('Should create art carousel entry', () => {
    // Should find Cypress prompt and Cypress entry and click on edit button
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)
    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true })
    cy.get('[data-test="button-edit-entry"]', { timeout: 20000 }).should('exist').eq(0).click({ force: true })
    cy.get('.q-stepper__title').contains('Artist Carousel').should('be.visible').click({ force: true })
    cy.get('[data-test="artist-info-input"]').should('exist').type('Cypress author')
    cy.get('[data-test="upload-artist-photo"]').should('exist').selectFile('src/assets/cypress.jpg', { force: true })
    cy.get('[data-test="author-image"]').should('have.length', 1)
    cy.get('[data-test="upload-arts"]').should('exist').selectFile(Array(11).fill('src/assets/cypress.jpg'), { force: true })
    cy.get('.q-notification__message').contains('1 file(s) did not pass validation constraints')
    cy.get('[data-test="arts-images"]').should('have.length', 10)
    cy.wait(3000)
    cy.get('.q-card').scrollTo('bottom')
    cy.get('[data-test="cancel-button"]').should('be.visible').click({ force: true })
    cy.get('[data-test="button-edit-entry"]', { timeout: 20000 }).should('exist').eq(0).click({ force: true })
    cy.get('[data-test="arts-images"]').should('have.length', 0)
    cy.get('[data-test="author-image"]').should('have.length', 0)
  })

  it('Should Navigate in prompt and entry', () => {
    cy.visit(visit)
    cy.contains(name, { timeout: 20000 })
    cy.get('[data-test="like-button"]', { timeout: 25000 }).click({ force: true })
    cy.get('[data-test="like-button"]', { timeout: 25000 }).click({ force: true })
    cy.scrollTo('bottom')
    cy.get('[data-test="entry"]', { timeout: 25000 }).eq(0).find('[data-test="item-link"]').click({ force: true })
    cy.get('[data-test="entry-page"]', { timeout: 25000 }).eq(0).click({ force: true })
    cy.get('[data-test="like-button"]', { timeout: 25000 }).click({ force: true })
    cy.get('[data-test="like-button"]', { timeout: 25000 }).click({ force: true })
  })

  it('Should display the prompt and interact', () => {
    // cy.visit('/hello-world-')
    cy.visit(visit)
    cy.contains(name)
    cy.scrollTo('bottom')
    cy.get('[data-test="entries"]')
    cy.scrollTo('top')
    const likedIcon = '/icons/thumbs-up-bolder.svg'
    const likeIcon = '/icons/thumbs-up.svg'
    const dislikedIcon = '/icons/thumbs-down-bolder.svg'
    const dislikeIcon = '/icons/thumbs-down.svg'
    cy.get('[data-test="like-button"]')
      .find('img')
      .then(($img) => {
        /**
         * Like if isLiked
         */
        if ($img.attr('src') === likedIcon) {
          cy.get('[data-test="like-button"]').click()
        }
        cy.get('[data-test="like-button"]').find('img').should('have.attr', 'src').should('include', likeIcon)
      })
    cy.get('[data-test="dislike-button"]')
      .find('img')
      .then(($img) => {
        /**
         * Dislike if isDisliked
         */
        if ($img.attr('src') === dislikedIcon) {
          cy.get('[data-test="dislike-button"]').click()
        }
        cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikeIcon)
      })

    // Like then Like Aigain
    cy.get('[data-test="like-button"]').click()
    cy.get('[data-test="like-button"]').find('img').should('have.attr', 'src').should('include', likedIcon)
    cy.get('[data-test="like-button"]').click()
    cy.get('[data-test="like-button"]').find('img').should('have.attr', 'src').should('include', likeIcon)

    // Dislike then Dislike Aigain
    cy.get('[data-test="dislike-button"]').click()
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikedIcon)
    cy.get('[data-test="dislike-button"]').click()
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikeIcon)

    // Dislike Then Like
    cy.get('[data-test="dislike-button"]').click()
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikedIcon)
    cy.get('[data-test="like-button"]').click()
    cy.get('[data-test="like-button"]').find('img').should('have.attr', 'src').should('include', likedIcon)
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikeIcon)

    // Dislike A liked prompt
    cy.get('[data-test="dislike-button"]').click()
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikedIcon)

    // Dislike To have a not liked & not disliked prompt
    cy.get('[data-test="dislike-button"]').click()
    cy.get('[data-test="dislike-button"]').find('img').should('have.attr', 'src').should('include', dislikeIcon)
  })

  it("Should navigate to the author's profile page", () => {
    cy.wait(2000)

    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')

    const authorUid = 'NQFZGO9mCYYyJUMdihfvYqy7df43'
    const authorName = 'Cypress Tester'

    // Check if the author link is visible and clickable
    cy.get('[data-test="author-name"]').contains(authorName).should('have.attr', 'href', `/fan/${authorUid}`).click()

    // Verify the redirection to the author's profile page
    cy.location('pathname').should('eq', `/fan/${authorUid}`)
  })

  it('Should navigate to the prompt page when the title is clicked', () => {
    cy.wait(2000)

    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')

    const promptSlug = '/hello-world-'
    const promptTitle = 'Hello World!'

    // Check if the prompt title link is visible and clickable
    cy.get('[data-test="prompt-title"]').contains(promptTitle).should('have.attr', 'href', promptSlug).click().wait(2000)

    // Verify the redirection to the prompt page
    cy.location('pathname').should('eq', promptSlug)
  })

  it('Should display all entries in the entry table', () => {
    // Perform search action
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(2000)

    // Expand the table row if necessary
    cy.get(`[data-test="button-expand"] > span`)
      .eq(1)
      .then(() => {
        cy.get('span>i').contains('expand_more')
      })
    cy.get('[data-test="button-expand"]').click()

    // Get expand button after click and it should say expand_less
    cy.get(`[data-test="button-expand"] > span`)
      .eq(1)
      .then(() => {
        cy.get('span>i').contains('expand_less')
      })

    cy.wait(5000)

    // Verify the entry table is visible
    cy.get('[data-test="entry-table"]').should('be.visible')

    // Ensure the table contains at least one row
    cy.get('[data-test="entry-table"] tbody tr').should('have.length.greaterThan', 0)

    // Check specific data in the first row
    cy.get('[data-test="entry-table"] tbody tr')
      .eq(0)
      .within(() => {
        cy.get('[data-test="entry-title"]').should('not.be.empty')
        cy.get('[data-test="entry-author"]').should('not.be.empty')
        cy.get('[data-test="entry-date"]').should('not.be.empty')
      })
  })

  it("Should navigate to the entry author's profile page", () => {
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(2000)
    // Expand the table row if necessary
    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`).click()

    // Verify the entry table is visible
    cy.get('[data-test="entry-table"]').should('be.visible')

    const authorUid = 'NQFZGO9mCYYyJUMdihfvYqy7df43'
    const authorName = 'Cypress Tester'

    // Check if the author link is visible and clickable
    cy.get('[data-test="entry-author"]').contains(authorName).should('have.attr', 'href', `/fan/${authorUid}`).click()

    // Verify the redirection to the author's profile page
    cy.location('pathname').should('eq', `/fan/${authorUid}`)
  })

  it('Should navigate to the entry page when the title is clicked', () => {
    cy.wait(2000)

    cy.get('[data-test="input-search"]').type('Cypress Tester').wait(2000)

    // Expand the table row if necessary
    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`).click()

    // Verify the entry table is visible
    cy.get('[data-test="entry-table"]').should('be.visible')
    const entrySlug = `/${date.replace('-', '/')}/hello-world-`
    const entryTitle = 'Hello World!'

    // Check if the entry title link is visible and clickable
    cy.get('[data-test="entry-title"]').contains(entryTitle).should('have.attr', 'href', entrySlug).click().wait(2000)

    // Verify the redirection to the entry page
    cy.location('pathname').should('eq', entrySlug)
  })

  it('should test entry page tabs, comments interaction, edit dialog', () => {
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)
    // Expand the table row if necessary
    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`).click()

    // Verify the entry table is visible
    cy.get('[data-test="entry-table"]').should('be.visible')
    const entrySlug = `/${date.replace('-', '/')}/hello-world-`
    const entryTitle = 'Hello World!'

    // Check if the entry title link is visible and clickable
    cy.get('[data-test="entry-title"]').contains(entryTitle).should('have.attr', 'href', entrySlug).click()
    // Verify the redirection to the entry page
    cy.location('pathname').should('eq', entrySlug)
    // 1. Verify Tabs and Panels
    cy.get('[data-test="tabs-selector"]').should('be.visible')

    // Switch to Post Tab
    cy.get('[data-test="tab-post"]').click()
    cy.get('[data-test="entry-page"]').should('be.visible')

    // Switch to Stats Tab
    cy.get('[data-test="tab-stats"]').click()
    cy.get('[data-test="tab-panel-stats"]').should('be.visible')

    // Switch to Comments Tab
    cy.get('[data-test="tab-comments"]').click()
    cy.get('[data-test="tab-panel-comments"]').should('be.visible')

    // Switch to Post Tab
    cy.get('[data-test="tab-post"]').click()
    cy.get('[data-test="entry-page"]').should('be.visible')
    // Switch to Comments Tab with comments button
    cy.get('[data-test="comments"]').click().wait(1000)
    cy.get('[data-test="tab-panel-comments"]').should('be.visible')
    // Switch to Post Tab
    cy.get('[data-test="tab-post"]').click()
    cy.get('[data-test="entry-page"]').should('be.visible')

    // 3. Open and Close the Edit Dialog
    cy.get('[data-test="edit"]').click().wait(1000)

    cy.get('[data-test="edit-entry-dialog"]').should('be.visible')

    cy.get('[data-test="close-button"]').click()

    cy.get('[data-test="edit-entry-dialog"]').should('not.exist')
  })

  it('should display the correct tooltip text for the expand/collapse button', () => {
    cy.get('[data-test="item-card"]')
      .first()
      .within(() => {
        cy.get('[data-test="button-expand"]').trigger('mouseenter')
      })

    cy.wait(500)

    cy.get('[data-test="item-card"]')
      .first()
      .then(($card) => {
        const allNodes = $card[0].querySelectorAll('*')
        let commentNode

        allNodes.forEach((node) => {
          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === Node.COMMENT_NODE && child.data.trim() === 'teleport start') {
              commentNode = child
            }
          })
        })

        expect(commentNode).to.exist
      })
  })

  it('Should edit the prompt', () => {
    // Get the second button (edit Prompt) and click it
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)

    // Get the edit button and click it
    cy.get(`[data-test="item-card"] > .text-right > [data-test="button-edit"]`, { timeout: 20000 }).click()

    cy.get('[data-test="input-title"]').clear()
    cy.get('[data-test="input-title"]').type(name)

    // Get the description input and type 'This is a sample prompt' into it
    cy.get('[data-test="input-description"]').clear()
    cy.get('[data-test="input-description"]').type('This is a Updated sample prompt')

    // Get the file image input and upload the Cypress logo
    cy.get('[data-test="file-image"]').selectFile('src/assets/cypress.jpg')

    // Get the categories select and choose add 'Cypress' and 'Test' categories
    cy.get('[data-test="select-categories"]').type('Cypress{enter}').type('Update{enter}')

    // Get the submit button and click it
    cy.get('[data-test="button-submit"] > .q-btn__content').click()
    // cy.get('[data-test="button-submit"]').click()

    //Check the Prompt is edited successfully
    cy.get('.q-notification__message').contains('Prompt successfully edited')
  })

  it('Should update image using camera capture', () => {
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)
    cy.get(`[data-test="item-card"] > .text-right > [data-test="button-edit"]`, { timeout: 20000 }).click()

    cy.get('[data-test="button-camera-capture"]').click()

    cy.window().then((win) => {
      const fakeStream = {
        getTracks: () => [{ stop: cy.stub() }]
      }
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves(fakeStream)

      cy.get('.web-cam-taker > .absolute-top').should('be.visible')
      cy.contains('CAPTURE').click()

      cy.contains('Done').click()
    })

    cy.get('[data-test="button-submit"] > .q-btn__content').click()

    cy.get('.q-notification__message').contains('Prompt successfully edited')
  })

  it('Should edit a entry', () => {
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)

    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`, { timeout: 20000 }).click({ force: true })

    // Get the edit button and click it
    cy.get('[data-test="button-edit-entry"]', { timeout: 20000 }).eq(0).click({ force: true })
    // Get the title input and type 'Update entry' into it
    cy.get('[data-test="input-title"]').clear()
    cy.get('[data-test="input-title"]').type('Update entry')

    // Get the description input and type 'This is a Updated entry' into it
    cy.get('[data-test="input-description"]').clear()
    cy.get('[data-test="input-description"]').type('This is a Updated entry')
    cy.wait(2000)
    // Get the file image input and upload the Cypress logo
    cy.get('[data-test="file-image"]').selectFile('src/assets/cypress.jpg')

    // Get the submit button and click it
    cy.get('[data-test="button-submit"]').eq(0).click({ force: true })
  })

  it('Should delete the entry', () => {
    // Get the second button (Delete Entry) and click it
    cy.get('[data-test="input-search"]', { timeout: 20000 }).type('Cypress Tester')
    cy.wait(5000)

    // Get the expand button and click it
    cy.get(`[data-test="item-card"] > .q-table--col-auto-width > [data-test="button-expand"]`).click()
    // Delete all entry in a prompt and left one
    cy.get('[data-test="button-delete-entry"]').then(($btn) => {
      for (let i = $btn.length - 1; i > 0; i--) {
        cy.get('[data-test="button-delete-entry"]').eq(i).click({ force: true })
        // Verify the dialog appears with correct title
        cy.get('[data-test="entry-delete-dialog"]').should('be.visible')
        cy.contains('h6', 'Delete Entry?').should('exist')
        cy.get('[data-test="confirm-delete-entry"]').click()
        // Wait the notification
        cy.get('.q-notification__message').contains('Entry deleted')
        cy.wait(4000)
      }
    })
    cy.wait(4000)

    // Delete the last one
    cy.get('[data-test="button-delete-entry"]').eq(0).click({ force: true })
    // Verify the dialog appears with correct title
    cy.get('[data-test="entry-delete-dialog"]').should('be.visible')
    cy.contains('h6', 'Delete Entry?').should('exist')
    cy.get('[data-test="confirm-delete-entry"]').click()
    // Wait the notification
    cy.get('.q-notification__message').contains('Entry deleted')
  })

  it('Should delete the prompt', () => {
    // Get the second button (Delete Prompt) and click it
    cy.get('[data-test="input-search"]').type('Cypress Tester')
    cy.wait(2000)

    // Get the delete button and click it
    cy.get(`[data-test="item-card"] > .text-right > [data-test="button-delete-prompt"]`).click()

    // Get the confirm button and click it
    cy.get('[data-test="confirm-delete-prompt"]', { timeout: 20000 }).click()

    // Wait the notification
    cy.get('.q-notification__message').contains('Prompt successfully deleted')
  })

  it('Should load more prompt when clicking "Load More" button', () => {
    cy.wait(5000)
    cy.get('[id="item-card"]', { timeout: 10000 }).should('have.length', 6)
    cy.wait(5000)
    cy.get('[data-test="load-more-btn"]').first().click({ force: true })
    cy.get('[id="item-card"]').should('have.length.greaterThan', 6)
  })

  it('Should share a prompt', () => {
    cy.get('[data-test="item-card"]', { timeout: 20000 }).should('have.length', 6)
    cy.wait(5000)
    cy.get('[data-test="share-button"]').first().click({ force: true })

    cy.get('.q-card > .row > :nth-child(1) > img').should('be.visible')
    cy.get('.q-card > .row > :nth-child(1) > img').click({ force: true })
    cy.get('.q-card').should('not.be.visible')
  })

  it('should allow searching for prompts', () => {
    cy.get('[data-test="input-search"]').type('test')
    cy.get('[data-test="prompt-title"]').first().should('contain.text', 'test')
  })

  it('Should expand prompt item', () => {
    // Get expand button and it should say expand_more
    cy.get(`[data-test="button-expand"] > span`)
      .eq(1)
      .then(() => {
        cy.get('span>i').contains('expand_more')
      })
    cy.get('[data-test="button-expand"]').first().click({ force: true })

    // Get expand button after click and it should say expand_less
    cy.get(`[data-test="button-expand"] > span`)
      .eq(1)
      .then(() => {
        cy.get('span>i').contains('expand_less')
      })

    cy.wait(5000)

    // Entries should be fetched (or empty list)
    cy.get('[data-test="entriesFetched"]').should('be.visible')
  })

  it('should manage classes on tabs correctly', () => {
    cy.get('[href="/"]').should('have.class', 'q-tab--inactive')

    // Navigate to a non-admin route
    cy.visit('/search')
    cy.get('[href="/search"]').should('not.have.class', 'q-tab--inactive')

    // Check adminTab classes
    cy.visit('/admin')
    cy.get('.adminTab').should('have.class', 'q-tab--active')
    cy.get('.adminTab').should('have.class', 'cursor-pointer')
  })

  it('should correctly handle home and admin tab class management on navigation', () => {
    cy.visit('/admin')
    cy.get('.adminTab').should('have.class', 'admin_tab')
    cy.get('[href="/"]').should('have.class', 'q-tab--inactive')

    // Navigate to home route
    cy.visit('/')
    cy.get('[href="/"]').should('not.have.class', 'q-tab--inactive')
    cy.get('.adminTab').should('not.have.class', 'admin_tab')
  })
})
