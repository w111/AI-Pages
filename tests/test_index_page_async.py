"""Асинхронные тесты Playwright для index.html (Python)."""

import re
import pytest
from playwright.async_api import async_playwright, expect
import warnings
from pages.main_page import MainPage

warnings.filterwarnings('ignore', category=DeprecationWarning)

# BASE_URL теперь берется из фикстуры base_url

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def browser():
    """Фикстура браузера Playwright."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()


@pytest.fixture
async def page(browser):
    """Фикстура страницы Playwright."""
    context = await browser.new_context()
    page = await context.new_page()
    yield page
    await context.close()


@pytest.fixture
async def main(page, base_url):
    """Page Object для главной страницы."""
    main_page = MainPage(page)
    main_page.base_url = base_url
    return main_page


async def open_settings(page):
    """Открыть модальное окно настроек."""
    await page.get_by_title('Настройки').click()
    await page.locator('.settings-modal.show').wait_for(state='visible')


async def set_all_settings(page):
    """Включить все настройки: тема, язык, вид."""
    await open_settings(page)
    theme_label = page.locator('label[for="themeSwitch"]')
    lang_label = page.locator('label[for="languageSwitch"]')
    view_label = page.locator('label[for="viewSwitch"]')
    await theme_label.wait_for(state='visible')
    await lang_label.wait_for(state='visible')
    await view_label.wait_for(state='visible')
    await theme_label.click()
    await lang_label.click()
    await view_label.click()


async def test_animation_on_hover(main):
    """Проверка анимации при наведении на карточку."""
    await main.open()
    card = main.cards.first
    shadow_before = await card.evaluate('el => getComputedStyle(el).boxShadow')
    await card.hover()
    await main.page.wait_for_timeout(300)
    shadow_after = await card.evaluate('el => getComputedStyle(el).boxShadow')
    assert shadow_after != shadow_before


async def test_tab_focus_on_settings(main):
    """Проверка фокуса по Tab на иконку настроек."""
    await main.open()
    found = False
    for _ in range(10):
        await main.page.keyboard.press('Tab')
        active = await main.page.evaluate(
            "document.activeElement.classList.contains('settings-icon')"
        )
        if active:
            found = True
            break
    assert found


async def test_switch_language(main):
    """Проверка переключения языка и смены текстов."""
    await main.open()
    await main.open_settings()
    await main.lang_label.wait_for(state='visible')
    await main.lang_label.click()
    await expect(main.page.locator('header h1')).to_contain_text('AI Pages')
    subtitle_locator = main.page.locator('.subtitle')
    await expect(subtitle_locator).to_contain_text(
        'Turn ideas into code in minutes'
    )
    open_btn = main.page.locator('.view-btn').first
    await expect(open_btn).to_contain_text('Open')
    footer_locator = main.page.locator('footer')
    await expect(footer_locator).to_contain_text('All examples are developed')
    headers = await main.get_card_titles()
    assert any('3D Balls' in h for h in headers)


async def test_header_link(main):
    """Проверка перехода по заголовку карточки."""
    await main.open()
    first_link = main.page.locator('.example-card .card-header h3 a').first
    href = await first_link.get_attribute('href')
    await first_link.click()
    pattern = re.compile(href.replace('.', r'\.'))
    await expect(main.page).to_have_url(pattern)


async def test_open_button(main):
    """Проверка перехода по кнопке 'Открыть'."""
    await main.open()
    open_btn = main.page.locator('.example-card .card-footer .view-btn').first
    href = await open_btn.get_attribute('href')
    await open_btn.click()
    pattern = re.compile(href.replace('.', r'\.'))
    await expect(main.page).to_have_url(pattern)


async def test_adaptive_mobile(main):
    """Проверка адаптивности: карточки в одну колонку на мобильном."""
    await main.page.set_viewport_size({'width': 375, 'height': 800})
    await main.open()
    card = main.cards.first
    card_box = await card.bounding_box()
    container = main.page.locator('.examples-grid').first
    container_box = await container.bounding_box()
    assert card_box['width'] > container_box['width'] * 0.8


async def test_dark_theme_switch(main):
    """Проверка переключения в тёмную тему и восстановления после перезагрузки."""
    await main.open()
    await main.open_settings()
    await main.theme_label.wait_for(state='visible')
    await main.theme_label.click()
    await expect(main.page.locator('body')).to_have_class(re.compile('dark-theme'))
    theme_switch = main.page.locator('#themeSwitch')
    assert await theme_switch.is_checked()
    theme_value = await main.page.evaluate('localStorage.getItem("theme")')
    assert theme_value == 'dark'
    bg_color = await main.page.evaluate(
        'getComputedStyle(document.body).backgroundColor')
    assert bg_color != 'rgb(248, 250, 252)'
    await main.page.reload()
    await expect(main.page.locator('body')).to_have_class(re.compile('dark-theme'))


async def test_search_by_title(main):
    """Проверка поиска по названию карточки."""
    await main.open()
    await main.search('Арканоид')
    count = await main.get_visible_cards_count()
    assert count == 1
    titles = await main.get_card_titles()
    assert any('Арканоид' in t for t in titles)


async def test_search_by_tag(main):
    """Проверка поиска по тегу технологии."""
    await main.open()
    await main.search('Three.js')
    count = await main.get_visible_cards_count()
    assert count == 2


async def test_search_clear(main):
    """Проверка очистки поиска — возвращаются все карточки."""
    await main.open()
    await main.search('Арканоид')
    count = await main.get_visible_cards_count()
    assert count == 1
    await main.search('')
    count = await main.get_visible_cards_count()
    assert count > 5


async def test_search_no_results(main):
    """Проверка поиска по несуществующему запросу — карточки и категории скрываются."""
    await main.open()
    await main.search('qwertyuiopasdfgh')
    assert await main.get_visible_cards_count() == 0
    assert await main.page.locator('.category:visible').count() == 0


async def test_settings_modal_open_close(main):
    """Проверка открытия и закрытия модального окна настроек."""
    await main.open()
    await main.open_settings()
    await expect(main.page.locator('#settingsModal')).to_be_visible()
    await main.page.mouse.click(10, 10)
    await expect(main.page.locator('#settingsModal')).not_to_be_visible()


async def test_view_switch(main):
    """Проверка переключения вида (список)."""
    await main.open()
    await main.open_settings()
    await main.view_label.wait_for(state='visible')
    await main.view_label.click()
    await expect(main.page.locator('.container')).to_have_class(re.compile('list-view'))


async def test_view_switch_restore(main):
    """Проверка восстановления вида после перезагрузки."""
    await main.open()
    await main.open_settings()
    await main.view_label.wait_for(state='visible')
    await main.view_label.click()
    await main.page.reload()
    await expect(main.page.locator('.container')).to_have_class(re.compile('list-view'))


async def test_localstorage_restore_all(main):
    """Проверка восстановления всех настроек после перезагрузки."""
    await main.open()
    await main.set_all_settings()
    await main.page.reload()
    await expect(main.page.locator('body')).to_have_class(re.compile('dark-theme'))
    await expect(main.page.locator('#languageSwitch')).to_be_checked()
    await expect(main.page.locator('#viewSwitch')).to_be_checked()


async def test_adaptive_tablet_768px(main):
    """Проверка адаптивности планшета 768px."""
    await main.page.set_viewport_size({'width': 768, 'height': 1024})
    await main.open()

    # Проверяем что карточки в 2-3 колонки
    container = main.page.locator('.examples-grid').first
    container_box = await container.bounding_box()
    first_card = main.cards.first
    card_box = await first_card.bounding_box()

    # На планшете карточка должна занимать меньше половины ширины
    max_width = container_box['width'] * 0.6
    assert card_box['width'] < max_width


async def test_adaptive_tablet_1024px(main):
    """Проверка адаптивности планшета 1024px."""
    await main.page.set_viewport_size({'width': 1024, 'height': 768})
    await main.open()

    # Проверяем оптимальное использование пространства
    container = main.page.locator('.examples-grid').first
    container_box = await container.bounding_box()
    first_card = main.cards.first
    card_box = await first_card.bounding_box()

    # Должно быть 2-3 колонки на планшете 1024px
    max_width = container_box['width'] * 0.6
    assert card_box['width'] < max_width


async def test_adaptive_desktop_1440px(main):
    """Проверка адаптивности больших экранов 1440px."""
    await main.page.set_viewport_size({'width': 1440, 'height': 900})
    await main.open()

    # Проверяем центрирование контента
    container = main.page.locator('.container').first
    container_box = await container.bounding_box()
    viewport_width = 1440

    # Контейнер должен быть центрирован с отступами
    assert container_box['x'] > 0
    assert container_box['x'] + container_box['width'] < viewport_width


async def test_adaptive_4k_screen(main):
    """Проверка адаптивности 4K экранов."""
    await main.page.set_viewport_size({'width': 1920, 'height': 1080})
    await main.open()

    # Проверяем максимальную ширину контейнера
    container = main.page.locator('.container').first
    container_box = await container.bounding_box()

    # Контейнер не должен растягиваться на всю ширину
    assert container_box['width'] < 1920 * 0.9


async def test_mobile_320px_no_horizontal_scroll(main):
    """Проверка отсутствия горизонтального скролла на 320px."""
    await main.page.set_viewport_size({'width': 320, 'height': 568})
    await main.open()

    # Проверяем отсутствие горизонтального скролла
    body_scroll_width = await main.page.evaluate(
        'document.body.scrollWidth'
    )
    assert body_scroll_width <= 320


async def test_mobile_360px_single_column(main):
    """Проверка одной колонки на Android разрешении 360px."""
    await main.page.set_viewport_size({'width': 360, 'height': 640})
    await main.open()

    # Проверяем что карточки в одну колонку
    card = main.cards.first
    card_box = await card.bounding_box()
    container = main.page.locator('.examples-grid').first
    container_box = await container.bounding_box()

    assert card_box['width'] > container_box['width'] * 0.8
