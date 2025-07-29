"""Page Object для главной страницы index.html."""


class MainPage:
    """Page Object для главной страницы и основных действий пользователя."""

    def __init__(self, page):
        """Инициализация локаторов и ссылки на страницу."""
        self.page = page
        self.base_url = None  # Будет установлен в фикстуре
        self.settings_btn = page.get_by_title('Настройки')
        self.search_input = page.locator('#cardSearch')
        self.cards = page.locator('.example-card')
        self.settings_modal = page.locator('.settings-modal.show')
        self.theme_label = page.locator('label[for="themeSwitch"]')
        self.lang_label = page.locator('label[for="languageSwitch"]')
        self.view_label = page.locator('label[for="viewSwitch"]')

    async def open(self, url=None):
        """Открыть главную страницу по url."""
        if url is None:
            url = f'{self.base_url}/index.html'
        await self.page.goto(url)

    async def open_settings(self):
        """Открыть модальное окно настроек."""
        await self.settings_btn.click()
        await self.settings_modal.wait_for(state='visible')

    async def set_all_settings(self):
        """Включить все настройки: тема, язык, вид."""
        await self.open_settings()
        await self.theme_label.wait_for(state='visible')
        await self.lang_label.wait_for(state='visible')
        await self.view_label.wait_for(state='visible')
        await self.theme_label.click()
        await self.lang_label.click()
        await self.view_label.click()

    async def search(self, text):
        """Выполнить поиск по карточкам."""
        await self.search_input.fill(text)

    async def get_visible_cards_count(self):
        """Получить количество видимых карточек."""
        return await self.page.locator('.example-card:visible').count()

    async def get_card_titles(self):
        """Получить список заголовков карточек."""
        locator = self.page.locator('.example-card .card-header h3')
        return await locator.all_text_contents()
