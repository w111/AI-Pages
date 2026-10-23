# Проверки AI Pages

`npm test` выполняет unit-тесты audit-политики, Python Playwright, затем JS Playwright; HTTP-сервер запускают
фикстуры/конфигурация. Сборки у статического сайта нет.

- `tests/test_index_page_async.py`: текущий каталог — поиск, язык, тема, вид, localStorage, клавиатура, переход в
  приложение, breakpoints и отсутствие горизонтального скролла.
- `tests/pages/main_page.py`: локаторы действующего HTML каталога.
- `tests/conftest.py`: браузер и сервер на свободном порту.
- `tests/template_example.py`: шаблон для копирования, не исполняемый набор (имя вне test\_\*.py).
- `test_js/*.spec.js`: дополнительные E2E каталога, конвертера, рекомендателя и WebGPU-агента.
- `test_js/fixtures/tvmaze-shows.json`: ответ публичного TVMaze API page=0 от 23.10.2026 (12 записей). Мокируется
  HTTP-граница TVMaze; код загрузчика/рендеринга/фильтров/оценок/рекомендаций выполняется настоящий.

Каталог больше не содержит settings-modal и отдельной кнопки «Открыть»; не копируйте старые локаторы. Тема/язык/вид
доступны напрямую, ссылка находится на превью карточки.

## Запуск

Используйте Node из `.nvmrc`, зависимости Python из requirements.txt и установите обе версии браузеров:

```sh
nvm use
npm ci
python -m pip install -r requirements.txt yamllint
npx playwright install chromium webkit
python -m playwright install chromium
```

Полные проверки запускаются в фоне через `~/.claude/scripts/mac3-heavy-gate.sh`:

```sh
~/.claude/scripts/mac3-heavy-gate.sh npm run lint
~/.claude/scripts/mac3-heavy-gate.sh npm test
```

CI использует `playwright-ci.config.js` и `pytest-ci.ini`; Node/Python Playwright закрепляют разные браузерные сборки.
Сценарии проверяют видимый результат и сохраняемое состояние; fixture внешнего API не подтверждает его live-доступность.
