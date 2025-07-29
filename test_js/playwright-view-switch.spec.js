import { test, expect } from '@playwright/test';

test('Переключение на вид списка', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const viewLabel = page.locator('label[for="viewSwitch"]');
  await viewLabel.waitFor({ state: 'visible' });
  await viewLabel.click();
  await expect(page.locator('.container')).toHaveClass(/list-view/);
});

test('Сохранение вида после перезагрузки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const viewLabel = page.locator('label[for="viewSwitch"]');
  await viewLabel.waitFor({ state: 'visible' });
  await viewLabel.click();
  await page.reload();
  await expect(page.locator('.container')).toHaveClass(/list-view/);
});
