import { test, expect } from '@playwright/test';

/**
 * Тесты для WebGPU Code Agent (без загрузки модели: проверяются UI,
 * рабочее пространство, разбор tool-calls и выполнение инструментов)
 */

// Пример сырого ответа модели: размышления, текст и два XML tool-call (второй с CDATA)
const SAMPLE_OUTPUT =
  '<think>\nнадо прочитать\n</think>\n\nЧитаю файл.' +
  '<function name="read_file"><param name="path">app.js</param></function>' +
  '<function name="write_file"><param name="path">x.js</param>' +
  '<param name="content"><![CDATA[if (a < b) {\n  go();\n}]]></param></function><|im_end|>';

/**
 * Выполняет на странице цепочку вызовов инструментов агента
 * @param {import('@playwright/test').Page} page - Страница с загруженным приложением
 * @param {Array<{name: string, arguments: Object}>} calls - Вызовы в порядке выполнения
 * @returns {Promise<{results: Array<{ok: boolean, output: string}>, files: string[]}>} Результаты и файлы
 */
function callTools(page, calls) {
  return page.evaluate(async list => {
    const { executeTool, workspace } = window.agentDebug;
    const results = [];
    for (const call of list) {
      results.push(await executeTool(call));
    }
    return { results, files: workspace.list() };
  }, calls);
}

test.describe('WebGPU Code Agent', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/webgpu_code_agent.html`);
  });

  test('Страница загружается с демо-файлами', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('WebGPU Code Agent');
    await expect(page.locator('#fileList li')).toHaveCount(3);
    await expect(page.locator('#loadBtn')).toBeVisible();
  });

  test('Файл открывается в редакторе и сохраняется', async ({ page }) => {
    await page.locator('#fileList li', { hasText: 'sales.csv' }).click();
    await expect(page.locator('#editor')).toHaveValue(/date,product/);
    await page.locator('#editor').fill('a,b\n1,2\n');
    await page.locator('#saveBtn').click();
    await page.reload();
    await page.locator('#fileList li', { hasText: 'sales.csv' }).click();
    await expect(page.locator('#editor')).toHaveValue('a,b\n1,2\n');
  });

  test('Разбор ответа модели: размышления, текст и XML tool-calls с CDATA', async ({
    page,
  }) => {
    const parsed = await page.evaluate(
      raw => window.agentDebug.parseAssistant(raw),
      SAMPLE_OUTPUT
    );
    expect(parsed.thinking).toBe('надо прочитать');
    expect(parsed.content).toBe('Читаю файл.');
    expect(parsed.calls).toEqual([
      { name: 'read_file', arguments: { path: 'app.js' } },
      {
        name: 'write_file',
        arguments: { path: 'x.js', content: 'if (a < b) {\n  go();\n}' },
      },
    ]);
  });
});

test.describe('WebGPU Code Agent: инструменты', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/webgpu_code_agent.html`);
  });

  test('Правка файла и запуск кода', async ({ page }) => {
    const { results } = await callTools(page, [
      {
        name: 'edit_file',
        arguments: {
          path: 'app.js',
          old_text: 'i <= items.length',
          new_text: 'i < items.length',
        },
      },
      { name: 'run_js', arguments: { code: 'console.log("готово")' } },
      { name: 'read_file', arguments: { path: 'nope.txt' } },
    ]);
    expect(results[0].ok).toBe(true);
    expect(results[1].output).toBe('готово');
    expect(results[2].ok).toBe(false);
  });

  test('Путь с переносами строк и кириллицей обрабатывается', async ({ page }) => {
    const { results, files } = await callTools(page, [
      { name: 'write_file', arguments: { path: '\n  отчёт.md\n', content: '# Итоги' } },
      { name: 'read_file', arguments: { path: 'отчёт.md' } },
    ]);
    expect(results[0].ok).toBe(true);
    expect(files).toContain('отчёт.md');
    expect(results[1].output).toBe('# Итоги');
  });

  test('Выход за пределы папки и неизвестный инструмент отклоняются', async ({
    page,
  }) => {
    const { results } = await callTools(page, [
      { name: 'write_file', arguments: { path: '/etc/passwd', content: 'x' } },
      { name: 'write_file', arguments: { path: '../escape.txt', content: 'x' } },
      { name: 'sudo', arguments: {} },
    ]);
    expect(results[0].ok).toBe(false);
    expect(results[1].ok).toBe(false);
    expect(results[2].output).toContain('Неизвестный инструмент');
  });
});

test.describe('WebGPU Code Agent: песочница', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/webgpu_code_agent.html`);
  });

  test('Песочница run_js: сеть отключена, асинхронный вывод не теряется', async ({
    page,
  }) => {
    const { results } = await callTools(page, [
      { name: 'run_js', arguments: { code: 'typeof fetch' } },
      {
        name: 'run_js',
        arguments: { code: '(async () => { console.log("позже"); return 7; })()' },
      },
      { name: 'run_js', arguments: { code: 'require("fs")' } },
    ]);
    expect(results[0].output).toContain('undefined');
    expect(results[1].output).toContain('позже');
    expect(results[1].output).toContain('=> 7');
    expect(results[2].output).toContain('Подсказка');
  });
});
