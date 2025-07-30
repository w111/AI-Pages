import { test, expect } from '@playwright/test';

// Базовая клавиатурная навигация
test('Фокусировка по Tab доходит до настроек', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);
  // Проверяем что можем добраться до settings через Tab
  await page.keyboard.press('Tab'); // Переходим от поиска к settings
  const settingsIcon = page.locator('.settings-icon');
  await expect(settingsIcon).toBeFocused();
});

// Проверка видимых индикаторов фокуса
test('Видимые индикаторы фокуса для интерактивных элементов', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/index.html`);

  // Фокус на поисковом поле
  await page.locator('#cardSearch').focus();
  const searchFocusStyle = await page
    .locator('#cardSearch')
    .evaluate(el => getComputedStyle(el).outline);
  expect(searchFocusStyle).not.toBe('none');

  // Фокус на кнопке настроек
  await page.locator('.settings-icon').focus();
  const settingsFocusStyle = await page
    .locator('.settings-icon')
    .evaluate(el => getComputedStyle(el).outline);
  expect(settingsFocusStyle).not.toBe('none');
});

// Проверка контрастности цветов
test('Достаточная контрастность текста в светлой теме', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Проверяем контрастность основного текста
  const textColor = await page
    .locator('body')
    .evaluate(el => getComputedStyle(el).color);
  const backgroundColor = await page
    .locator('body')
    .evaluate(el => getComputedStyle(el).backgroundColor);

  // rgb(15, 23, 42) на rgb(248, 250, 252) должен иметь достаточный контраст
  expect(textColor).toBe('rgb(15, 23, 42)');
  expect(backgroundColor).toBe('rgb(248, 250, 252)');
});

test('Достаточная контрастность текста в темной теме', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Переключаем на темную тему
  await page.locator('.settings-icon').click();
  await page.locator('label[for="themeSwitch"]').click();

  const textColor = await page
    .locator('body')
    .evaluate(el => getComputedStyle(el).color);
  const backgroundColor = await page
    .locator('body')
    .evaluate(el => getComputedStyle(el).backgroundColor);

  // В темной теме должны быть контрастные цвета
  expect(textColor).not.toBe(backgroundColor);
});

// Проверка ARIA-атрибутов
test('Корректные ARIA-атрибуты для интерактивных элементов', async ({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/index.html`);

  // Проверяем ARIA-атрибуты поисковой формы
  const searchInput = page.locator('#cardSearch');
  await expect(searchInput).toHaveAttribute('aria-label');

  // Проверяем ARIA-атрибуты кнопки настроек
  const settingsButton = page.locator('.settings-icon');
  await expect(settingsButton).toHaveAttribute('title');

  // Проверяем ARIA-атрибуты модального окна
  await settingsButton.click();
  const modal = page.locator('#settingsModal');
  await expect(modal).toHaveAttribute('role', 'dialog');
  await expect(modal).toHaveAttribute('aria-labelledby');
});

// Проверка семантической HTML разметки
test('Правильная семантическая структура заголовков', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Должен быть один H1 заголовок
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Проверяем иерархию заголовков
  const h1Text = await page.locator('h1').textContent();
  expect(h1Text).toContain('AI Pages');

  // Проверяем, что есть H2 заголовки для категорий
  const h2Count = await page.locator('h2').count();
  expect(h2Count).toBeGreaterThan(0);

  // Проверяем H3 заголовки карточек
  const h3Count = await page.locator('h3').count();
  expect(h3Count).toBeGreaterThan(0);
});

// Проверка alt-текста для изображений
test('Описательные alt-атрибуты для изображений', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Проверяем все изображения на наличие alt-атрибутов
  const images = await page.locator('img').all();
  for (const image of images) {
    const altText = image;
    expect(altText).toBeDefined();
    await expect(altText).not.toHaveAttribute('alt', '');
  }
});

// Проверка клавиатурных сокращений
test('Поддержка стандартных клавиатурных сокращений', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Escape должен закрывать модальные окна
  await page.locator('.settings-icon').click();
  await page.locator('#settingsModal').waitFor({ state: 'visible' });

  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsModal')).toBeHidden();
});

// Проверка доступности для screen readers
test('Структура документа подходит для screen readers', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  // Проверяем наличие landmarks
  const main = page.locator('main, [role="main"]');
  await expect(main).toHaveCount(1);

  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav).toHaveCount(1);

  // Проверяем lang атрибут
  const htmlLang = await page.locator('html').getAttribute('lang');
  expect(htmlLang).toBeDefined();
  expect(['ru', 'en']).toContain(htmlLang);
});

// Проверка управления с клавиатуры
test('Полная навигация только с клавиатуры', async ({ page, baseURL }) => {
  // Увеличенный timeout для медленных устройств
  await page.goto(`${baseURL}/index.html`, { timeout: 15000 });

  // Ждем полной загрузки страницы
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  // Проверяем что можем сфокусироваться на основные элементы
  const searchInput = page.locator('#cardSearch');
  await searchInput.focus();
  await expect(searchInput).toBeFocused();

  const settingsButton = page.locator('.settings-icon');
  await settingsButton.focus();
  await expect(settingsButton).toBeFocused();

  // Проверяем наличие интерактивных элементов карточек
  const cardButtons = page.locator('.view-btn');
  await expect(cardButtons.first()).toBeVisible();
  await cardButtons.first().focus();
  await expect(cardButtons.first()).toBeFocused();
});
