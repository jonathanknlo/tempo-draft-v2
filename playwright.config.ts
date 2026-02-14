import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential for this simulation
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single worker for multi-browser tests
  reporter: 'list',
  use: {
    baseURL: 'https://tempo-draft-v2.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});