import { test, expect } from "@playwright/test";

/**
 * Тесты для конвертера форматов данных
 */

test.describe("Конвертер форматов данных", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/data_format_converter.html`);
  });

  test("Страница загружается корректно", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Конвертер форматов данных");
    await expect(page.locator("#inputEditor")).toBeVisible();
    await expect(page.locator("#outputDisplay")).toBeVisible();
  });

  test("Конвертация JSON в YAML", async ({ page }) => {
    const jsonInput = '{"name": "test", "value": 123}';

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#outputFormat").selectOption("yaml");
    await page.locator("#inputEditor").fill(jsonInput);
    await page.locator('button:has-text("Конвертировать")').click();

    const output = await page.locator("#outputCode").textContent();
    expect(output).toContain("name:");
    expect(output).toContain("test");
    expect(output).toContain("value:");
    expect(output).toContain("123");
  });

  test("Конвертация JSON в TOML", async ({ page }) => {
    const jsonInput = '{"name": "test", "count": 42}';

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#outputFormat").selectOption("toml");
    await page.locator("#inputEditor").fill(jsonInput);
    await page.locator('button:has-text("Конвертировать")').click();

    const output = await page.locator("#outputCode").textContent();
    expect(output).toContain('name = "test"');
    expect(output).toContain("count = 42");
  });

  test("Конвертация JSON в XML", async ({ page }) => {
    const jsonInput = '{"item": "value"}';

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#outputFormat").selectOption("xml");
    await page.locator("#inputEditor").fill(jsonInput);
    await page.locator('button:has-text("Конвертировать")').click();

    const output = await page.locator("#outputCode").textContent();
    expect(output).toContain("<?xml");
    expect(output).toContain("<item>");
    expect(output).toContain("value");
  });

  test("Автоопределение формата JSON", async ({ page }) => {
    const jsonInput = '{"auto": "detect"}';

    await page.locator("#inputFormat").selectOption("auto");
    await page.locator("#inputEditor").fill(jsonInput);

    // Ждем обновления статуса
    await expect(page.locator("#statusMessage")).toContainText("JSON", { timeout: 3000 });
  });

  test("Валидация некорректного JSON", async ({ page }) => {
    const invalidJson = '{"broken": }';

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#inputEditor").fill(invalidJson);
    await page.locator('button:has-text("Конвертировать")').click();

    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator("#statusMessage")).toContainText("Ошибка");
  });

  test("Функция Beautify форматирует JSON", async ({ page }) => {
    const compactJson = '{"a":1,"b":2}';

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#inputEditor").fill(compactJson);
    await page.locator('button:has-text("Beautify")').click();

    const formatted = await page.locator("#inputEditor").inputValue();
    expect(formatted).toContain("\n");
    expect(formatted.length).toBeGreaterThan(compactJson.length);
  });

  test("Функция Minify сжимает JSON", async ({ page }) => {
    const prettyJson = `{
    "a": 1,
    "b": 2
}`;

    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#inputEditor").fill(prettyJson);
    await page.locator('button:has-text("Minify")').click();

    const minified = await page.locator("#inputEditor").inputValue();
    expect(minified).not.toContain("\n");
    expect(minified.length).toBeLessThan(prettyJson.length);
  });

  test("Переключение на вкладку сравнения", async ({ page }) => {
    await page.locator('button[data-tab="diff"]').click();

    await expect(page.locator("#diff-tab")).toBeVisible();
    await expect(page.locator("#diffEditorA")).toBeVisible();
    await expect(page.locator("#diffEditorB")).toBeVisible();
  });

  test("Сравнение двух версий данных", async ({ page }) => {
    await page.locator('button[data-tab="diff"]').click();

    await page.locator("#diffFormat").selectOption("json");
    await page.locator("#diffEditorA").fill('{"name": "old"}');
    await page.locator("#diffEditorB").fill('{"name": "new"}');
    await page.locator('button:has-text("Сравнить")').click();

    const diffResult = await page.locator("#diffResult").textContent();
    expect(diffResult).toContain("old");
    expect(diffResult).toContain("new");
  });

  test("Переключение темной темы", async ({ page }) => {
    await page.locator('button[title="Настройки"]').click();
    await expect(page.locator("#settingsModal")).toHaveClass(/active/);

    await page.locator("#darkThemeToggle").check();
    await expect(page.locator("body")).toHaveClass(/dark-theme/);

    await page.locator("#darkThemeToggle").uncheck();
    await expect(page.locator("body")).not.toHaveClass(/dark-theme/);
  });

  test("Загрузка примера данных", async ({ page }) => {
    await page.locator('button[title="Загрузить пример"]').click();

    const input = await page.locator("#inputEditor").inputValue();
    expect(input.length).toBeGreaterThan(0);
    expect(input).toContain("AI Pages");
  });

  test("Очистка всех полей", async ({ page }) => {
    await page.locator("#inputEditor").fill('{"test": "data"}');
    await page.locator('button[title="Очистить все"]').click();

    const input = await page.locator("#inputEditor").inputValue();
    expect(input).toBe("");
  });

  test("Счетчик символов обновляется", async ({ page }) => {
    await page.locator("#inputEditor").fill("12345");
    await expect(page.locator("#charCount")).toContainText("5 символов");

    await page.locator("#inputEditor").fill("1234567890");
    await expect(page.locator("#charCount")).toContainText("10 символов");
  });

  test("Кнопка копирования работает", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const jsonInput = '{"copy": "test"}';
    await page.locator("#inputFormat").selectOption("json");
    await page.locator("#inputEditor").fill(jsonInput);
    await page.locator('button:has-text("Конвертировать")').click();

    await page.locator('button[title="Копировать"]').click();

    // Проверяем уведомление
    await expect(page.locator("#notification")).toHaveClass(/show/);
  });
});
