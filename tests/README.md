# Структура тестов AI Pages

## 📁 **Текущая организация**

```
tests/
├── conftest.py                 # Глобальная конфигурация pytest
├── test_index_page_async.py    # Тесты главной страницы
├── test_template.py            # Шаблон для новых тестов (не запускается)
├── pages/                      # Page Object Model
│   └── main_page.py           # Page Object главной страницы
└── __pycache__/               # Кэш Python (игнорируется)
```

## 🎯 **Рекомендуемая структура для роста проекта**

Для лучшей организации при добавлении новых тестов:

```
tests/
├── conftest.py                 # Общая конфигурация
├── pytest.ini                 # Настройки pytest (в корне проекта)
│
├── unit/                       # Юнит-тесты (если появятся)
│   └── test_utils.py
│
├── integration/                # Интеграционные тесты
│   ├── test_index_page.py     # Текущий test_index_page_async.py
│   ├── test_tetris_page.py    # Тесты страницы Tetris
│   ├── test_python_editor.py  # Тесты Python Editor
│   └── test_games.py          # Тесты игровых страниц
│
├── e2e/                        # End-to-End тесты
│   ├── test_user_journey.py   # Полные пользовательские сценарии
│   └── test_cross_page_flows.py
│
├── performance/                # Тесты производительности
│   ├── test_load_times.py
│   └── test_memory_usage.py
│
├── accessibility/              # Тесты доступности (A11y)
│   ├── test_keyboard_nav.py
│   ├── test_screen_readers.py
│   └── test_color_contrast.py
│
├── pages/                      # Page Object Model
│   ├── __init__.py
│   ├── base_page.py           # Базовый класс для всех страниц
│   ├── main_page.py           # Главная страница
│   ├── tetris_page.py         # Страница Tetris
│   ├── python_editor_page.py  # Python Editor
│   └── games/                 # Page Objects игр
│       ├── __init__.py
│       ├── arcanoid_page.py
│       └── snake_page.py
│
├── fixtures/                   # Переиспользуемые фикстуры
│   ├── __init__.py
│   ├── browser_fixtures.py
│   ├── data_fixtures.py
│   └── auth_fixtures.py
│
├── helpers/                    # Вспомогательные утилиты
│   ├── __init__.py
│   ├── test_data.py
│   ├── assertions.py
│   └── screenshots.py
│
├── data/                       # Тестовые данные
│   ├── test_users.json
│   └── expected_results/
│
└── templates/                  # Шаблоны тестов
    ├── test_template.py        # Общий шаблон
    ├── page_template.py        # Шаблон Page Object
    └── performance_template.py # Шаблон performance теста
```

## 📋 **Соглашения по именованию**

### Файлы тестов:

- `test_*.py` - обычные тесты
- `*_test.py` - альтернативный формат
- Используйте описательные имена: `test_search_functionality.py`

### Функции тестов:

- `test_*` - обязательный префикс
- Описательные имена: `test_search_returns_results_for_valid_query`

### Классы тестов:

- `Test*` - префикс для группировки
- `TestSearchFunctionality`, `TestUserAuthentication`

### Page Objects:

- `*Page` - суффикс
- `MainPage`, `TetrisPage`, `PythonEditorPage`

## 🏃 **Команды запуска**

### По категориям:

```bash
# Все тесты
pytest tests/ -v

# Интеграционные тесты
pytest tests/integration/ -v

# Тесты производительности
pytest tests/performance/ -v

# Тесты доступности
pytest tests/accessibility/ -v

# Конкретная страница
pytest tests/integration/test_index_page.py -v
```

### По маркерам:

```bash
# Быстрые тесты
pytest -m "not slow" -v

# Тесты конкретного браузера
pytest -m "chromium" -v

# Smoke тесты
pytest -m "smoke" -v
```

## 🔧 **Миграция текущих тестов**

Для перехода к новой структуре:

1. **Создать папки:**

   ```bash
   mkdir -p tests/{integration,e2e,performance,accessibility,fixtures,helpers,data,templates}
   ```

2. **Переместить существующие тесты:**

   ```bash
   mv tests/test_index_page_async.py tests/integration/test_index_page.py
   mv tests/test_template.py tests/templates/
   ```

3. **Создать базовые файлы:**
   ```bash
   touch tests/{integration,pages,fixtures,helpers}/__init__.py
   ```

## 🎯 **Приоритеты развития**

### Краткосрочно (следующие тесты):

1. **Не меняем структуру** - добавляем тесты в корень `tests/`
2. **Создаем новые Page Objects** для других страниц
3. **Расширяем покрытие** главной страницы

### Долгосрочно (при росте):

1. **Мигрируем** к категорийной структуре
2. **Добавляем** специализированные тесты
3. **Создаем** общие утилиты и хелперы

## 📚 **Полезные ресурсы**

- [Pytest Best Practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html)
- [Page Object Model](https://playwright.dev/python/docs/pom)
- [Pytest Fixtures](https://docs.pytest.org/en/stable/explanation/fixtures.html)

---

**Правило:** Следуйте принципу "не сломай что работает" - текущая структура хорошая, улучшайте постепенно! 🎯
