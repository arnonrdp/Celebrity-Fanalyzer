const registerCodeCoverageTasks = require('@cypress/code-coverage/task')
const { injectQuasarDevServerConfig } = require('@quasar/quasar-app-extension-testing-e2e-cypress/cct-dev-server')
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'i4uq2d',
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  video: false,
  watchForFileChanges: false,
  defaultCommandTimeout: 90000,
  retries: {
    // Configure retry attempts for `cypress run`
    // Default is 0
    runMode: 2,
    // Configure retry attempts for `cypress open`
    // Default is 0
    openMode: 0
  },
  e2e: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config)
      return config
    },
    baseUrl: 'http://localhost:9200/',
    supportFile: 'test/cypress/support/e2e.js',
    specPattern: 'test/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    defaultCommandTimeout: 25000,
    pageLoadTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  component: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config)
      return config
    },
    supportFile: 'test/cypress/support/component.js',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'test/cypress/support/component-index.html',
    devServer: injectQuasarDevServerConfig()
  }
})
