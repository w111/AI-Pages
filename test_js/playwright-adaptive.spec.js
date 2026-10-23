import { test, expect } from '@playwright/test';

// Мобильные разрешения
test('Карточки в одну колонку на мобильном разрешении 375px', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseURL}/index.html`);
  // Проверяем, что только одна карточка в строке (ширина карточки почти равна ширине контейнера)
  const card = page.locator('.tool-card').first();
  const cardBox = await card.boundingBox();
  const container = page.locator('.tools-grid').first();
  const containerBox = await container.boundingBox();
  expect(cardBox.width).toBeGreaterThan(containerBox.width * 0.8);
});

test('Карточки в одну колонку на мобильном разрешении 360px', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`${baseURL}/index.html`);
  const card = page.locator('.tool-card').first();
  const cardBox = await card.boundingBox();
  const container = page.locator('.tools-grid').first();
  const containerBox = await container.boundingBox();
  expect(cardBox.width).toBeGreaterThan(containerBox.width * 0.8);
});

test('Контент читабелен без горизонтального скролла на 320px', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${baseURL}/index.html`);
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyScrollWidth).toBeLessThanOrEqual(320);
});

// Планшетные разрешения
test('Карточки в две колонки на планшете 800px', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 800, height: 1024 });
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.tool-card').first()).toBeVisible();
  await expect
    .poll(async () =>
      page
        .locator('.tools-grid')
        .first()
        .evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    )
    .toBe(2);
});

test('Планшетное разрешение 1024px оптимально использует пространство', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(`${baseURL}/index.html`);
  const container = page.locator('.tools-grid').first();
  const containerBox = await container.boundingBox();
  const cards = await page.locator('.tool-card').all();
  const cardBox = await cards[0].boundingBox();
  // На планшете должно быть минимум 2 колонки
  expect(cardBox.width).toBeLessThan(containerBox.width * 0.6);
});

// Большие экраны
test('Контент центрирован на больших экранах 1440px', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/index.html`);
  const container = page.locator('.container').first();
  const containerBox = await container.boundingBox();
  const viewportWidth = 1440;
  // Контейнер должен быть центрирован с отступами по бокам
  expect(containerBox.x).toBeGreaterThan(0);
  expect(containerBox.x + containerBox.width).toBeLessThan(viewportWidth);
});

test('Максимальная ширина контейнера на 4K экране', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${baseURL}/index.html`);
  const container = page.locator('.container').first();
  const containerBox = await container.boundingBox();
  // Контейнер не должен растягиваться на всю ширину экрана
  expect(containerBox.width).toBeLessThan(1920 * 0.9);
});

test('Оптимальная читаемость на больших экранах', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(`${baseURL}/index.html`);
  const cards = await page.locator('.tool-card').all();
  const firstCard = cards[0];
  const cardBox = await firstCard.boundingBox();
  // Карточки не должны быть слишком широкими для комфортного чтения
  expect(cardBox.width).toBeLessThanOrEqual(400);
});
