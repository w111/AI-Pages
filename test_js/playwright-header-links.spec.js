import { test, expect } from '@playwright/test';

test('Клик по заголовку карточки ведёт на нужную страницу', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/index.html`);
  const firstLink = page.locator('.example-card .card-header h3 a').first();
  const href = await firstLink.getAttribute('href');
  await firstLink.click();
  // Проверяем, что URL изменился. Serve убирает .html из URL
  const expectedPath = href.replace('.html', '');
  await expect(page).toHaveURL(new RegExp(expectedPath.replace('.', '\\.')));
});

test('Клик по кнопке "Открыть" ведёт на нужную страницу', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  const openBtn = page.locator('.example-card .card-footer .view-btn').first();
  const href = await openBtn.getAttribute('href');
  await openBtn.click();
  // Serve убирает .html из URL
  const expectedPath = href.replace('.html', '');
  await expect(page).toHaveURL(new RegExp(expectedPath.replace('.', '\\.')));
});
