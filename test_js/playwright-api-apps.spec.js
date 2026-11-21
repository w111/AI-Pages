import { test, expect } from '@playwright/test';

/**
 * @function json
 * @description Ответ page.route с JSON-телом
 * @param {object} body - Тело ответа
 * @param {number} [status=200] - HTTP-код
 * @returns {object} Параметры для route.fulfill
 */
const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});

const HH_ROLES = {
  categories: [
    {
      id: '11',
      name: 'Информационные технологии',
      roles: [{ id: '160', name: 'DevOps-инженер' }],
    },
  ],
};
const HH_AREAS = { id: '113', name: 'Россия', areas: [] };

/**
 * @function mockHh
 * @description Мокирует api.hh.ru: справочники отдаются всегда, вакансии — заданным ответом
 * @param {import('@playwright/test').Page} page - Страница
 * @param {object} vacanciesResponse - Ответ на /vacancies
 * @returns {Promise<void>}
 */
const mockHh = async (page, vacanciesResponse) => {
  await page.route('https://api.hh.ru/**', route => {
    const url = route.request().url();
    if (url.includes('/professional_roles')) return route.fulfill(json(HH_ROLES));
    if (url.includes('/areas')) return route.fulfill(json(HH_AREAS));
    return route.fulfill(vacanciesResponse);
  });
};

test.describe('Каталог профессий (hh.ru)', () => {
  test('вакансии DevOps загружаются', async ({ page }) => {
    await mockHh(
      page,
      json({
        items: [
          {
            id: '1',
            name: 'DevOps-инженер',
            salary: { from: 200000, to: 300000, currency: 'RUR' },
            area: { name: 'Москва' },
            alternate_url: 'https://hh.ru/vacancy/1',
            employer: { name: 'ООО Тест' },
          },
        ],
      })
    );
    await page.goto('/professions.html');
    await page.locator('.profession-item', { hasText: 'DevOps' }).click();
    await expect(page.locator('#vacanciesContainer .vacancy-group')).toHaveCount(1);
    await expect(page.locator('#vacanciesContainer')).toContainText('DevOps-инженер');
  });

  test('403 от hh.ru показывает причину вместо вечной загрузки', async ({ page }) => {
    await mockHh(page, json({ errors: [{ type: 'forbidden' }] }, 403));
    await page.goto('/professions.html');
    await page.locator('.profession-item', { hasText: 'DevOps' }).click();
    await expect(page.locator('#vacanciesContainer .error-message')).toContainText(
      'HTTP 403'
    );
    await expect(page.locator('#vacanciesPreloader')).toBeHidden();
  });
});

/**
 * @function searchRadiohead
 * @description Открывает music-search и ищет Radiohead
 * @param {import('@playwright/test').Page} page - Страница
 * @returns {Promise<void>}
 */
const searchRadiohead = async page => {
  await page.goto('/music-search.html');
  await page.locator('#searchInput').fill('Radiohead');
  await page.locator('#searchBtn').click();
};

test.describe('Поиск музыки (MusicBrainz)', () => {
  test('поиск Radiohead показывает результаты без нестандартных заголовков', async ({
    page,
  }) => {
    // Записываем заголовки, которые страница передаёт в fetch
    await page.addInitScript(() => {
      const originalFetch = window.fetch;
      window.sentHeaders = [];
      window.fetch = (url, init) => {
        window.sentHeaders.push(Object.keys(init?.headers ?? {}));
        return originalFetch(url, init);
      };
    });
    await page.route('https://www.theaudiodb.com/**', route => route.fulfill(json({})));
    await page.route('https://musicbrainz.org/**', route =>
      route.fulfill(
        json({
          count: 1,
          artists: [
            { id: 'a74b1b7f', name: 'Radiohead', type: 'Group', country: 'GB' },
          ],
        })
      )
    );
    await searchRadiohead(page);
    await expect(page.locator('.result-card').first()).toContainText('Radiohead');
    // Свой User-Agent добавлял лишний CORS-preflight под rate limit MusicBrainz
    const sentHeaders = await page.evaluate(() => window.sentHeaders.flat());
    expect(sentHeaders).not.toContain('User-Agent');
  });
});

test.describe('Поиск музыки: сбои MusicBrainz', () => {
  test('стойкий 503 MusicBrainz: один повтор, затем причина в сообщении', async ({
    page,
  }) => {
    let calls = 0;
    await page.route('https://musicbrainz.org/**', route => {
      calls += 1;
      return route.fulfill(json({}, 503));
    });
    await searchRadiohead(page);
    // Повтор после 503 ждёт 1,5 с
    await expect(page.locator('#errorState')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#errorReason')).toContainText('HTTP 503');
    await expect(page.locator('#loadingState')).toBeHidden();
    expect(calls).toBe(2);
    // «Повторить» работает и после неудачного первого поиска
    await page.locator('#retryBtn').click();
    await expect.poll(() => calls, { timeout: 6000 }).toBeGreaterThan(2);
  });

  test('разовый 503 MusicBrainz проходит повтором', async ({ page }) => {
    let calls = 0;
    await page.route('https://www.theaudiodb.com/**', route => route.fulfill(json({})));
    await page.route('https://musicbrainz.org/**', route => {
      calls += 1;
      return calls === 1
        ? route.fulfill(json({}, 503))
        : route.fulfill(
            json({ count: 1, artists: [{ id: 'a74b1b7f', name: 'Radiohead' }] })
          );
    });
    await searchRadiohead(page);
    await expect(page.locator('.result-card').first()).toContainText('Radiohead', {
      timeout: 6000,
    });
  });
});

test.describe('Авиатрафик (OpenSky)', () => {
  test.beforeEach(async ({ page }) => {
    // Тайлы карты не нужны для проверки данных
    await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  });

  test('самолёты из ответа OpenSky попадают в статистику', async ({ page }) => {
    await page.route('https://opensky-network.org/**', route =>
      route.fulfill(
        json({
          time: 1,
          states: [
            [
              '152033',
              'AFL1398 ',
              'Russian Federation',
              1,
              1,
              37.43,
              55.97,
              373,
              false,
              82,
              75,
              12,
              null,
              251,
              null,
              false,
              0,
            ],
          ],
        })
      )
    );
    await page.goto('/aircraft_traffic.html');
    await expect(page.locator('#totalAircraft')).toHaveText('1');
  });

  test('сетевой сбой (CORS) показывает причину и не прячет её', async ({ page }) => {
    await page.clock.install();
    await page.route('https://opensky-network.org/**', route => route.abort('failed'));
    await page.goto('/aircraft_traffic.html');
    const notification = page.locator('#notification');
    await expect(notification).toHaveClass(/error/);
    await expect(page.locator('#notificationText')).toContainText('CORS');
    // Обычные уведомления скрываются через 3 с, ошибка должна остаться
    await page.clock.runFor(3500);
    await expect(notification).toHaveClass(/visible/);
  });
});

test('Коктейли: в русском интерфейсе инструкция не на немецком', async ({ page }) => {
  const mojito = {
    idDrink: '11000',
    strDrink: 'Mojito',
    strCategory: 'Cocktail',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Highball glass',
    strDrinkThumb: '',
    strInstructions: 'Muddle mint leaves with sugar and lime juice.',
    strInstructionsDE: 'Minzblätter mit Zucker und Limettensaft verrühren.',
    strIngredient1: 'Light rum',
    strMeasure1: '2-3 oz',
  };
  await page.addInitScript(() => localStorage.setItem('cocktails-lang', 'ru'));
  await page.route('https://www.thecocktaildb.com/images/**', route => route.abort());
  await page.route('https://www.thecocktaildb.com/api/**', route =>
    route.fulfill(json({ drinks: [mojito] }))
  );
  await page.goto('/cocktails.html');
  await page.locator('.cocktail-card', { hasText: 'Mojito' }).first().click();
  await expect(page.locator('#instructions')).toHaveText(mojito.strInstructions);
  await expect(page.locator('#instructions')).not.toContainText('Minzblätter');
});
