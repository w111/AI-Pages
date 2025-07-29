import { test, expect } from '@playwright/test';

test('Переключение в тёмную тему', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });

  // Ожидание видимости label перед кликом
  const themeLabel = page.locator('label[for="themeSwitch"]');
  await themeLabel.waitFor({ state: 'visible' });
  await themeLabel.click();

  await expect(page.locator('body')).toHaveClass(/dark-theme/);

  // Проверить, что переключатель активен
  const themeSwitch = page.locator('#themeSwitch');
  await expect(themeSwitch).toBeChecked();

  // Проверить localStorage
  const themeValue = await page.evaluate(() => localStorage.getItem('theme'));
  expect(themeValue).toBe('dark');

  // (Опционально) Проверить цвет фона или текста
  const bgColor = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  expect(bgColor).not.toBe('rgb(248, 250, 252)'); // не светлая тема

  // Перезагрузить страницу и проверить, что тема сохранилась
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/dark-theme/);

  // Отключить тёмную тему через клик по метке
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  await themeLabel.waitFor({ state: 'visible' });
  await themeLabel.click();
  await expect(page.locator('body')).not.toHaveClass(/dark-theme/);

  // Проверить localStorage
  const themeValue2 = await page.evaluate(() => localStorage.getItem('theme'));
  expect(themeValue2).toBe('light');
});

test('Проверка цвета карточек в тёмной теме', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.getByTitle('Настройки').click();
  await page.locator('.settings-modal.show').waitFor({ state: 'visible' });
  const themeLabel = page.locator('label[for="themeSwitch"]');
  await themeLabel.waitFor({ state: 'visible' });
  await themeLabel.click();

  // Проверить цвет фона первой карточки
  const cardBg = await page.evaluate(
    () => getComputedStyle(document.querySelector('.example-card')).backgroundColor
  );
  // Цвет должен быть не белым (например, rgb(30, 41, 59) для тёмной темы)
  expect(cardBg).not.toBe('rgb(255, 255, 255)');
});
