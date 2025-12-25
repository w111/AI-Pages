import { test, expect } from '@playwright/test';

/**
 * Тесты для Movie Recommender - системы рекомендаций фильмов
 */

test.describe('Movie Recommender - Загрузка страницы', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/movie-recommender.html`);
  });

  test('Страница загружается корректно', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('Рекомендатор фильмов');
    await expect(page.locator('.progress-section')).toBeVisible();
    await expect(page.locator('.tabs')).toBeVisible();
    await expect(page.locator('#moviesGrid')).toBeVisible();
  });

  test('Отображаются карточки фильмов', async ({ page }) => {
    await expect(page.locator('.movie-card').first()).toBeVisible();
    const cardsCount = await page.locator('.movie-card').count();
    expect(cardsCount).toBeGreaterThan(10);
  });
});

test.describe('Movie Recommender - Поиск и фильтры', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/movie-recommender.html`);
  });

  test('Поиск фильмов работает', async ({ page }) => {
    await page.locator('#searchInput').fill('Matrix');
    await expect(page.locator('.movie-card')).toHaveCount(1);
    await expect(page.locator('.movie-title').first()).toContainText('Матрица');
  });

  test('Фильтр по жанрам работает', async ({ page }) => {
    await page.locator('.genre-btn', { hasText: 'Комедия' }).click();
    await expect(page.locator('.genre-btn.active')).toContainText('Комедия');
    const count = await page.locator('.movie-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(150);
  });
});

test.describe('Movie Recommender - Оценки', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/movie-recommender.html`);
  });

  test('Оценка фильма работает', async ({ page }) => {
    const firstCard = page.locator('.movie-card').first();
    await firstCard.locator('.star').nth(3).click();
    const activeStars = await firstCard.locator('.star.active').count();
    expect(activeStars).toBe(4);
    await expect(page.locator('#ratedCount')).toContainText('1');
  });

  test('Прогресс обновляется при оценке', async ({ page }) => {
    const cards = page.locator('.movie-card');
    for (let i = 0; i < 5; i++) {
      await cards.nth(i).locator('.star').nth(4).click();
    }
    await expect(page.locator('#ratedCount')).toContainText('5');
  });

  test('LocalStorage сохраняет оценки', async ({ page }) => {
    await page.locator('.movie-card').first().locator('.star').nth(4).click();
    const ratings = await page.evaluate(() => localStorage.getItem('movieRatings'));
    expect(ratings).toBeTruthy();
    expect(JSON.parse(ratings)).toBeTruthy();
  });
});

test.describe('Movie Recommender - Интерфейс', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/movie-recommender.html`);
  });

  test('Переключение вкладок работает', async ({ page }) => {
    await page.locator('.tab-btn', { hasText: 'Рекомендации' }).click();
    await expect(page.locator('#recommendationsTab')).toBeVisible();
    await expect(page.locator('#rateTab')).toBeHidden();
  });

  test('Модальное окно открывается и закрывается', async ({ page }) => {
    await page.locator('.movie-poster').first().click();
    await expect(page.locator('#movieModal')).toHaveClass(/active/);
    await page.locator('#modalClose').click();
    await expect(page.locator('#movieModal')).not.toHaveClass(/active/);
  });

  test('Переключение темы работает', async ({ page }) => {
    await expect(page.locator('body')).not.toHaveAttribute('data-theme', 'light');
    await page.locator('#themeBtn').click();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  });

  test('Переключение языка работает', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('Рекомендатор');
    await page.locator('#langBtn').click();
    await expect(page.locator('.logo-text')).toContainText('Movie Recommender');
  });
});

test.describe('Movie Recommender - Рекомендации', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/movie-recommender.html`);
  });

  test('Рекомендации генерируются после оценки 5+ фильмов', async ({ page }) => {
    const cards = page.locator('.movie-card');
    for (let i = 0; i < 5; i++) {
      await cards.nth(i).locator('.star').nth(4).click();
    }
    await page.locator('.tab-btn', { hasText: 'Рекомендации' }).click();
    await page.locator('#getRecsBtn').click();
    await expect(page.locator('.recommendation-card').first()).toBeVisible();
    await expect(page.locator('.similarity-value').first()).toBeVisible();
  });

  test('Сброс оценок работает', async ({ page }) => {
    await page.locator('.movie-card').first().locator('.star').nth(3).click();
    await expect(page.locator('#ratedCount')).toContainText('1');
    page.on('dialog', async dialog => await dialog.accept());
    await page.locator('#resetBtn').click();
    await expect(page.locator('#ratedCount')).toContainText('0');
  });
});
