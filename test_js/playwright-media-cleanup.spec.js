import { test, expect } from '@playwright/test';

/* global radioStations, unlockAudio, playSound, audioCtx, paddleHitSound, brickHitSound, wallHitSound, gameOverSound -- глобальные имена страниц внутри page.evaluate */

/**
 * Удалённые мёртвые медиаисточники не возвращаются в приложения.
 * Внешние запросы обрываются и записываются: живой сети тесты не касаются.
 */

/**
 * Обрывает все запросы, кроме локального сервера, и записывает их URL
 * @function recordExternal
 * @description Подменяет внешние запросы через page.route: каждый URL сохраняется в массив, запрос обрывается
 * @param {import('@playwright/test').Page} page - Страница теста
 * @returns {Promise<string[]>} Массив URL внешних запросов, пополняется по ходу теста
 */
async function recordExternal(page) {
  const urls = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => {
    urls.push(route.request().url());
    return route.abort();
  });
  return urls;
}

test('Радио-глобус: в списке нет мёртвых потоков, все адреса https', async ({
  page,
  baseURL,
}) => {
  await recordExternal(page);
  await page.goto(`${baseURL}/radio-globe.html`);
  const urls = await page.evaluate(() => radioStations.map(s => s.url));
  const dead = [
    'icecast.thisisdax.com',
    'live.amperwave.net',
    'streaming.radio.rtl.fr',
    'npr-ice.streamguys1.com',
    'europafm-live.flumotion.com',
    'radiodeejay-lh.akamaihd.net',
    'icy.unitedradio.it/Capital.mp3',
    'stream.rds.radio',
    'live-radio01.mediahubaustralia.com',
    'icy.nova.net.au',
    'live.wostreaming.net',
    'livestream-redirect/RADIO89FMAAC',
    'livestream-redirect/RADIOMIX',
    'livestream-redirect/JOVEMPAN_SP',
    'livestream-redirect/CBC_R1_OTT_H',
    'live.leanstream.co',
    'http-live.sr.se',
    'n-22-12.dcs.redcdn.pl',
    'radio.stream.smcdn.pl',
    'rixfm_se_aacp',
    'nrj.p4groupaudio.com',
    'radionorge_no_aacp',
    'nova_dk_aacp',
    'skyradio_dk_aacp',
    'radionova_fi_aacp',
    'radiosuomipop_fi_aacp',
    'icecast.cdn.dpgmedia.net',
    'mcrscast.mcr.iol.pt',
    'stream.zeno.fm/h9rq9sgqs5zuv',
    'ais-nzme.streamguys1.com',
    'icy.stream.co.uk',
  ];
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    expect(url, 'поток по https').toMatch(/^https:\/\//);
    expect(
      dead.filter(d => url.includes(d)),
      `мёртвый адрес: ${url}`
    ).toEqual([]);
  }
});

test('Арканоид: звуки синтезируются, к assets.mixkit.co запросов нет', async ({
  page,
  baseURL,
}) => {
  const requests = await recordExternal(page);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${baseURL}/arcanoid_o3.html`);
  // До жеста пользователя AudioContext не создаётся (политика автозапуска)
  expect(await page.evaluate(() => audioCtx)).toBeNull();
  await page.locator('body').click();
  expect(await page.evaluate(() => audioCtx !== null)).toBe(true);
  await page.evaluate(() =>
    [paddleHitSound, brickHitSound, wallHitSound, gameOverSound].forEach(s =>
      playSound(s)
    )
  );
  expect(errors).toEqual([]);
  expect(requests.filter(u => u.includes('assets.mixkit.co'))).toEqual([]);
  await expect(page.locator('audio[src*="mixkit"]')).toHaveCount(0);
});

for (const [file, forbidden] of [
  ['react_news.html', /reddit\.com|lifehacker-ru/i],
  ['macos.html', /source\.unsplash\.com/],
  ['windows.html', /source\.unsplash\.com/],
]) {
  test(`${file}: в исходнике и запросах нет ${forbidden.source}`, async ({
    page,
    baseURL,
  }) => {
    const requests = await recordExternal(page);
    await page.goto(`${baseURL}/${file}`);
    expect(await page.content()).not.toMatch(forbidden);
    expect(requests.filter(u => forbidden.test(u))).toEqual([]);
  });
}
