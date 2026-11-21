import { test, expect } from '@playwright/test';

/**
 * @function json
 * @description Ответ page.route с JSON-телом
 * @param {object} body - Тело ответа
 * @returns {object} Параметры для route.fulfill
 */
const json = body => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});

test.describe('Публичные ключи TheSportsDB и TheAudioDB', () => {
  test('sports_api запрашивает TheSportsDB с ключом 123', async ({ page }) => {
    const urls = [];
    await page.route('https://www.thesportsdb.com/**', route => {
      urls.push(route.request().url());
      return route.fulfill(json({ sports: [] }));
    });
    await page.goto('/sports_api.html');
    await expect.poll(() => urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toContain('/api/v1/json/123/');
  });

  test('music-search запрашивает TheAudioDB с ключом 123', async ({ page }) => {
    const urls = [];
    await page.route('https://www.theaudiodb.com/**', route => {
      urls.push(route.request().url());
      return route.fulfill(json({ artists: [{ strArtist: 'Radiohead' }] }));
    });
    await page.goto('/music-search.html');
    const artist = await page.evaluate(() => window.fetchAudioDBData('Radiohead'));
    expect(artist.strArtist).toBe('Radiohead');
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/api/v1/json/123/search.php');
  });
});

test.describe('NASA Explorer без Mars Rover Photos', () => {
  test('нет вкладки и разметки марсоходов', async ({ page }) => {
    await page.route('https://api.nasa.gov/**', route => route.fulfill(json({})));
    await page.goto('/nasa_explorer.html');
    await expect(page.locator('.tab-btn')).toHaveCount(2);
    await expect(page.locator('[data-tab="mars"], #mars, #roverGallery')).toHaveCount(
      0
    );
    await expect(page.locator('.tabs')).not.toContainText('Марсоход');
  });
});

test.describe('WebLLM Chat без неработающих источников', () => {
  test('нет инструмента «Спорт», arXiv и CoinCap; старое tool_sports не ломает загрузку', async ({
    page,
  }) => {
    // Состояние из прошлой версии, где инструмент «Спорт» был
    await page.addInitScript(() => localStorage.setItem('tool_sports', 'true'));
    const requested = [];
    page.on('request', request => requested.push(request.url()));
    await page.route('https://api.coingecko.com/**', route => {
      const url = route.request().url();
      return url.includes('/search')
        ? route.fulfill(
            json({ coins: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' }] })
          )
        : route.fulfill(json({ bitcoin: { usd: 1, rub: 90, usd_24h_change: 0 } }));
    });
    await page.goto('/webllm-chat.html');

    await expect(page.locator('.tool-item[data-tool="sports"]')).toHaveCount(0);
    const toolCount = await page.locator('.tool-item').count();
    await expect(page.locator('#privacyBadge')).toContainText(
      `Сеть: ${toolCount} инстр.`
    );

    const prompt = await page.evaluate(() => window.toolManager.getToolsSystemPrompt());
    expect(prompt).not.toContain('search_sports');
    expect(prompt).not.toContain('arXiv');

    const crypto = await page.evaluate(() =>
      window.toolManager.executeToolCall({
        tool: 'get_crypto_price',
        params: { coin: 'bitcoin' },
      })
    );
    expect(crypto.source).toBe('CoinGecko');
    const sports = await page.evaluate(() =>
      window.toolManager.executeToolCall({
        tool: 'search_sports',
        params: { query: 'Arsenal' },
      })
    );
    expect(sports.error).toContain('Неизвестный инструмент');
    expect(requested.filter(url => /coincap|thesportsdb|arxiv/.test(url))).toEqual([]);
  });
});

test.describe('Астрономический гид без IP-геолокации', () => {
  test('отказ геолокации: просьба ввести место, без запроса к ipapi.co', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.navigator.geolocation.getCurrentPosition = (_ok, fail) =>
        fail({ code: 1, message: 'denied' });
    });
    const ipRequests = [];
    await page.route('https://ipapi.co/**', route => {
      ipRequests.push(route.request().url());
      return route.abort();
    });
    await page.route(/sunrise-sunset\.org|open-meteo\.com|nominatim/, route =>
      route.abort()
    );
    await page.goto('/astronomy_guide.html');
    await expect(page.locator('#locationDisplay')).toContainText('введите город');
    await expect(page.locator('#locationInput')).toBeFocused();
    expect(ipRequests).toEqual([]);
  });
});
