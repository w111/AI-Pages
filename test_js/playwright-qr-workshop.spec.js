import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

/**
 * Тесты приватности QR Мастерской: генерация и чтение идут в браузере,
 * данные не уходят во внешние сервисы, пароль Wi‑Fi не попадает в историю.
 * Внешние сервисы не мокаются — проверяются реальные запросы страницы.
 */

const SSID = 'HomeNet-QA';
const PASSWORD = 'S3cret;pass:42';
const HISTORY_KEY = 'qrWorkshop-history';

/** Собирает URL всех запросов страницы. */
function trackRequests(page) {
  const urls = [];
  page.on('request', req => urls.push(req.url()));
  return urls;
}

/** Разрешённые хосты: локальный сервер и CDN библиотек (без данных пользователя). */
const ALLOWED_HOSTS = new Set([
  '127.0.0.1',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
]);

/** Запросы к любым другим хостам (в т.ч. api.qrserver.com) — утечка. */
function leaks(urls) {
  return urls.filter(
    u => u.startsWith('http') && !ALLOWED_HOSTS.has(new URL(u).hostname)
  );
}

/** Весь localStorage одной строкой. */
function dumpStorage(page) {
  return page.evaluate(() => JSON.stringify({ ...localStorage }));
}

test('Wi‑Fi: ввод и генерация без внешних запросов, пароль не в истории', async ({
  page,
}) => {
  const urls = trackRequests(page);
  await page.goto('/qr_workshop.html');

  await page.locator('.type-tab[data-type="wifi"]').click();
  await page.locator('#inputWifiSsid').fill(SSID);
  await page.locator('#inputWifiPass').fill(PASSWORD);
  // Live preview срабатывает по debounce — ждём картинку
  await expect(page.locator('#qrImage')).toHaveAttribute('src', /^data:image\/png/);
  await page.locator('#btnGenerate').click();

  const stored = await page.evaluate(k => localStorage.getItem(k), HISTORY_KEY);
  expect(stored, 'SSID должен быть в истории').toContain(SSID);
  const all = await dumpStorage(page);
  expect(all, 'пароль не должен храниться').not.toContain('S3cret');
  expect(all).not.toContain('P:');
  expect(leaks(urls), 'запросы с данными наружу').toEqual([]);
});

test('URL-QR: скачивание PNG → чтение из файла возвращает исходный URL', async ({
  page,
}) => {
  const urls = trackRequests(page);
  const target = 'https://example.com/qa?x=1&y=привет';
  await page.goto('/qr_workshop.html');

  await page.locator('#inputUrl').fill(target);
  await page.locator('#btnGenerate').click();
  await expect(page.locator('#btnDownloadPng')).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btnDownloadPng').click(),
  ]);
  expect(download.suggestedFilename()).toBe('qr-code.png');
  const buffer = await readFile(await download.path());

  await page.locator('.section-tab[data-section="reader"]').click();
  await page
    .locator('#readerFileInput')
    .setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer });
  await expect(page.locator('#readerResultText')).toHaveText(target);

  expect(leaks(urls), 'запросы с данными наружу').toEqual([]);
});

test('Wi‑Fi QR читается локально с исходным паролем', async ({ page }) => {
  const urls = trackRequests(page);
  await page.goto('/qr_workshop.html');

  await page.locator('.type-tab[data-type="wifi"]').click();
  await page.locator('#inputWifiSsid').fill(SSID);
  await page.locator('#inputWifiPass').fill(PASSWORD);
  await page.locator('#btnGenerate').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btnDownloadPng').click(),
  ]);
  const buffer = await readFile(await download.path());

  await page.locator('.section-tab[data-section="reader"]').click();
  await page
    .locator('#readerFileInput')
    .setInputFiles({ name: 'wifi.png', mimeType: 'image/png', buffer });
  await expect(page.locator('#readerResultText')).toContainText('WIFI:S:');
  await page.locator('#readerUseBtn').click();
  await expect(page.locator('#inputWifiPass')).toHaveValue(PASSWORD);
  await expect(page.locator('#inputWifiSsid')).toHaveValue(SSID);

  expect(leaks(urls), 'запросы с данными наружу').toEqual([]);
});

test('Старые записи истории с паролем вычищаются при загрузке', async ({ page }) => {
  const urls = trackRequests(page);
  await page.goto('/qr_workshop.html');
  await page.evaluate(k => {
    const old = 'WIFI:S:OldNet;T:WPA;P:oldsecret;;';
    localStorage.setItem(
      k,
      JSON.stringify([
        {
          data: old,
          imgUrl:
            'https://api.qrserver.com/v1/create-qr-code/?data=' +
            encodeURIComponent(old),
          ts: 1,
        },
        {
          data: 'https://example.org',
          imgUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=x',
          ts: 2,
        },
      ])
    );
  }, HISTORY_KEY);
  await page.reload();

  const stored = await page.evaluate(k => localStorage.getItem(k), HISTORY_KEY);
  expect(await dumpStorage(page)).not.toContain('oldsecret');
  expect(stored).not.toContain('qrserver');
  expect(stored).toContain('OldNet');
  expect(stored).toContain('https://example.org');
  await expect(page.locator('#historyGrid .history-item img')).toHaveCount(2);
  await expect(page.locator('#historyGrid .history-item img').first()).toHaveAttribute(
    'src',
    /^data:image\/png/
  );

  expect(leaks(urls), 'запросы с данными наружу').toEqual([]);
});
