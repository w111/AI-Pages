# Аудит обновлений зависимостей — 23.10.2026

## Область и состояние

Аудит PR Dependabot #97–#106. Тесты мигрированы на текущий HTML по явному поручению владельца. Сборки нет; основной
checkout не изменяется. Обновления подготовлены совместно, но не считаются доставленными до обычного merge и успешного
Pages на merge SHA.

Разработка: `nvm use` (24.19.0), Git ≥2.32.0, `npm ci`. Минимум Node для lint-staged 17 — 22.22.1; конфигурация хранится
в package.json, поэтому новый optional YAML parser ему не требуется. Хук запускает настоящий lint-staged.

## Решения по PR

| PR   | Обновление                          | Решение и совместимость                                                                               |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| #106 | checkout 4 → 7                      | Включить; Node 24, credentials в отдельном файле с v6; privileged fork checkout не используется.      |
| #105 | configure-pages 5 → 6               | Включить; Node 24 поддерживается ubuntu-latest; inputs остаются прежними.                             |
| #104 | upload-artifact 4 → 7               | Включить; Node 24; новый unzipped single-file режим не включён, каталоги остаются архивами.           |
| #103 | setup-python 4 → 7                  | Включить; Node 20 → 24, удалённый pip-install input не используется; Python 3.11 остаётся.            |
| #102 | setup-node 4 → 7                    | Включить; ESM/Node 24; явный cache: npm совместим, registry-url и фиктивный token не используются.    |
| #101 | standard 38 → 40                    | Включить вместе со Stylelint 17; peer ≥17, ESM, Node ≥20.19; добавлено правило nested blocks в v39.   |
| #100 | eslint-plugin-playwright 2.2 → 2.12 | Включить; recommended rules проверяются локально; исходные ошибки не замалчиваются.                   |
| #99  | serve 14.2.4 → 14.2.6               | Включить; исправления ReDoS в serve-handler и ajv; npm serve фактически запускает Python HTTP server. |
| #98  | Stylelint 16 → 17.15                | Включить с standard 40; CLI/JSON config совместимы, CJS API не используется.                          |
| #97  | lint-staged 16 → 17.5.1             | Включить с Node 24.19 и Git ≥2.32; JSON config совместим, intent-to-add не используется.              |

13 устаревших стилистических правил Stylelint уже давали Unknown rule на версии 16. Они удалены; форматирование
выполняет существующий Prettier. Семантические правила сохранены. В репозитории нет отдельных CSS-файлов, поэтому
дополнительно проверяется CSS через stdin (валидный образец и образец с повторным селектором). Inline CSS по-прежнему не
извлекается.

## Первоисточники

- [checkout v5](https://github.com/actions/checkout/releases/tag/v5.0.0),
  [v6](https://github.com/actions/checkout/releases/tag/v6.0.0),
  [v7](https://github.com/actions/checkout/releases/tag/v7.0.0).
- [configure-pages v6](https://github.com/actions/configure-pages/releases/tag/v6.0.0).
- [upload-artifact v5](https://github.com/actions/upload-artifact/releases/tag/v5.0.0),
  [v6](https://github.com/actions/upload-artifact/releases/tag/v6.0.0),
  [v7](https://github.com/actions/upload-artifact/releases/tag/v7.0.0).
- [setup-python v5](https://github.com/actions/setup-python/releases/tag/v5.0.0),
  [v6](https://github.com/actions/setup-python/releases/tag/v6.0.0),
  [v7](https://github.com/actions/setup-python/releases/tag/v7.0.0).
- [setup-node v5](https://github.com/actions/setup-node/releases/tag/v5.0.0),
  [v6](https://github.com/actions/setup-node/releases/tag/v6.0.0),
  [v7](https://github.com/actions/setup-node/releases/tag/v7.0.0).
- [Stylelint 17 migration](https://stylelint.io/migration-guide/to-17/),
  [standard 39](https://github.com/stylelint/stylelint-config-standard/releases/tag/39.0.0),
  [standard 40](https://github.com/stylelint/stylelint-config-standard/releases/tag/40.0.0).
- [lint-staged 17](https://github.com/lint-staged/lint-staged/releases/tag/v17.0.0),
  [Playwright plugin 2.12](https://github.com/mskelton/eslint-plugin-playwright/releases/tag/v2.12.0),
  [serve 14.2.6](https://github.com/vercel/serve/releases/tag/v14.2.6).

## Проверки и доставка

Полные команды запускать в фоне через `~/.claude/scripts/mac3-heavy-gate.sh`: `npm ci`, `npm run lint`, `npm test`;
сборки нет. Перед обновлением `npm ci` успешен; `npm run lint` падает с двумя исходными ошибками: max-lines-per-function
и playwright/prefer-web-first-assertions в тесте data-converter. Правила линта не ослаблены; ошибки исправлены переносом
тестов из длинного describe и web-first assertion.

После обычного merge с `--match-head-commit` проверить workflow Pages на merge SHA, статус deployment и HTTP 200 на
<https://w111.github.io/AI-Pages/>. При отказе изучить failed step и исправить отдельным проверенным PR либо откатить
изменение обычным revert PR. Не использовать admin/force-push и не отключать required checks. Dependabot PR закрывать со
ссылкой на заменяющий PR только после его принятия; при блокере оставить их открытыми и явно сообщить недоставленное
состояние.

## Ремонт исходного CI и тестов

По поручению владельца исходные проверки обновлены под текущий HTML; правила линта и assertions не отключаются. Старое
окно настроек каталога, Escape закрытия, dialog ARIA и отдельная кнопка «Открыть» удалены из тестов: этих
функций/элементов больше нет. Навигация проверяется по настоящей ссылке превью, настройки — через видимую панель;
сравнение темы учитывает тёмную тему по умолчанию. Контраст измеряется как относительная яркость WCAG AA ≥4.5, вместо
сравнения со старой палитрой. На широком экране CSS задаёт карточку ровно 400px; проверка границы исправлена на ≤400.
Планшетный JS-сценарий использует 800px: WebKit отнимает 8px scrollbar от CSS viewport, поэтому window.innerWidth=768
там соответствует media width=760 и одной колонке. Проверка двух колонок сохранена при доступной ширине ≥768; Python
проверяет точные breakpoints в Chromium. WebKit на macOS использует Alt+Tab для полной клавиатурной навигации; clipboard
permissions выдаются только Chromium (WebKit не поддерживает этот Playwright permission), копирование проверяется в
обоих движках. Число JS-воркеров ограничено двумя, чтобы не перегружать Python HTTP-сервер десятками тысяч preview
requests.

Файл `tests/test_template.py` был инструкционным шаблоном с отсутствующими фикстурами, но pytest собирал его как
реальные тесты. Он сохранён как `tests/template_example.py`, который не соответствует `python_files = test_*.py`;
реальные сценарии не исключаются.

Рекомендатор теперь работает с сериалами TVMaze, а не старым каталогом фильмов. `test_js/fixtures/tvmaze-shows.json` —
первые 12 сериалов публичного TVMaze API page=0, сохранены 23.10.2026 с полями, используемыми приложением. E2E подменяет
только ответ TVMaze, сохраняет реальную загрузку/дедупликацию и UI; проверяет 12 карточек, поиск по названию, фильтр
жанра, оценки/restore и 7 рекомендаций после оценки 5 сериалов. Это не доказательство доступности внешнего API; сам
endpoint отдельно проверен HTTP-запросом.

Обнаруженные после JS-линта HTML-ошибки исправлены без изменения логики: 3 пустых src удалены из динамических
изображений art_gallery/recipe_book, 32 строки HTML webllm-chat переведены с tab на space, форматирование docs/INDEX и
Playwright config исправлено.

Security Scan включает и dev-граф: доступные транзитивные исправления применены без --force. markdownlint-cli обновлён
до 0.49.1: Node 20 больше не поддерживается (у нас Node 24), добавлено правило MD060, обновлены парсеры и glob. Bare URL
в README оформлен ссылкой; правила markdownlint сохранены. Через scoped overrides serve получает compression 1.8.2,
ветки js-yaml 4 и 5 — соответственно 4.3.2 и 5.5.0; major API не подменяются.

Первоисточники дополнительных обновлений:
[markdownlint-cli releases](https://github.com/igorshubovych/markdownlint-cli/releases),
[compression changelog](https://github.com/expressjs/compression/blob/master/HISTORY.md),
[js-yaml changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md). Advisory
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) отозван GitHub 23.10.2026 как практически
неэксплуатируемый, но npm audit пока возвращает его для braces 3.0.3; исправленной версии braces нет. Audit не
отключается.

Локальные и remote результаты финального head публикуются в PR: [PR #108](https://github.com/w111/AI-Pages/pull/108).
Merge допустим только при положительном независимом ревью и do merge-check. После него обязательны успешный Pages на
merge SHA и HTTP 200 с содержимым новой версии.

## Проверенный локальный результат продолжения

- Полный прогон каталога Python: 19 passed.
- Полный JS: 420 passed на семи проектах (Chromium/WebKit, mobile/tablet/desktop).
- Audit-политика: 22 unit-теста; настоящий npm audit принят только с одним точным отозванным GHSA.
- Линт и форматирование проверяются штатными командами, включая новые security scripts и mjs-тесты.
- Скрипт запуска `npm test` включает audit → Python → JS; CI дополнительно проверяет audit в Security Scan.
- Обновлённый runtime и согласованный lockfile проверены `npm ci`; сборки у сайта нет.

Окончательные CI/review/merge/deploy evidence публикуются в PR #108; эти локальные результаты не подменяют remote
required checks и проверку production на merge SHA.

Lighthouse healthcheck ранее проходил, но autorun не находил staticDistDir и падал; workflow скрывал ошибку через
`|| echo`. Теперь `.lighthouserc.json` задаёт URL каталога, 3 запуска и локальное сохранение отчётов; CLI закреплён на
0.15.1. Отсутствие Chrome, ошибка сбора или сохранения блокирует job; новые пороги scores не вводятся (аудит
информационный). Quality Report возвращает failure, если любой этап неуспешен, вместо одного зелёного summary.

В повторном полном прогоне единственный отказ Mobile Safari произошёл до assertions: `goto` ожидал load всех удалённых
preview и превысил navigation timeout. Проверки темы теперь ждут DOMContentLoaded и затем реальное состояние
CSS/checkbox, а не посторонние изображения. Assertions и их таймауты сохранены; это не условное пропускание теста.
