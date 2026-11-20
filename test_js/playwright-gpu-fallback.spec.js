import { test, expect } from '@playwright/test';

/**
 * Поведение страниц без GPU: нет WebGL, нет WebGPU-адаптера.
 * Внешние запросы блокируются, CDN-модули подменяются заглушками.
 */

/**
 * Отключает WebGL: getContext возвращает null для WebGL-контекстов, 2d работает как обычно
 * @function disableWebGL
 * @description Подменяет HTMLCanvasElement.prototype.getContext до загрузки страницы
 * @param {import('@playwright/test').Page} page - Страница теста
 * @returns {Promise<void>}
 */
async function disableWebGL(page) {
  await page.addInitScript(() => {
    const proto = window.HTMLCanvasElement.prototype;
    const original = proto.getContext;
    proto.getContext = function (type, ...args) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
      return original.call(this, type, ...args);
    };
  });
}

/**
 * Блокирует все запросы, кроме локального сервера, и отдаёт заглушки ES-модулей
 * @function routeExternal
 * @description Подменяет указанные URL телом модуля, остальные внешние запросы обрывает
 * @param {import('@playwright/test').Page} page - Страница теста
 * @param {Object<string, string>} stubs - Префикс URL → исходный код модуля-заглушки
 * @returns {Promise<void>}
 */
async function routeExternal(page, stubs = {}) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => {
    const url = route.request().url();
    const prefix = Object.keys(stubs).find(p => url.startsWith(p));
    if (!prefix) return route.abort();
    return route.fulfill({
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: stubs[prefix],
    });
  });
}

test.describe('Страницы без WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await disableWebGL(page);
    await routeExternal(page);
  });

  test('3D-шарики: сообщение «Требуется WebGL», контролы скрыты', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/3d_balls.html`);
    await expect(page.locator('#webglRequired')).toBeVisible();
    await expect(page.locator('#webglRequired')).toContainText('WebGL');
    await expect(page.locator('#controls')).toBeHidden();
  });

  test('Радио-глобус: загрузка остановлена, показано сообщение про WebGL', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/radio-globe.html`);
    await expect(page.locator('#loading-text')).toContainText('WebGL');
    await expect(page.locator('#loading .spinner')).toBeHidden();
    await expect(page.locator('#top-bar')).toBeHidden();
  });

  test('MP3-визуализатор: ошибка WebGL, а не ошибка аудиопотока', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/mp3_effects.html`);
    await expect(page.locator('#webglError')).toContainText('WebGL');
    await expect(page.locator('#startVisualization')).toBeDisabled();
  });
});

test.describe('Страницы с WebGL: ложного сообщения нет', () => {
  for (const file of ['3d_balls.html', 'radio-globe.html', 'mp3_effects.html']) {
    test(`${file}: сообщение про WebGL не показано`, async ({ page, baseURL }) => {
      await routeExternal(page);
      await page.goto(`${baseURL}/${file}`);
      // Даём странице дойти до проверки WebGL, затем убеждаемся, что сообщения нет
      await page.waitForLoadState('load');
      await expect(
        page.getByText(/Требуется WebGL|WebGL required|WebGL is not available/)
      ).toBeHidden();
    });
  }
});

// Заглушка Transformers.js: пайплайн создаётся мгновенно, без загрузки модели
const TRANSFORMERS_STUB =
  'export const env = {};' +
  'export async function pipeline() { return async () => ({ data: new Float32Array(384) }); }';

test.describe('RAG Search: бэкенд модели', () => {
  const gpuVariants = {
    'navigator.gpu отсутствует': 'none',
    'requestAdapter возвращает null': 'null',
    'адаптер WebGPU есть': 'adapter',
  };

  for (const [title, variant] of Object.entries(gpuVariants)) {
    test(`${title}: WebGPU не заявлен, показан фактический WASM`, async ({
      page,
      baseURL,
    }) => {
      await page.addInitScript(mode => {
        const gpu =
          mode === 'none'
            ? undefined
            : { requestAdapter: async () => (mode === 'null' ? null : {}) };
        Object.defineProperty(window.Navigator.prototype, 'gpu', {
          configurable: true,
          get: () => gpu,
        });
      }, variant);
      await routeExternal(page, {
        'https://cdn.jsdelivr.net/npm/@xenova/transformers': TRANSFORMERS_STUB,
      });
      await page.goto(`${baseURL}/rag-browser-search.html`);
      await expect(page.locator('#modelStatus')).toHaveText('Модель готова');
      await expect(page.locator('#techType')).toHaveText('WASM');
      await expect(page.locator('#techBadge')).not.toHaveClass(/webgpu/);
    });
  }
});

test.describe('WebLLM Chat: приватность и сетевые инструменты', () => {
  test.beforeEach(async ({ page }) => {
    await routeExternal(page, {
      'https://esm.run/@mlc-ai/web-llm': 'export class MLCEngine {}',
    });
  });

  test('По умолчанию инструменты включены: предупреждение о внешних запросах', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/webllm-chat.html`);
    await expect(page.locator('#privacyToolsNote')).toContainText('внешние сервисы');
    await expect(page.locator('#privacyBadge')).toContainText('Сеть');
    await expect(page.locator('#welcomeMessage')).not.toContainText(
      'Полная конфиденциальность - все вычисления локально'
    );
  });

  test('Все инструменты выключены: данные чата не покидают устройство', async ({
    page,
    baseURL,
    isMobile,
  }) => {
    // Логика приватности от устройства не зависит; на мобильном открытый сайдбар перекрывает шапку
    test.skip(isMobile, 'Проверяется на десктопных проектах');
    await page.goto(`${baseURL}/webllm-chat.html`);
    await page.locator('#chatHeaderModel').click();
    const items = page.locator('.tool-item');
    for (let i = 0; i < (await items.count()); i++) {
      await items.nth(i).locator('.tool-name').click();
    }
    await expect(page.locator('.tool-item.active')).toHaveCount(0);
    await expect(page.locator('#privacyToolsNote')).toContainText(
      'не покидают устройство'
    );
    await expect(page.locator('#privacyBadge')).toContainText('Локально');

    // Состояние сохраняется после перезагрузки
    await page.reload();
    await expect(page.locator('#privacyBadge')).toContainText('Локально');
  });
});
