import { expect, test } from '@playwright/test';
import { seekerCreds } from './helpers/env';
import { loginViaUi } from './helpers/login';

/**
 * R-07 — SEEKER z activeRole nie może wejść na trasy /provider/* (roleGuard).
 * Multi-boundary: routing + auth state + UI (nagłówek roli).
 */
test.describe('R-07 role guard', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = seekerCreds();
    await loginViaUi(page, email, password);
  });

  test('seeker na /provider/requests zostaje przekierowany do strefy klienta', async ({ page }) => {
    await page.goto('/provider/requests');

    await expect(page).toHaveURL(/\/seeker(\/|$)/);
    await expect(page.getByText('Klient', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kategorie usług' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Oczekujące prośby' })).not.toBeVisible();
  });

  test('seeker nie widzi linku Prośby providera w nawigacji', async ({ page }) => {
    await page.goto('/seeker');

    await expect(page.getByRole('link', { name: 'Kategorie' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Moje prośby' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Prośby', exact: true })).not.toBeVisible();
  });
});
