import { defineConfig, devices } from '@playwright/test';

// Конфигурация для GitHub Actions (ограниченные ресурсы)
export default defineConfig({
  testDir: './test_js',
  // Увеличиваем таймауты для медленных серверов CI
  timeout: 30000, // 30 секунд на тест (медленный CI)
  expect: {
    timeout: 5000 // 5 секунд на поиск элемента (по умолчанию)
  },
  fullyParallel: false, // Отключаем параллельность для экономии ресурсов
  forbidOnly: true, // Запрещаем .only в CI
  retries: 2, // 2 повтора для нестабильных тестов
  workers: 1, // Только 1 воркер для экономии памяти
  reporter: [
    ['list'], // Компактный вывод в консоль
    ['html', { open: 'never', outputFolder: 'playwright-report-ci' }],
    ['junit', { outputFile: 'test-results/junit.xml' }] // Для интеграции с GitHub
  ],
  use: {
    baseURL: 'http://127.0.0.1:5500',
    trace: 'retain-on-failure', // Трейсы только при ошибках
    screenshot: 'only-on-failure', // Скриншоты только при ошибках
    video: 'retain-on-failure', // Видео только при ошибках
    // Таймауты для медленного CI
    actionTimeout: 10000, // 10 сек для действий
    navigationTimeout: 30000 // 30 сек для навигации
  },

  projects: [
    // Только один браузер в одном проекте для экономии ресурсов
    {
      name: 'chromium-ci',
      use: {
        ...devices['Desktop Chrome'],
        // Оптимизации для CI
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-background-timer-throttling',
            '--disable-background-networking',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off'
          ]
        }
      }
    }
  ],

  webServer: {
    command: 'python3 -m http.server 5500',
    port: 5500,
    reuseExistingServer: false, // Всегда перезапускаем в CI
    timeout: 60 * 1000 // 60 сек на запуск в медленном CI
  }
});
