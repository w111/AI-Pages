import { test, expect } from '@playwright/test';

/**
 * Тесты фильтров E-Commerce Dashboard: воронка, конверсия, категории и почасовой график
 * считаются из отфильтрованных демо-данных.
 */

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/ecommerce-dashboard.html`);
  await expect(page.locator('#funnelChart .funnel-value').first()).toBeVisible();
});

/**
 * @function expectedFromPage
 * @description Независимо пересчитывает ожидаемые показатели из salesData.daily по текущим фильтрам
 * @param {import('@playwright/test').Page} page - Страница дашборда
 * @returns {Promise<{conversion: string, visitors: string, orders: number, hourlySum: number, slices: number}>}
 */
function expectedFromPage(page) {
  return page.evaluate(() => {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    const category = document.getElementById('categoryFilter').value;
    // eslint-disable-next-line no-undef
    const days = salesData.daily.filter(
      d =>
        new Date(d.date) >= start &&
        new Date(d.date) <= end &&
        (category === 'all' || d.category === category)
    );
    const orders = days.reduce((s, d) => s + d.orders, 0);
    const visitors = days.reduce((s, d) => s + d.visitors, 0);
    // eslint-disable-next-line no-undef
    const hourly = hourlyChart.data.datasets[0].data;
    return {
      conversion: ((orders / visitors) * 100).toFixed(1) + '%',
      // eslint-disable-next-line no-undef
      visitors: formatNumber(visitors),
      orders,
      hourlySum: hourly.reduce((a, b) => a + b, 0),
      // eslint-disable-next-line no-undef
      slices: categoriesChart.data.labels.length,
    };
  });
}

test('Фильтр категории меняет воронку, конверсию, категории и график по часам', async ({
  page,
}) => {
  const funnelTop = page.locator('#funnelChart .funnel-value').first();
  const conversion = page.locator('#kpiConversion');

  const all = await expectedFromPage(page);
  await expect(conversion).toHaveText(all.conversion);
  await expect(funnelTop).toHaveText(all.visitors);
  expect(all.hourlySum).toBe(all.orders);
  expect(all.slices).toBeGreaterThan(1);

  // Данные случайные: берём категорию первого дня периода, чтобы у неё точно были дни
  const category = await page.evaluate(() => {
    const start = new Date(document.getElementById('startDate').value);
    // eslint-disable-next-line no-undef
    return salesData.daily.find(d => new Date(d.date) >= start).category;
  });
  await page.locator('#categoryFilter').selectOption(category);
  const filtered = await expectedFromPage(page);

  expect(filtered.visitors).not.toBe(all.visitors);
  await expect(funnelTop).toHaveText(filtered.visitors);
  await expect(conversion).toHaveText(filtered.conversion);
  expect(filtered.hourlySum).toBe(filtered.orders);
  expect(filtered.slices).toBe(1);
});

test('Смена периода меняет воронку и конверсию', async ({ page }) => {
  const funnelTop = page.locator('#funnelChart .funnel-value').first();
  const before = await expectedFromPage(page);

  await page.locator('#periodFilter').selectOption('7');
  const after = await expectedFromPage(page);

  expect(after.visitors).not.toBe(before.visitors);
  await expect(funnelTop).toHaveText(after.visitors);
  await expect(page.locator('#kpiConversion')).toHaveText(after.conversion);
  expect(after.hourlySum).toBe(after.orders);
});

test('Блоки без дат подписаны как общие демонстрационные данные', async ({ page }) => {
  await expect(page.locator('.chart-note')).toHaveCount(2);
  await expect(page.locator('.chart-note').first()).toContainText(
    'фильтр дат не применяется'
  );
});
