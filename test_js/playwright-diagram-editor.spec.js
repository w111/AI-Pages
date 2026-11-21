import { test, expect } from '@playwright/test';

/**
 * Тесты смены типа диаграммы в редакторе: демопример заменяется, пользовательский код сохраняется.
 * Сервер рендера Kroki замокан через page.route — живых запросов нет.
 */

test.beforeEach(async ({ page, baseURL }) => {
  // Мок Kroki: PlantUML-код под типом mermaid даёт 400, как настоящий сервер
  await page.route('https://kroki.io/**', route => {
    const req = route.request();
    if (req.url().includes('/mermaid/') && req.postData().includes('@startuml')) {
      return route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Syntax error',
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    });
  });
  await page.goto(`${baseURL}/diagram_editor.html`);
  await expect(page.locator('#editorTextarea')).toHaveValue(/^@startuml/);
});

test('Демо PlantUML при переключении на Mermaid заменяется демо Mermaid и рендерится', async ({
  page,
}) => {
  await page.locator('#diagramType').selectOption('mermaid');

  await expect(page.locator('#editorTextarea')).toHaveValue(/^graph TD/);
  await page.locator('#btnRender').click();
  await expect(page.locator('#previewContent svg')).toBeVisible();
  await expect(page.locator('#statusText')).toHaveText('Готово');
});

test('Изменённый текст сохраняется при смене типа и появляется предупреждение', async ({
  page,
}) => {
  const userCode = '@startuml\nAlice -> Bob : hi\n@enduml';
  await page.locator('#editorTextarea').fill(userCode);

  await page.locator('#diagramType').selectOption('mermaid');

  await expect(page.locator('#editorTextarea')).toHaveValue(userCode);
  await expect(page.locator('#toast')).toHaveClass(/show/);
  await expect(page.locator('#toast')).toContainText('другого формата');

  // Предупреждение оправдано: PlantUML под типом Mermaid сервер отклоняет
  await page.locator('#btnRender').click();
  await expect(page.locator('#statusText')).toHaveText('Ошибка');
});

test('Пустой редактор при смене типа получает демопример нового формата', async ({
  page,
}) => {
  await page.locator('#editorTextarea').fill('');

  await page.locator('#diagramType').selectOption('graphviz');

  await expect(page.locator('#editorTextarea')).toHaveValue(/^digraph G/);
});
