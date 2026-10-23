"""Проверки реального каталога: поиск, настройки, навигация и адаптивность."""

import re
import pytest
from playwright.async_api import expect
from pages.main_page import MainPage

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def page(browser):
    """Отдельный контекст без localStorage предыдущего теста."""
    context = await browser.new_context()
    page = await context.new_page()
    yield page
    await context.close()


@pytest.fixture
async def main(page, base_url):
    """Открытый Page Object с настоящим HTTP-сервером."""
    main_page = MainPage(page)
    main_page.base_url = base_url
    await main_page.open()
    await expect(main_page.cards.first).to_be_visible()
    return main_page


async def test_search_by_title(main):
    """Поиск названия оставляет выбранное приложение."""
    await main.search('Арканоид')
    await expect(main.cards).to_have_count(1)
    await expect(main.cards.locator('h3')).to_have_text('Арканоид')


async def test_search_by_tag(main):
    """Поиск технологии проверяет каждую найденную карточку."""
    await main.search('Three.js')
    await expect(main.cards).to_have_count(3)
    for card in await main.cards.all():
        await expect(card.locator('.tool-tags')).to_contain_text('Three.js')


async def test_search_clear(main):
    """Очистка возвращает тот же набор карточек."""
    count = await main.cards.count()
    await main.search('Арканоид')
    await expect(main.cards).to_have_count(1)
    await main.search('')
    await expect(main.cards).to_have_count(count)
    await expect(main.page.locator('#noResults')).to_be_hidden()


async def test_search_no_results(main):
    """Пустой результат показывает запрос вместо карточек и категорий."""
    await main.search('qwertyuiopasdfgh')
    await expect(main.cards).to_have_count(0)
    await expect(main.page.locator('.category-section')).to_have_count(0)
    await expect(main.page.locator('#noResults')).to_be_visible()
    await expect(main.page.locator('#noResults')).to_contain_text(
        'qwertyuiopasdfgh')


async def test_language_and_persistence(main):
    """EN/RU меняет UI и сохраняет выбранный язык."""
    await main.page.locator('#langEn').click()
    await expect(main.page.locator('.hero-tagline')).to_have_text(
        'Turn ideas into code in minutes, not days')
    await expect(main.page.locator('.category-title').first).to_have_text(
        'Development Tools')
    await main.page.reload()
    await expect(main.page.locator('#langEn')).to_have_class('lang-btn active')
    await main.page.locator('#langRu').click()
    await expect(main.page.locator('.hero-tagline')).to_contain_text(
        'Превратите идеи')


async def test_theme_and_persistence(main):
    """Тёмная тема по умолчанию, светлая — через checkbox и после reload."""
    await expect(main.page.locator('#themeToggle')).not_to_be_checked()
    await main.theme_label.click()
    await expect(main.page.locator('html')).to_have_attribute(
        'data-theme', 'light')
    await main.page.reload()
    await expect(main.page.locator('#themeToggle')).to_be_checked()
    await expect(main.page.locator('html')).to_have_attribute(
        'data-theme', 'light')
    await main.theme_label.click()
    await expect(main.page.locator('html')).not_to_have_attribute('data-theme', re.compile('.+'))


async def test_view_and_persistence(main):
    """Список сохраняет каталог и восстанавливается при reload."""
    count = await main.cards.count()
    await main.page.locator('#listViewBtn').click()
    await expect(main.page.locator('.tool-card.list-view')).to_have_count(count)
    await main.page.reload()
    await expect(main.page.locator('.tool-card.list-view')).to_have_count(count)
    await main.page.locator('#gridViewBtn').click()
    await expect(main.page.locator('.tool-card.grid-view')).to_have_count(count)


async def test_localstorage(main):
    """Ключи настроек содержат выбранные пользователем значения."""
    await main.theme_label.click()
    await main.page.locator('#langEn').click()
    await main.page.locator('#listViewBtn').click()
    settings = await main.page.evaluate('''() => ({
        theme: localStorage.getItem('theme'),
        lang: localStorage.getItem('lang'),
        viewMode: localStorage.getItem('viewMode')
    })''')
    assert settings == {'theme': 'light', 'lang': 'en', 'viewMode': 'list'}


async def test_keyboard_navigation(main):
    """Tab и Enter включают язык без мыши."""
    await main.page.locator('#themeToggle').focus()
    await main.page.keyboard.press('Tab')
    await expect(main.page.locator('#langRu')).to_be_focused()
    await main.page.keyboard.press('Tab')
    await expect(main.page.locator('#langEn')).to_be_focused()
    await main.page.keyboard.press('Enter')
    await expect(main.page.locator('.hero-tagline')).to_contain_text('Turn ideas')


async def test_preview_link(main):
    """Ссылка превью открывает настоящее выбранное приложение."""
    await main.search('Арканоид')
    link = main.cards.locator('.tool-preview-link')
    await expect(link).to_have_attribute('href', 'arcanoid_o3.html')
    await link.click()
    await expect(main.page).to_have_url(
        f'{main.base_url}/arcanoid_o3.html')
    await expect(main.page.locator('canvas')).to_be_visible()


@pytest.mark.parametrize('width,columns', [
    (360, 1), (375, 1), (768, 2), (1024, 3), (1440, 3)
])
async def test_responsive_grid(main, width, columns):
    """Число колонок соответствует реальным CSS breakpoints."""
    await main.page.set_viewport_size({'width': width, 'height': 900})
    actual = await main.page.locator('.tools-grid').first.evaluate(
        'el => getComputedStyle(el).gridTemplateColumns.split(" ").length')
    assert actual == columns


@pytest.mark.parametrize('width', [320, 360, 1920, 2560])
async def test_no_horizontal_overflow(main, width):
    """Контент не требует горизонтального скролла."""
    await main.page.set_viewport_size({'width': width, 'height': 900})
    scroll_width = await main.page.evaluate(
        'document.documentElement.scrollWidth')
    assert scroll_width <= width
