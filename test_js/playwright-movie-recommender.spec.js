import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

const shows = JSON.parse(
  readFileSync(new URL('./fixtures/tvmaze-shows.json', import.meta.url))
);

// Настоящий UI и загрузчик TVMaze; только HTTP-граница имеет фиксированный ответ.
test.beforeEach(async ({ page }) => {
  await page.route('https://api.tvmaze.com/shows?page=*', async route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'));
    await route.fulfill({
      status: number <= 1 ? 200 : 404,
      json: number <= 1 ? shows : [],
    });
  });
  await page.goto('/movie-recommender.html');
  await expect(page.locator('.movie-card')).toHaveCount(12);
});

/**
 * Тесты для Рекомендатор сериалов — системы рекомендаций сериалов
 */

test.describe('Рекомендатор сериалов — Загрузка страницы', () => {
  test('Страница загружается корректно', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('Рекомендатор сериалов');
    await expect(page.locator('.progress-section')).toBeVisible();
    await expect(page.locator('.tabs')).toBeVisible();
    await expect(page.locator('#moviesGrid')).toBeVisible();
  });

  test('Отображаются карточки сериалов', async ({ page }) => {
    await expect(page.locator('.movie-card').first()).toBeVisible();
    const cardsCount = page.locator('.movie-card');
    await expect(cardsCount).toHaveCount(12);
  });
});

test.describe('Рекомендатор сериалов — Поиск и фильтры', () => {
  test('Поиск сериалов работает', async ({ page }) => {
    await page.locator('#searchInput').fill('Under the Dome');
    await expect(page.locator('.movie-card')).toHaveCount(1);
    await expect(page.locator('.movie-title').first()).toHaveText('Under the Dome');
  });

  test('Фильтр по жанрам работает', async ({ page }) => {
    await page.locator('.genre-btn', { hasText: 'Ужасы' }).click();
    await expect(page.locator('.genre-btn.active')).toContainText('Ужасы');
    await expect(page.locator('.movie-card')).toHaveCount(2);
    expect(
      await page
        .locator('.movie-card')
        .evaluateAll(cards =>
          cards.map(card => Number(card.dataset.id)).sort((a, b) => a - b)
        )
    ).toEqual([3, 12]);
    await page.locator('.genre-btn[data-genre=""]').click();
    await expect(page.locator('.movie-card')).toHaveCount(12);
  });
});

test.describe('Рекомендатор сериалов — Оценки', () => {
  test('Оценка сериала работает', async ({ page }) => {
    const firstCard = page.locator('.movie-card').first();
    await firstCard.locator('.star').nth(3).click();
    const activeStars = firstCard.locator('.star.active');
    await expect(activeStars).toHaveCount(4);
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
    const id = await page.locator('.movie-card').first().getAttribute('data-id');
    expect(JSON.parse(ratings)[id]).toBe(5);
    await page.reload();
    await expect(page.locator('#ratedCount')).toHaveText('1');
  });
});

test.describe('Рекомендатор сериалов — Интерфейс', () => {
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
    await expect(page.locator('.logo-text')).toContainText('Show Recommender');
  });
});

test.describe('Рекомендатор сериалов — Рекомендации', () => {
  test('Рекомендации генерируются после оценки 5+ сериалов', async ({ page }) => {
    const cards = page.locator('.movie-card');
    for (let i = 0; i < 5; i++) {
      await cards.nth(i).locator('.star').nth(4).click();
    }
    await page.locator('.tab-btn', { hasText: 'Рекомендации' }).click();
    await page.locator('#getRecsBtn').click();
    await expect(page.locator('.recommendation-card')).toHaveCount(7);
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
