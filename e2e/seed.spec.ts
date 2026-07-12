import { expect, test } from '@playwright/test';

/**
 * Seed spec — Playwright patterns for RentMe (M3L4).
 * Risk: R-08 — chronione trasy wymagają Firebase Auth (authGuard), nie samego URL.
 */
test.describe('R-08 auth guard — guest redirect', () => {
  test('niezalogowany użytkownik trafia na logowanie z /seeker', async ({ page }) => {
    await page.goto('/seeker');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('Logowanie')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeEnabled();
    await expect(page.getByRole('link', { name: 'Zarejestruj się' })).toBeVisible();
  });

  test('formularz logowania waliduje puste pola bez nawigacji', async ({ page }) => {
    const runId = Date.now();
    await page.goto('/auth/login');

    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('input[type="email"]')).toHaveValue('');
    await expect(page.getByText('Logowanie')).toBeVisible();

    // Unique run id — dokumentacja wzorca identyfikatorów (brak mutacji danych = brak cleanup)
    expect(runId).toBeGreaterThan(0);
  });
});
