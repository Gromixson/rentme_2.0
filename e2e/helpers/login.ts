import { expect, Page } from '@playwright/test';

/** Firebase Auth login via UI (client SDK — not POST /api/auth/login). */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/);
}
