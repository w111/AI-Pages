import { defineConfig, devices } from '@playwright/test';

// Конфигурация с встроенным статическим сервером Playwright (самый быстрый)
export default defineConfig({
  testDir: './test_js',
  timeout: 8000,
  expect: {
    timeout: 1200
  },
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: '100%', // Максимальная параллельность
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:9323', // Встроенный статический сервер
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 1800,
    navigationTimeout: 6000
  },

  projects: [
    {
      name: 'chromium-builtin',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Экономия памяти
            '--disable-gpu' // Для максимальной скорости в CI
          ]
        }
      }
    }
  ],

  // Встроенный статический веб-сервер Playwright (самый быстрый!)
  webServer: {
    command: 'npx serve . -l 9323 --no-clipboard',
    port: 9323,
    reuseExistingServer: !process.env.CI, // В CI всегда новый сервер
    timeout: 15 * 1000,
    stdout: 'ignore', // Убираем логи сервера
    stderr: 'pipe'
  }
});
