import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';
const authDir = path.join(__dirname, 'playwright', '.auth');

const seekerAuth = path.join(authDir, 'seeker.json');
const providerAuth = path.join(authDir, 'provider.json');

const hasSeekerCreds = !!(process.env.E2E_SEEKER_EMAIL && process.env.E2E_SEEKER_PASSWORD);
const hasProviderCreds = !!(process.env.E2E_PROVIDER_EMAIL && process.env.E2E_PROVIDER_PASSWORD);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup-seeker',
      testMatch: /auth\.setup\.ts/,
      grep: /seeker/,
    },
    {
      name: 'setup-provider',
      testMatch: /auth\.setup\.ts/,
      grep: /provider/,
    },
    {
      name: 'chromium-guest',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /seed\.spec\.ts/,
    },
    {
      name: 'chromium-seeker',
      use: {
        ...devices['Desktop Chrome'],
        storageState: seekerAuth,
      },
      dependencies: hasSeekerCreds ? ['setup-seeker'] : [],
      testMatch: /role-guard\.spec\.ts/,
    },
    {
      name: 'chromium-flow',
      use: { ...devices['Desktop Chrome'] },
      dependencies: hasSeekerCreds && hasProviderCreds ? ['setup-seeker', 'setup-provider'] : [],
      testMatch: /accept-booking\.spec\.ts/,
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
