import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test_js',
  // Уменьшаем общий таймаут теста с 30 до 15 секунд
  timeout: 15000,
  expect: {
    // Уменьшаем таймаут ожидания элементов с 5 до 2 секунд
    timeout: 2000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Оптимальное количество воркеров для параллельности
  workers: process.env.CI ? 2 : '50%',
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Добавляем глобальные таймауты для действий
    actionTimeout: 3000, // Таймаут для действий (click, type, etc.)
    navigationTimeout: 10000 // Таймаут для навигации
  },

  projects: [
    // Chromium тесты (основной браузер для отладки)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Дополнительные оптимизации для Chrome
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      }
    },

    // Firefox тесты (Gecko engine)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    // Safari тесты (WebKit engine)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    // Мобильные тесты
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },

    // Планшетные тесты
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] }
    },

    // Тесты с различными разрешениями экранов
    {
      name: 'Desktop 1440p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'Desktop 4K',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],

  webServer: {
    command: 'python3 -m http.server 5500',
    port: 5500,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000 // 2 минуты на запуск сервера
  }
});
