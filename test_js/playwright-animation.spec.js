import { test, expect } from '@playwright/test';

test('Анимация при наведении на карточку', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/index.html`);

  const card = page.locator('.example-card').first();
  await expect(card).toBeVisible();

  // Получаем начальные стили
  const initialStyles = await card.evaluate(el => {
    const computed = getComputedStyle(el);
    return {
      boxShadow: computed.boxShadow,
      transform: computed.transform,
      transition: computed.transition
    };
  });

  // Проверяем что у карточки есть transition для анимации
  expect(initialStyles.transition).toMatch(/.*box-shadow.*/);

  // Применяем hover эффект для тестирования анимации
  await card.hover();

  // Ждем завершения анимации по transition свойству
  await expect(card).toHaveCSS('transition', /.*box-shadow.*/);

  // Получаем стили после взаимодействия
  const finalStyles = await card.evaluate(el => {
    const computed = getComputedStyle(el);
    return {
      boxShadow: computed.boxShadow,
      transform: computed.transform
    };
  });

  // Проверяем что произошло изменение (box-shadow или transform)
  const shadowChanged = finalStyles.boxShadow !== initialStyles.boxShadow;
  const transformChanged = finalStyles.transform !== initialStyles.transform;

  // Хотя бы одно из свойств должно измениться
  expect(shadowChanged || transformChanged).toBe(true);
});
