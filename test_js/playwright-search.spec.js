import { test, expect } from '@playwright/test';

test('Поиск по названию карточки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#searchInput', 'Арканоид');
  await expect(page.locator('.tool-card:visible')).toHaveCount(1);
  await expect(page.locator('.tool-card:visible')).toContainText('Арканоид');
});

test('Поиск по тегу технологии', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#searchInput', 'Three.js');
  await expect(page.locator('.tool-card:visible')).toHaveCount(3); // 3D Balls, MP3 Visualizer и Radio Globe
});

test('Очистка поиска возвращает все карточки', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#searchInput', 'Арканоид');
  await expect(page.locator('.tool-card:visible')).toHaveCount(1);
  await page.fill('#searchInput', '');
  const count = await page.locator('.tool-card:visible').count();
  expect(count).toBeGreaterThan(5);
});

test('Поиск по несуществующему запросу скрывает все карточки и категории', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/index.html`);
  await page.fill('#searchInput', 'qwertyuiopasdfgh');
  await expect(page.locator('.tool-card:visible')).toHaveCount(0);
  await expect(page.locator('.category-section:visible')).toHaveCount(0);
});
