"""
Шаблон для новых Python тестов.

ВСЕ НОВЫЕ ТЕСТЫ ДОЛЖНЫ СОЗДАВАТЬСЯ НА PYTHON!

Используйте этот файл как базу для новых тестов.
Скопируйте структуру и адаптируйте под свои нужды.
"""

import pytest
from playwright.async_api import expect
# from pages.main_page import MainPage  # Доступен через фикстуру main

# Константы
# BASE_URL теперь берется из динамической фикстуры base_url

pytestmark = pytest.mark.asyncio


# ====================================
# ШАБЛОН НОВОГО ТЕСТА
# ====================================

async def test_new_feature_example(main, base_url):
    """
    Шаблон для нового теста функции.

    Замените на описание вашего теста.
    Следуйте соглашениям:
    - Используйте async/await с фикстурой base_url
    - Применяйте Page Object Model
    - Добавляйте подробные комментарии
    - Тестируйте в разных браузерах автоматически

    Примечание: main.base_url автоматически устанавливается из фикстуры conftest.py
    """
    # 1. Открытие страницы (URL берется автоматически из base_url)
    await main.open()

    # 2. Выполнение действий
    # await main.search('example')
    # await main.open_settings()

    # 3. Проверки
    # await expect(main.page.locator('selector')).to_be_visible()
    # assert condition

    # Пример базовой проверки
    await expect(main.page.locator('h1')).to_contain_text('AI Pages')


# ====================================
# ТЕСТЫ АДАПТИВНОСТИ (ШАБЛОН)
# ====================================

@pytest.mark.parametrize('viewport', [
    {'width': 320, 'height': 568},   # iPhone SE
    {'width': 375, 'height': 667},   # iPhone 8
    {'width': 768, 'height': 1024},  # iPad
    {'width': 1440, 'height': 900},  # Desktop
])
async def test_responsive_design_template(main, viewport):
    """
    Шаблон теста адаптивного дизайна.

    Автоматически тестирует разные разрешения экрана.
    """
    await main.page.set_viewport_size(viewport)
    await main.open()

    # Проверки специфичные для разрешения
    if viewport['width'] < 768:
        # Мобильные проверки
        pass
    elif viewport['width'] < 1024:
        # Планшетные проверки
        pass
    else:
        # Десктопные проверки
        pass

    # Общие проверки для всех разрешений
    await expect(main.page.locator('header')).to_be_visible()


# ====================================
# ТЕСТЫ ДОСТУПНОСТИ (ШАБЛОН)
# ====================================

async def test_accessibility_template(main, base_url):
    """
    Шаблон теста доступности.

    Проверяет A11y требования согласно WCAG 2.1 AA.
    """
    await main.open()

    # Проверка ARIA атрибутов
    search_input = main.page.locator('#searchInput')
    await expect(search_input).to_have_attribute('aria-label')

    # Проверка клавиатурной навигации
    await search_input.focus()
    focused_element = await main.page.evaluate('document.activeElement.id')
    assert focused_element == 'searchInput'

    # Проверка контрастности (базовая)
    body_color = await main.page.evaluate(
        'getComputedStyle(document.body).color'
    )
    assert body_color  # Проверка что цвет установлен


# ====================================
# ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ (ШАБЛОН)
# ====================================

async def test_performance_template(main, base_url):
    """
    Шаблон теста производительности.

    Проверяет время загрузки и отзывчивость.
    """
    import time

    start_time = time.time()
    await main.open()

    # Ожидание полной загрузки
    await main.page.wait_for_load_state('networkidle')
    end_time = time.time()

    # Проверка времени загрузки (< 2 секунд согласно PRD)
    load_time = end_time - start_time
    assert load_time < 2, (
        f'Страница загружается {load_time:.2f}с, требуется < 2с'
    )

    # Проверка Core Web Vitals
    metrics = await main.page.evaluate("""
        new Promise((resolve) => {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                resolve(entries.map(entry => ({
                    name: entry.name,
                    value: entry.value
                })));
            }).observe({entryTypes: ['largest-contentful-paint']});
        })
    """)

    # LCP должен быть < 2.5 секунд
    if metrics:
        lcp_value = metrics[0]['value']
        assert lcp_value < 2500, f'LCP {lcp_value}ms, требуется < 2500ms'


# ====================================
# ПРИМЕРЫ ЛУЧШИХ ПРАКТИК
# ====================================

class TestNewFeatureClass:
    """
    Шаблон класса тестов для группировки связанных тестов.

    Используйте классы для логической группировки тестов одной функции.
    """

    async def test_feature_basic_functionality(self, main):
        """Базовая функциональность."""
        await main.open()
        # Тест базовой функциональности

    async def test_feature_edge_cases(self, main):
        """Граничные случаи."""
        await main.open()
        # Тест граничных случаев

    async def test_feature_error_handling(self, main):
        """Обработка ошибок."""
        await main.open()
        # Тест обработки ошибок


# ====================================
# ПОЛЬЗОВАТЕЛЬСКИЕ ФИКСТУРЫ
# ====================================

@pytest.fixture
async def authenticated_user(main):
    """
    Пример фикстуры для аутентифицированного пользователя.

    Создайте подобные фикстуры для частых сценариев.
    """
    await main.open()
    # Логика аутентификации если нужна
    return main


@pytest.fixture
async def sample_data():
    """
    Пример фикстуры с тестовыми данными.

    Возвращает данные для тестов.
    """
    return {
        'search_terms': ['арканоид', 'тетрис', 'three.js'],
        'viewport_sizes': [
            {'width': 320, 'height': 568},
            {'width': 1920, 'height': 1080}
        ]
    }


# ====================================
# МАРКЕРЫ PYTEST
# ====================================

@pytest.mark.slow
async def test_slow_operation_template(main, base_url):
    """
    Пример медленного теста.

    Используйте маркер @pytest.mark.slow для тестов > 10 секунд.
    Запуск: pytest -m "not slow" для исключения медленных тестов.
    """
    await main.open()
    # Медленная операция


@pytest.mark.skip(reason='Функция еще не реализована')
async def test_future_feature_template(main, base_url):
    """
    Пример теста для будущей функции.

    Используйте @pytest.mark.skip для тестов функций в разработке.
    """
    pass


@pytest.mark.xfail(reason='Известная проблема #123')
async def test_known_issue_template(main, base_url):
    """
    Пример теста с известной проблемой.

    Используйте @pytest.mark.xfail для тестов с известными багами.
    """
    await main.open()
    # Тест который должен падать пока баг не исправлен
    assert False  # Известная проблема
