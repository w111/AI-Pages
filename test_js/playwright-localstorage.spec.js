import { test, expect } from '@playwright/test';

test('Сохранение всех настроек в localStorage', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const themeLabel = page.locator('label[for="themeSwitch"]');
  const langLabel = page.locator('label[for="languageSwitch"]');
  const viewLabel = page.locator('label[for="viewSwitch"]');
  await themeLabel.waitFor({ state: 'visible' });
  await langLabel.waitFor({ state: 'visible' });
  await viewLabel.waitFor({ state: 'visible' });
  await themeLabel.click();
  await langLabel.click();
  await viewLabel.click();
  const theme = await page.evaluate(() => localStorage.getItem('theme'));
  const lang = await page.evaluate(() => localStorage.getItem('language'));
  const view = await page.evaluate(() => localStorage.getItem('view'));
  expect(theme).toBe('dark');
  expect(lang).toBe('en');
  expect(view).toBe('list');
});

test('Восстановление всех настроек после перезагрузки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  // Устанавливаем все настройки
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const themeLabel = page.locator('label[for="themeSwitch"]');
  const langLabel = page.locator('label[for="languageSwitch"]');
  const viewLabel = page.locator('label[for="viewSwitch"]');
  await themeLabel.waitFor({ state: 'visible' });
  await langLabel.waitFor({ state: 'visible' });
  await viewLabel.waitFor({ state: 'visible' });
  await themeLabel.click();
  await langLabel.click();
  await viewLabel.click();
  // Перезагружаем страницу
  await page.reload();
  // Проверяем, что все настройки восстановились
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
  await expect(page.locator('#languageSwitch')).toBeChecked();
  await expect(page.locator('#viewSwitch')).toBeChecked();
});
