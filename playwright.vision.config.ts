import { defineConfig, devices } from '@playwright/test';

/**
 * Vision Track — 本番窓 UI（1420）スモーク。
 * global-setup で API を起動し、desktop dev:web を webServer で待ち受ける。
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/desktop-perception.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:1420',
    trace: 'on-first-retry',
    geolocation: { latitude: 35.6762, longitude: 139.6503 },
    permissions: ['geolocation'],
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm --filter @urms/desktop dev:web',
    url: 'http://127.0.0.1:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
