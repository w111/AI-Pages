import { test, expect } from '@playwright/test';

test('Язык меняет тексты каталога и сохраняется после перезагрузки', async ({
  page,
}) => {
  await page.goto('/index.html');
  await page.locator('#langEn').click();
  await expect(page.locator('#langEn')).toHaveClass(/active/);
  await expect(page.locator('.hero-tagline')).toHaveText(
    'Turn ideas into code in minutes, not days'
  );
  await expect(page.locator('.category-title').first()).toHaveText('Development Tools');
  await expect(page.locator('#searchInput')).toHaveAttribute(
    'placeholder',
    'Find the right tool in seconds...'
  );
  await expect(page.locator('.footer-github')).toContainText('Source code on GitHub');
  await page.reload();
  await expect(page.locator('#langEn')).toHaveClass(/active/);
  await expect(page.locator('.hero-tagline')).toContainText('Turn ideas');
  await page.locator('#langRu').click();
  await expect(page.locator('.hero-tagline')).toHaveText(
    'Превратите идеи в код за минуты, а не дни'
  );
  await expect(page.locator('.category-title').first()).toHaveText(
    'Инструменты для разработки'
  );
});
