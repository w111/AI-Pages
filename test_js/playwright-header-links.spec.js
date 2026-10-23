import { test, expect } from '@playwright/test';

test('Превью и заголовок карточки открывают выбранное приложение', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#searchInput').fill('Арканоид');
  const link = page.locator('.tool-preview-link');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', 'arcanoid_o3.html');
  await expect(link.locator('h3')).toHaveText('Арканоид');
  await link.click();
  await expect(page).toHaveURL(/\/arcanoid_o3.html$/);
  await expect(page.locator('canvas')).toBeVisible();
});
