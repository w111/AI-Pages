import { test, expect } from '@playwright/test';

test('Анимация при наведении на карточку', async ({ page, baseURL, browserName }) => {
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
  
  // На мобильных устройствах hover может не работать, поэтому используем click
  const isMobile = browserName === 'webkit' && page.viewportSize()?.width && page.viewportSize()?.width < 768;
  
  if (isMobile) {
    // На мобильных устройствах симулируем touch
    await card.click();
  } else {
    // На десктопе используем hover
    await card.hover();
  }
  
  // Ждем некоторое время для анимации
  await page.waitForTimeout(500);
  
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
