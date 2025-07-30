import { test, expect } from '@playwright/test';

test('Поиск по названию карточки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#cardSearch', 'Арканоид');
  await expect(page.locator('.example-card:visible')).toHaveCount(1);
  await expect(page.locator('.example-card:visible')).toContainText('Арканоид');
});

test('Поиск по тегу технологии', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#cardSearch', 'Three.js');
  await expect(page.locator('.example-card:visible')).toHaveCount(2); // 3D Balls и MP3 Визуализатор
});

test('Очистка поиска возвращает все карточки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#cardSearch', 'Арканоид');
  await expect(page.locator('.example-card:visible')).toHaveCount(1);
  await page.fill('#cardSearch', '');
  const count = await page.locator('.example-card:visible').count();
  expect(count).toBeGreaterThan(5);
});

test('Поиск по несуществующему запросу скрывает все карточки и категории', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#cardSearch', 'qwertyuiopasdfgh');
  await expect(page.locator('.example-card:visible')).toHaveCount(0);
  await expect(page.locator('.category:visible')).toHaveCount(0);
});
