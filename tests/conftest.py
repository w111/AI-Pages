"""Конфигурация pytest для кроссбраузерного тестирования."""

import os
import pytest
import subprocess
import socket
from playwright.async_api import async_playwright


@pytest.fixture(scope='session')
def browser_name():
    """Получение имени браузера из переменной окружения."""
    return os.getenv('PLAYWRIGHT_BROWSER', 'chromium')


@pytest.fixture
async def browser(browser_name):
    """Фикстура браузера с поддержкой разных движков."""
    async with async_playwright() as p:
        if browser_name == 'firefox':
            browser = await p.firefox.launch(headless=True)
        elif browser_name == 'webkit':
            browser = await p.webkit.launch(headless=True)
        else:  # chromium по умолчанию
            browser = await p.chromium.launch(headless=True)

        yield browser
        await browser.close()


def pytest_configure(config):
    """Настройка pytest для отображения браузера в отчетах."""
    browser_name = os.getenv('PLAYWRIGHT_BROWSER', 'chromium')
    config.addinivalue_line(
        'markers', f'browser_{browser_name}: тесты для {browser_name}'
    )


def find_free_port():
    """Найти свободный порт для веб-сервера."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port


@pytest.fixture(scope='session')
def web_server():
    """Запуск веб-сервера на свободном порту для тестов."""
    port = find_free_port()
    base_url = f'http://127.0.0.1:{port}'

    # Запускаем Python HTTP сервер
    server_process = subprocess.Popen(
        ['python3', '-m', 'http.server', str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        cwd='.'
    )

    # Ждем запуска сервера
    import time
    time.sleep(2)

    yield base_url

    # Останавливаем сервер
    server_process.terminate()
    server_process.wait()


@pytest.fixture
def base_url(web_server):
    """Базовый URL для тестов."""
    return web_server
