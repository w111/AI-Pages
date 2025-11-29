// @ts-check
import { test, expect } from '@playwright/test';

/**
 * @description Тесты для страницы поиска фильмов CineSearch
 */

test('CineSearch: должна загружаться главная страница', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await expect(page.locator('.logo')).toContainText('CineSearch');
  await expect(page.locator('#searchInput')).toBeVisible();
  await expect(page.locator('#searchBtn')).toBeVisible();
});

test('CineSearch: должны отображаться навигационные табы', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await expect(page.locator('.nav-tab').first()).toBeVisible();
  await expect(page.locator('.nav-tab[data-filter="all"]').first()).toHaveClass(
    /active/
  );
});

test('CineSearch: должны отображаться быстрые теги поиска', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/movie-search.html`);
  const quickTags = page.locator('.quick-tag');
  await expect(quickTags).toHaveCount(5);
  await expect(quickTags.first()).toContainText('Marvel');
});

test('CineSearch: должны отображаться секции с фильмами', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await expect(page.locator('#popularMoviesSection')).toBeVisible();
  await expect(page.locator('#popularSeriesSection')).toBeVisible();
});

test('CineSearch: переключение темы должно работать', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await expect(page.locator('body')).not.toHaveAttribute('data-theme', 'light');
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).not.toHaveAttribute('data-theme', 'light');
});

test('CineSearch: поиск по Enter должен работать', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await page.locator('#searchInput').fill('Matrix');
  await page.locator('#searchInput').press('Enter');
  await expect(page.locator('#searchResults')).toBeVisible();
});

test('CineSearch: клик по быстрому тегу должен запускать поиск', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await page.locator('.quick-tag[data-query="Marvel"]').click();
  await expect(page.locator('#searchInput')).toHaveValue('Marvel');
  await expect(page.locator('#searchResults')).toBeVisible();
});

test('CineSearch: переключение фильтра должно работать', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  await page.locator('.nav-tabs .nav-tab[data-filter="movie"]').click();
  await expect(page.locator('.nav-tabs .nav-tab[data-filter="movie"]')).toHaveClass(
    /active/
  );
  await page.locator('.nav-tabs .nav-tab[data-filter="series"]').click();
  await expect(page.locator('.nav-tabs .nav-tab[data-filter="series"]')).toHaveClass(
    /active/
  );
});

test('CineSearch: должна быть ссылка на главную страницу', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/movie-search.html`);
  const backLink = page.locator('footer a[href="index.html"]');
  await expect(backLink).toBeVisible();
});

test('CineSearch: модальное окно закрывается по кнопке', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  const firstCard = page.locator('.movie-card').first();
  await firstCard.waitFor({ state: 'visible', timeout: 15000 });
  await firstCard.click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/active/);
  await page.locator('#modalClose').click();
  await expect(page.locator('#modalOverlay')).not.toHaveClass(/active/);
});

test('CineSearch: модальное окно закрывается по Escape', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/movie-search.html`);
  const firstCard = page.locator('.movie-card').first();
  await firstCard.waitFor({ state: 'visible', timeout: 15000 });
  await firstCard.click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/active/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalOverlay')).not.toHaveClass(/active/);
});
