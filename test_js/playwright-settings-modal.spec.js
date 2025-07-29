import { test, expect } from '@playwright/test';

test('Открытие и закрытие модального окна настроек', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await expect(page.locator('#settingsModal')).toBeVisible();
  // Клик вне модального окна
  await page.mouse.click(10, 10);
  await expect(page.locator('#settingsModal')).toBeHidden();
});
