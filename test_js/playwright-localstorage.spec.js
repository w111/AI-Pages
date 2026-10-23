import { test, expect } from '@playwright/test';

test('Тема, язык и вид сохраняются через реальные controls', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('label[title="Переключить тему"]').click();
  await page.locator('#langEn').click();
  await page.locator('#listViewBtn').click();
  expect(
    await page.evaluate(() => ({
      theme: localStorage.getItem('theme'),
      lang: localStorage.getItem('lang'),
      viewMode: localStorage.getItem('viewMode'),
    }))
  ).toEqual({ theme: 'light', lang: 'en', viewMode: 'list' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#themeToggle')).toBeChecked();
  await expect(page.locator('#langEn')).toHaveClass(/active/);
  await expect(page.locator('#listViewBtn')).toHaveClass(/active/);
  await expect(page.locator('.tool-card').first()).toHaveClass(/list-view/);
});
