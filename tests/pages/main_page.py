"""Page Object действующего каталога index.html."""


class MainPage:
    """Реальные controls каталога без удалённого окна настроек."""

    def __init__(self, page):
        """Сохранить страницу и локаторы."""
        self.page = page
        self.base_url = None
        self.search_input = page.locator('#searchInput')
        self.cards = page.locator('.tool-card')
        self.theme_label = page.locator('label[title="Переключить тему"]')

    async def open(self):
        """Открыть каталог на сервере тестовой фикстуры."""
        await self.page.goto(f'{self.base_url}/index.html')

    async def search(self, text):
        """Отфильтровать каталог пользовательским вводом."""
        await self.search_input.fill(text)
