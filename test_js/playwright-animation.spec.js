import { test, expect } from '@playwright/test';

test('Наведение меняет тень карточки с CSS transition', async ({ page }) => {
  await page.goto('/index.html');
  await page.mouse.move(0, 0);
  const card = page.locator('.tool-card').first();
  await expect(card).toBeVisible();
  const shadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
  await expect(card).toHaveCSS('transition-duration', '0.5s');
  await card.hover();
  await expect
    .poll(async () => card.evaluate(el => getComputedStyle(el).boxShadow))
    .not.toBe(shadow);
});
