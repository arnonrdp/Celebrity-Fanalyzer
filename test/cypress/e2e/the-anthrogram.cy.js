/// <reference types="cypress" />

describe('TheAnthrogram Graph Visibility', () => {
  beforeEach(() => {
    cy.viewport('macbook-16')
    cy.visit('/month', { timeout: 2000 })

    cy.get('[data-test="post-title"]')
      .invoke('text')
      .then((postTitle) => {
        const monthPromptTitle = postTitle.trim().toLowerCase().replace(/\s+/g, '-')
        cy.wrap(monthPromptTitle).as('monthTitle')
      })

    cy.get('@monthTitle').then((title) => {
      cy.visit(`/${title}`)
      cy.log('Navigated to:', title)
    })

    const likedIcon = '/icons/thumbs-up-bolder.svg'

    // Check if the like icon is already in the liked state
    cy.get('[data-test="like-button"] img')
      .invoke('attr', 'src')
      .then((src) => {
        if (!src.includes(likedIcon)) {
          cy.get('[data-test="like-button"]').click()
          cy.get('[data-test="like-button"] img').should('have.attr', 'src').should('include', likedIcon)
        }
      })

    // Get initial share count and only click when it's exactly 0
    cy.get('[data-test="share-button"] > .q-btn__content > .block')
      .invoke('text')
      .then(parseFloat)
      .then((initialValue) => {
        if (initialValue === 0) {
          cy.get('[data-test="share-button"]').click()
          cy.get('.q-card > .row > :nth-child(1) > img').should('be.visible').click()
          cy.get('[data-test="share-button"] > .q-btn__content > .block').invoke('text').then(parseFloat).should('be.greaterThan', 0)
        }
      })

    cy.visit('/month', { timeout: 2000 })
    cy.get('[data-test="graph-tab"]').click({ force: true })

    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false
      }
    })
  })

  it('should render the HalfDonought graph if stats data is available', () => {
    cy.get('[data-test="half-donought"]', { timeout: 10000 }).should('be.visible')
  })

  it('should display the header with the correct title', () => {
    cy.get('header').contains('Anthrogram').should('be.visible')
  })

  it('should render the VisitorsBar graph if visitor data is available', () => {
    cy.get('[data-test="visitors-bar"]', { timeout: 10000 }).should('be.visible')
  })

  it('should conditionally render the CTRBar if isAdd is true', () => {
    cy.window().then((win) => {
      const isAdd = win.__vue_app__?.config?.globalProperties?.isAdd || false
      if (isAdd) {
        cy.get('[data-test="ctr-bar"]').should('be.visible')
      } else {
        cy.log('isAdd is false; CTRBar is not rendered')
        cy.get('[data-test="ctr-bar"]').should('not.exist')
      }
    })
  })

  it('should render the SharesPie graph if shares data is available', () => {
    cy.get('[data-test="shares-pie"]', { timeout: 10000 }).should('be.visible')
  })

  it('should conditionally render the LikesBar graph if likes or dislikes data is available', () => {
    cy.get('[data-test="likes-bar"]', { timeout: 10000 }).should('be.visible', { timeout: 5000 })
  })

  // TODO POPULARITY GAUGE IS DISABLED TEMPORARILY
  // it('should render the PopularityGauge for user popularity if user rating is available', () => {
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(10000)
  //   cy.get('[data-test="user-popularity"]', { timeout: 5000 }).should('be.visible')
  // })

  it('should render the LeafletMap if interaction data by country is available', () => {
    cy.get('#map', { timeout: 10000 }).should('exist')
  })

  it('should correctly toggle tabs and display the respective data', () => {
    cy.get('[data-test="visitors-bar"]').should('be.visible')
    cy.get('[data-test="q-tab-weekly"]').click()
    cy.get('[data-test="visitors-bar"]').should('be.visible')
    cy.get('[data-test="q-tab-monthly"]').click()
    cy.get('[data-test="visitors-bar"]').should('be.visible')
  })
})
