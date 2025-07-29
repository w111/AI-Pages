import { test, expect } from '@playwright/test';

test('Анимация при наведении на карточку', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  const card = page.locator('.example-card').first();
  const shadowBefore = await card.evaluate(el => getComputedStyle(el).boxShadow);
  await card.hover();
  // Ждём анимацию через локатор вместо timeout
  await expect(card).toHaveCSS('transition', /.*box-shadow.*/);
  const shadowAfter = await card.evaluate(el => getComputedStyle(el).boxShadow);
  expect(shadowAfter).not.toBe(shadowBefore);
});
