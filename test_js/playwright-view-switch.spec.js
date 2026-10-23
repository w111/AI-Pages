import { test, expect } from '@playwright/test';

test('Вид списка сохраняет карточки и восстанавливается после перезагрузки', async ({
  page,
}) => {
  await page.goto('/index.html');
  await expect(page.locator('.tool-card').first()).toBeVisible();
  const count = await page.locator('.tool-card').count();
  await page.locator('#listViewBtn').click();
  await expect(page.locator('#listViewBtn')).toHaveClass(/active/);
  await expect(page.locator('#gridViewBtn')).not.toHaveClass(/active/);
  await expect(page.locator('.tool-card.list-view')).toHaveCount(count);
  await expect(page.locator('.tools-grid')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.tool-card.list-view')).toHaveCount(count);
  await page.locator('#gridViewBtn').click();
  await expect(page.locator('.tool-card.grid-view')).toHaveCount(count);
  await expect(page.locator('.tools-list')).toHaveCount(0);
});
