// Playwright stability defaults for CI and local runs
module.exports = {
  use: {
    viewport: { width: 800, height: 1236 },
    deviceScaleFactor: 1,
    // timeout for actions
    actionTimeout: 10000,
    // navigationTimeout 0 => unlimited (we rely on explicit retries in smoke)
    navigationTimeout: 0,
    // expect default timeout for assertions and waiting helpers
    expect: { timeout: 20000 },
  },
  // retry flaky tests a couple times in CI
  retries: 2,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};
