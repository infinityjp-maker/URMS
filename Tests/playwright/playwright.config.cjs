// Playwright stability defaults for CI and local runs
module.exports = {
  use: {
    viewport: { width: 800, height: 1236 },
    deviceScaleFactor: 1,
    // timeout for actions (increase for CI network/IO latency)
    actionTimeout: 30000,
    // navigationTimeout 0 => unlimited (we rely on explicit retries in smoke)
    navigationTimeout: 0,
    // expect default timeout for assertions and waiting helpers
    expect: { timeout: 30000 },
    // launch options: prefer headless in CI, allow slowMo via env for debugging
    launchOptions: {
      headless: (process.env.PLAYWRIGHT_HEADFUL === '1') ? false : true,
      slowMo: Number(process.env.PLAYWRIGHT_SLOWMO || 0)
    }
  },
  // retry flaky tests a couple times in CI
  retries: 2,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};
