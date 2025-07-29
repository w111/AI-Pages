import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';

export default [
  // Базовая конфигурация для всех JS файлов
  js.configs.recommended,

  // Общие настройки для всех файлов
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      // Основные правила качества кода
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',

      // Метрики качества кода
      'complexity': ['error', { max: 10 }], // Цикломатическая сложность < 10
      'max-depth': ['error', 4],            // Глубина вложенности < 4
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }], // Длина функций < 20 строк
      'max-params': ['error', 4],           // Количество параметров < 4

      // Форматирование (базовые правила)
      indent: ['warn', 2],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],
      'comma-dangle': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
    },
  },

  // Специальная конфигурация для Playwright тестов
  {
    files: ['test_js/**/*.spec.js', 'test_js/**/*.test.js'],
    plugins: {
      playwright,
    },
    rules: {
      ...playwright.configs.recommended.rules,
      
      // Более мягкие правила для тестов
      'complexity': ['error', { max: 15 }], // Тесты могут быть сложнее
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }], // Тесты могут быть длиннее
      'max-params': ['warn', 6], // Больше параметров в тестах допустимо

      // Разрешаем console в тестах для отладки
      'no-console': 'off',

      // Playwright специфичные правила
      'playwright/missing-playwright-await': 'error',
      'playwright/no-page-pause': 'warn',
      'playwright/no-skipped-test': 'warn',
      'playwright/expect-expect': 'warn',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-eval': 'error',
    },
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Браузерные API для Playwright тестов
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
  },

  // Конфигурация для config файлов
  {
    files: ['playwright*.config.js', '*.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Исключения
  {
    ignores: [
      // Из .gitignore - IDE файлы
      '.idea/**',
      '.specstory/**',
      '.bmad-core/**',
      
      // Из .gitignore - Python cache
      '__pycache__/**',
      '**/*.py[cod]',
      '**/*$py.class',
      '**/*.so',
      
      // Из .gitignore - Virtual environment
      'venv/**',
      'env/**',
      'ENV/**',
      
      // Из .gitignore - Node modules
      'node_modules/**',
      
      // Из .gitignore - OS files
      '.DS_Store',
      'Thumbs.db',
      
      // Из .gitignore - Test results
      'test-results/**',
      '.pytest_cache/**',
      'playwright-report/**',
      
      // Из .gitignore - Temporary files
      '**/*.tmp',
      '**/*.temp',
      '**/*.log',
      
      // Дополнительные исключения
      '.git/**',
      'playwright-report*/**',
      '*.min.js',
    ],
  },
];
