import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:3001';
const API_URL = process.env.E2E_API_URL || 'http://localhost:4000/api/v1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'web-chromium', use: { ...devices['Desktop Chrome'], baseURL: WEB_URL } },
    { name: 'admin-chromium', use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL } },
  ],
  webServer: process.env.E2E_SKIP_SERVERS
    ? undefined
    : [
        {
          command: 'pnpm --filter web start',
          url: WEB_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});

export { WEB_URL, ADMIN_URL, API_URL };
