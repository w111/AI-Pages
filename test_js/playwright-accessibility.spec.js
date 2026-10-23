import { test, expect } from '@playwright/test';

test('Панель языка доступна последовательной навигацией Tab', async ({
  page,
  browserName,
}) => {
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.goto('/index.html');
  await page.locator('#themeToggle').focus();
  await page.keyboard.press(tab);
  await expect(page.locator('#langRu')).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator('#langEn')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hero-tagline')).toContainText('Turn ideas');
});

for (const theme of ['dark', 'light']) {
  test(`Контраст основного текста WCAG AA: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await page.goto('/index.html');
    const ratio = await page.locator('body').evaluate(el => {
      const luminance = color =>
        color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map(v => v / 255)
          .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const style = getComputedStyle(el);
      const a = luminance(style.color);
      const b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

test('Заголовки и основной landmark описывают непустой каталог', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('h1')).toHaveText('AI Pages');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('.category-title')).toHaveCount(5);
  await expect(page.locator('.tool-card h3').first()).toHaveText(
    'Python Editor (Pyodide)'
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('Изображения карточек имеют описательные alt', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.tool-card').first()).toBeVisible();
  const images = page.locator('.tool-card img');
  expect(await images.count()).toBeGreaterThan(40);
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute('alt', /\S/);
  }
});

test('Поиск и открытие приложения работают с клавиатуры', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#searchInput').focus();
  await expect(page.locator('#searchInput')).toBeFocused();
  await page.keyboard.type('Арканоид');
  await expect(page.locator('.tool-card')).toHaveCount(1);
  await page.locator('.tool-preview-link').focus();
  await expect(page.locator('.tool-preview-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/arcanoid_o3.html$/);
});
