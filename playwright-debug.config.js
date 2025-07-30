import { defineConfig, devices } from '@playwright/test';

// Конфигурация для быстрой отладки известных проблем
export default defineConfig({
  testDir: './test_js',
  // Очень короткие таймауты для быстрого обнаружения проблем
  timeout: 5000, // 5 секунд на тест
  expect: {
    timeout: 1000, // 1 секунда на поиск элемента
  },
  fullyParallel: true, // Включаем параллельность для скорости
  forbidOnly: false, // Разрешаем .only для отладки
  retries: 0, // Без повторов для быстроты
  workers: 2, // 2 воркера для баланса скорости и стабильности
  reporter: [
    ['list'], // Компактный вывод
    ['html', { open: 'never' }], // HTML отчет без автооткрытия
  ],
  use: {
    baseURL: 'http://127.0.0.1:5500',
    trace: 'off', // Отключаем трейсинг для скорости
    screenshot: 'only-on-failure',
    video: 'off', // Отключаем видео для скорости
    // Очень короткие таймауты для действий
    actionTimeout: 1500, // 1.5 сек для действий
    navigationTimeout: 5000, // 5 сек для навигации
  },

  projects: [
    // Только Chrome для быстрой отладки
    {
      name: 'chromium-debug',
      use: {
        ...devices['Desktop Chrome'],
        // Оптимизации для скорости
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
    },
  ],

  webServer: {
    command: 'python3 -m http.server 5500',
    port: 5500,
    reuseExistingServer: true, // Переиспользуем сервер
    timeout: 30 * 1000, // 30 сек на запуск
  },
});
