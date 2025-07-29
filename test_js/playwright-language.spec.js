import { test, expect } from '@playwright/test';

test('Переключение на английский язык', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const langLabel = page.locator('label[for="languageSwitch"]');
  await langLabel.waitFor({ state: 'visible' });
  await langLabel.click();
  await expect(page.locator('header h1')).toContainText('AI Pages');
  await expect(page.locator('body')).toContainText('Turn ideas into code in minutes');
});

test('Сохранение языка после перезагрузки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const langLabel = page.locator('label[for="languageSwitch"]');
  await langLabel.waitFor({ state: 'visible' });
  await langLabel.click();
  await page.reload();
  await expect(page.locator('body')).toContainText('Turn ideas into code in minutes');
});

test('Смена языка меняет все основные тексты на странице', async ({
  page,
  baseURL
}) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const langLabel = page.locator('label[for="languageSwitch"]');
  await langLabel.waitFor({ state: 'visible' });
  await langLabel.click();
  // Проверяем заголовок и подзаголовок
  await expect(page.locator('header h1')).toContainText('AI Pages');
  await expect(page.locator('.subtitle')).toContainText(
    'Turn ideas into code in minutes'
  );
  // Проверяем кнопки "Open"
  const openBtn = page.locator('.view-btn').first();
  await expect(openBtn).toContainText('Open');
  // Проверяем футер
  await expect(page.locator('footer')).toContainText('All examples are developed');
  // Проверяем, что хотя бы один заголовок карточки содержит '3D Balls'
  const headers = await page.locator('.example-card .card-header h3').allTextContents();
  expect(headers.some(text => text.includes('3D Balls'))).toBe(true);
});
