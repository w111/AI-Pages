# Руководство по участию в проекте AI-Pages

Спасибо за ваш интерес к участию в проекте AI-Pages! Мы приветствуем вклады от всех участников сообщества.

## 🚀 Обзор проекта

AI-Pages — это коллекция интерактивных веб-страниц и приложений, созданных с помощью ИИ. Проект включает в себя игры,
инструменты и демонстрации современных веб-технологий.

## 📋 Как внести вклад

### 1. Подготовка среды разработки

```bash
# Клонируйте репозиторий
git clone https://github.com/w111/AI-Pages.git
cd AI-Pages

# Установите зависимости
npm install

# Создайте виртуальное окружение Python (для тестов)
python3 -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Проверка качества кода

Перед отправкой изменений убедитесь, что все проверки проходят:

```bash
# Полная проверка всех линтеров
npm run lint

# Запуск тестов Python
python3 -m pytest tests/

# Запуск E2E тестов
npx playwright test
```

### 3. Типы вкладов

#### 🐛 Исправление ошибок

- Создайте issue, описав проблему
- Ссылайтесь на issue в вашем PR

#### ✨ Новые функции

- Сначала создайте issue для обсуждения новой функции
- Убедитесь, что функция соответствует целям проекта

#### 📝 Документация

- Улучшения документации всегда приветствуются
- Обновляйте README при добавлении новых страниц

#### 🎮 Новые игры/приложения

- Следуйте существующей структуре HTML файлов
- Включите адаптивный дизайн и темную тему
- Добавьте тесты для новой функциональности

### 4. Стандарты кода

#### HTML/CSS/JavaScript

- Используйте семантический HTML
- Поддерживайте адаптивный дизайн
- Реализуйте переключение светлой/темной темы
- Добавляйте ARIA-атрибуты для доступности

#### Именование файлов

- Используйте snake_case для HTML файлов
- Описательные имена (например: `snake_game.html`, `weather_app.html`)

#### Комментарии

- Комментируйте сложную логику
- Используйте русский язык для комментариев

### 5. Процесс Pull Request

1. **Создайте ветку:**

   ```bash
   git checkout -b feature/описание-изменения
   ```

2. **Сделайте изменения:**
   - Следуйте стандартам кода
   - Добавьте тесты если необходимо
   - Обновите документацию

3. **Проверьте качество:**

   ```bash
   npm run lint
   npm run format:check
   ```

4. **Зафиксируйте изменения:**

   ```bash
   git add .
   git commit -m "feat: добавлена новая игра в тетрис"
   ```

   Используйте conventional commits:
   - `feat:` - новая функция
   - `fix:` - исправление ошибки
   - `docs:` - изменения в документации
   - `style:` - форматирование кода
   - `test:` - добавление тестов

5. **Отправьте PR:**
   - Опишите ваши изменения
   - Ссылайтесь на связанные issues
   - Добавьте скриншоты для UI изменений

## 🧪 Тестирование

### Автоматические тесты

- **Python тесты:** `pytest tests/`
- **E2E тесты:** `npx playwright test`
- **Линтеры:** `npm run lint`

### Ручное тестирование

- Проверьте на разных размерах экрана
- Протестируйте светлую и темную темы
- Убедитесь в работе на мобильных устройствах

## 📁 Структура проекта

```text
AI-Pages/
├── *.html                 # Веб-страницы и игры
├── docs/                  # Документация
├── test_js/              # E2E тесты Playwright
├── tests/                # Python тесты
├── .github/workflows/    # CI/CD конфигурация
└── package.json          # Конфигурация проекта
```

## 🎯 Рекомендации

### Для новых участников

- Начните с простых issue, помеченных `good first issue`
- Изучите существующий код для понимания стиля
- Не стесняйтесь задавать вопросы в issues

### Для опытных разработчиков

- Помогайте новичкам в code review
- Предлагайте архитектурные улучшения
- Делитесь знаниями в обсуждениях

## 🔧 Инструменты разработки

- **IDE:** Рекомендуется VS Code с расширениями ESLint, Prettier
- **Браузеры:** Тестируйте в Chrome, Firefox, Safari
- **Линтеры:** ESLint, HTMLHint, Stylelint, yamllint
- **Тесты:** Playwright для E2E, pytest для Python

## 📞 Связь

- **Issues:** Для багов и предложений функций
- **Discussions:** Для общих вопросов и идей
- **Code Review:** В комментариях к Pull Requests

## 📜 Лицензия

Участвуя в этом проекте, вы соглашаетесь с тем, что ваши вклады будут лицензированы под той же лицензией, что и проект.

---

**Спасибо за ваш вклад в AI-Pages! 🚀**
