import { test as setup } from '@playwright/test';
import path from 'node:path';
import { hasProviderCreds, hasSeekerCreds, providerCreds, seekerCreds } from './helpers/env';
import { loginViaUi } from './helpers/login';

const authDir = path.join(__dirname, '..', 'playwright', '.auth');
const seekerFile = path.join(authDir, 'seeker.json');
const providerFile = path.join(authDir, 'provider.json');

setup('authenticate seeker', async ({ page }) => {
  setup.skip(!hasSeekerCreds(), 'Set E2E_SEEKER_EMAIL and E2E_SEEKER_PASSWORD');
  const { email, password } = seekerCreds();
  await loginViaUi(page, email, password);
  await page.waitForURL(/\/(seeker|provider)(\/|$)/);
  await page.context().storageState({ path: seekerFile });
});

setup('authenticate provider', async ({ page }) => {
  setup.skip(!hasProviderCreds(), 'Set E2E_PROVIDER_EMAIL and E2E_PROVIDER_PASSWORD');
  const { email, password } = providerCreds();
  await loginViaUi(page, email, password);
  await page.waitForURL(/\/(seeker|provider)(\/|$)/);
  await page.context().storageState({ path: providerFile });
});
