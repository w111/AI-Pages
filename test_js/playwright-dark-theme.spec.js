import { test, expect } from '@playwright/test';

test('Тёмная тема по умолчанию, переключение и восстановление светлой темы', async ({
  page,
}) => {
  // Проверка темы ждёт DOM приложения, а не загрузку всех удалённых preview.
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#themeToggle')).not.toBeChecked();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(8, 12, 22)');
  await page.locator('label[title="Переключить тему"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#themeToggle')).toBeChecked();
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(250, 250, 250)'
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#themeToggle')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('label[title="Переключить тему"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
});

test('Фон карточки меняется вместе с темой', async ({ page }) => {
  // Проверка темы ждёт DOM приложения, а не загрузку всех удалённых preview.
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.tool-card').first();
  const dark = await card.evaluate(el => getComputedStyle(el).backgroundColor);
  await page.locator('label[title="Переключить тему"]').click();
  await expect
    .poll(async () => card.evaluate(el => getComputedStyle(el).backgroundColor))
    .not.toBe(dark);
});
