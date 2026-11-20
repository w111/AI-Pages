import { test, expect } from '@playwright/test';

const AIC_ARTWORK = {
  id: 16568,
  title: 'Кувшинки (AIC)',
  artist_display: 'Claude Monet',
  date_display: '1906',
  image_id: 'aic-image',
};

const MET_OBJECT = {
  objectID: 437133,
  title: 'Мост через пруд (Met)',
  artistDisplayName: 'Claude Monet',
  objectDate: '1899',
  primaryImage: 'https://images.metmuseum.org/full.jpg',
  primaryImageSmall: 'https://images.metmuseum.org/small.jpg',
};

/**
 * @function mockMuseums
 * @description Подменяет HTTP-границу обоих музеев; живые API не вызываются.
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {{aicOk: boolean, metOk: boolean}} options - Какие источники отвечают успешно
 * @returns {Promise<{metSearchUrls: string[]}>} Запрошенные URL поиска Met
 */
async function mockMuseums(page, { aicOk, metOk }) {
  const metSearchUrls = [];
  await page.route('https://www.artic.edu/**', route => route.abort());
  await page.route('https://images.metmuseum.org/**', route => route.abort());
  await page.route('https://api.artic.edu/**', route =>
    aicOk
      ? route.fulfill({ json: { data: [AIC_ARTWORK] } })
      : route.fulfill({ status: 500, body: 'error' })
  );
  await page.route('https://collectionapi.metmuseum.org/**', route => {
    const url = route.request().url();
    if (url.includes('/search')) {
      metSearchUrls.push(url);
      // Реальный Met: v1/search — 410, v1.1/search — {total, objectIDs}
      if (!metOk || !url.includes('/v1.1/search')) {
        return route.fulfill({ status: 410, body: 'Gone' });
      }
      return route.fulfill({ json: { total: 1, objectIDs: [MET_OBJECT.objectID] } });
    }
    return route.fulfill({ json: MET_OBJECT });
  });
  return { metSearchUrls };
}

/**
 * @function search
 * @description Выбирает музей и ищет «Monet», как в ручном QA.
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {string} museum - Значение фильтра музея (all/aic/met)
 * @returns {Promise<void>}
 */
async function search(page, museum) {
  await page.goto('/art_gallery.html');
  // Первичная загрузка держит isLoading: поиск до её конца был бы проигнорирован
  await expect(page.locator('#loading')).not.toHaveClass(/active/);
  await page.locator('#museumFilter').selectOption(museum);
  await page.locator('#searchInput').fill('Monet');
  await page.locator('#searchBtn').click();
}

test.describe('Галерея искусства — независимые источники', () => {
  test('Ошибка Met не скрывает карточку Чикаго и видна пользователю', async ({
    page,
  }) => {
    await mockMuseums(page, { aicOk: true, metOk: false });
    await search(page, 'all');

    await expect(page.locator('.artwork-card[data-id="aic-16568"]')).toBeVisible();
    await expect(page.locator('#sourceErrors')).toBeVisible();
    await expect(page.locator('#sourceErrors')).toContainText(
      'Metropolitan Museum of Art'
    );
    await expect(page.locator('#sourceErrors')).toContainText('410');
    await expect(page.locator('#sourceErrors')).not.toContainText('Chicago');
    await expect(page.locator('#emptyState')).toBeHidden();
  });

  test('Met через v1.1/search показывает карточки', async ({ page }) => {
    const { metSearchUrls } = await mockMuseums(page, { aicOk: true, metOk: true });
    await search(page, 'met');

    await expect(page.locator('.artwork-card[data-id="met-437133"]')).toBeVisible();
    await expect(page.locator('.artwork-card[data-id^="aic-"]')).toHaveCount(0);
    await expect(page.locator('#sourceErrors')).toBeHidden();
    expect(metSearchUrls.every(url => url.includes('/v1.1/search'))).toBe(true);
  });

  test('Оба музея упали — понятная ошибка вместо пустого экрана', async ({ page }) => {
    await mockMuseums(page, { aicOk: false, metOk: false });
    await search(page, 'all');

    await expect(page.locator('.artwork-card')).toHaveCount(0);
    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#emptyState h3')).toHaveText(
      'Не удалось загрузить произведения'
    );
    await expect(page.locator('#sourceErrors')).toContainText(
      'Art Institute of Chicago'
    );
    await expect(page.locator('#sourceErrors')).toContainText(
      'Metropolitan Museum of Art'
    );
  });

  test('Упал единственный выбранный Met — пустой стейт с ошибкой', async ({ page }) => {
    await mockMuseums(page, { aicOk: true, metOk: false });
    await search(page, 'met');

    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#emptyState h3')).toHaveText(
      'Не удалось загрузить произведения'
    );
    await expect(page.locator('#sourceErrors')).toContainText(
      'Metropolitan Museum of Art'
    );
  });
});

test.describe('Галерея искусства — гонка поиска', () => {
  test('Поиск во время медленной первичной загрузки не теряется', async ({ page }) => {
    await mockMuseums(page, { aicOk: true, metOk: false });
    // Первичная загрузка (запрос по умолчанию «painting») отвечает с задержкой и другой картиной
    await page.route(/api\.artic\.edu\/.*q=painting/, async route => {
      await page.waitForTimeout(1500);
      await route.fulfill({
        json: { data: [{ ...AIC_ARTWORK, id: 1, title: 'Устаревшая' }] },
      });
    });
    const staleResponse = page.waitForResponse(/api\.artic\.edu\/.*q=painting/);
    await page.goto('/art_gallery.html');
    await expect(page.locator('#loading')).toHaveClass(/active/);

    await page.locator('#searchInput').fill('Monet');
    await page.locator('#searchBtn').click();

    await expect(page.locator('.artwork-card[data-id="aic-16568"]')).toBeVisible();
    await staleResponse;
    await expect(page.locator('#loading')).not.toHaveClass(/active/);
    await expect(page.locator('.artwork-card[data-id="aic-1"]')).toHaveCount(0);
    await expect(page.locator('.artwork-card[data-id="aic-16568"]')).toBeVisible();
  });
});

test.describe('Галерея искусства — данные API не исполняются', () => {
  test('HTML в названии из API показывается текстом, а не исполняется', async ({
    page,
  }) => {
    const payload = '<img src=x onerror="window.__xss=1">Кувшинки';
    await page.route('https://www.artic.edu/**', route => route.abort());
    await page.route('https://collectionapi.metmuseum.org/**', route =>
      route.fulfill({ status: 410, body: 'Gone' })
    );
    await page.route('https://api.artic.edu/**', route =>
      route.fulfill({ json: { data: [{ ...AIC_ARTWORK, title: payload }] } })
    );
    await page.goto('/art_gallery.html');

    const title = page.locator('.artwork-card[data-id="aic-16568"] .artwork-title');
    await expect(title).toContainText('onerror');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
});
