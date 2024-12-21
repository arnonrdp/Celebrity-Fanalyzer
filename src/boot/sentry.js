import * as Sentry from '@sentry/vue'

Sentry.init({
  dsn: 'https://fbf6f17dc1de5d78955f7e69a6a16d76@o4507662781382656.ingest.us.sentry.io/4507662784069632',
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ['localhost', /^https:\/\/feat-sentry\.celebrity-fanalyzer\.pages\.dev/],
  // Session Replay
  // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysSessionSampleRate: 0.1,
  // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  replaysOnErrorSampleRate: 1.0
})
