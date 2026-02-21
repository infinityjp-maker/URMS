// Playwright stability defaults for CI and local runs
module.exports = {
  use: {
    viewport: { width: 800, height: 1236 },
    deviceScaleFactor: 1,
    // timeout for actions
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};
