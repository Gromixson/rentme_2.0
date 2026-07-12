import { BrowserContext, expect, test } from '@playwright/test';
import path from 'node:path';
import { hasDualAccountCreds } from './helpers/env';

const providerAuth = path.join(__dirname, '..', 'playwright', '.auth', 'provider.json');

/**
 * R-01 + R-03 — north star S-06: request → accept → booking widoczny u obu stron.
 * Wymaga dwóch kont Firebase + provider online z profilem.
 */
test.describe('R-01/R-03 accept booking flow', () => {
  test.skip(!hasDualAccountCreds(), 'Requires E2E_SEEKER_* and E2E_PROVIDER_* env vars');

  let providerContext: BrowserContext;

  test.afterEach(async () => {
    await providerContext?.close();
  });

  test('seeker wysyła prośbę, provider akceptuje — obie strony widzą CONFIRMED', async ({
    browser,
    page,
  }) => {
    const uniqueMessage = `E2E request ${Date.now()} — proszę o krótką usługę testową.`;

    providerContext = await browser.newContext({ storageState: providerAuth });
    const providerPage = await providerContext.newPage();

    await providerPage.goto('/provider');
    await expect(providerPage.getByRole('heading', { name: 'Panel usługodawcy' })).toBeVisible();

    const onlineSwitch = providerPage.getByRole('switch');
    if (!(await onlineSwitch.isChecked())) {
      await onlineSwitch.click();
      await expect(onlineSwitch).toBeChecked({ timeout: 10_000 });
    }

    await page.goto('/seeker');
    await expect(page.getByRole('heading', { name: 'Kategorie usług' })).toBeVisible();

    const seedButton = page.getByRole('button', { name: 'Załaduj kategorie' });
    if (await seedButton.isVisible()) {
      await seedButton.click();
      await expect(page.getByRole('heading', { name: 'Kategorie usług' })).toBeVisible();
    }

    const chooseButton = page.getByRole('button', { name: 'Wybierz' }).first();
    await expect(chooseButton).toBeVisible({ timeout: 15_000 });
    await chooseButton.click();

    await expect(page.getByRole('heading', { name: 'Usługodawcy online' })).toBeVisible();
    const sendRequestButton = page.getByRole('button', { name: 'Wyślij prośbę' }).first();
    await expect(sendRequestButton).toBeVisible({ timeout: 15_000 });
    await sendRequestButton.click();

    await page.locator('textarea').fill(uniqueMessage);
    await page.getByRole('button', { name: 'Wyślij' }).click();

    await expect(page).toHaveURL(/\/seeker\/waiting\//);
    await expect(page.getByRole('heading', { name: 'Oczekiwanie na odpowiedź' })).toBeVisible();
    await expect(page.getByText('Oczekuje')).toBeVisible();

    await providerPage.goto('/provider/requests');
    await expect(providerPage.getByText(uniqueMessage)).toBeVisible({ timeout: 20_000 });
    await providerPage.getByRole('button', { name: 'Akceptuj' }).click();

    await expect(providerPage).toHaveURL(/\/bookings/);
    await expect(providerPage.getByText('CONFIRMED')).toBeVisible({ timeout: 15_000 });

    await page.goto('/bookings');
    await expect(page.getByText('CONFIRMED')).toBeVisible({ timeout: 15_000 });

    // Cleanup: provider kończy usługę (status COMPLETED — brak wiszącego CONFIRMED)
    await providerPage.getByRole('button', { name: 'Zakończ usługę' }).click();
    await expect(providerPage.getByText('COMPLETED')).toBeVisible({ timeout: 15_000 });
  });
});
