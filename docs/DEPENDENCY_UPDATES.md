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

## Обновление 26.10.2026 — Dependabot #109–#113

Все пять обновлений объединяются в один PR по прецеденту #108; audit-исключение GHSA-vfj7-8cjw-p6xm и пересмотр
22.11.2026 сохранены без изменений.

| PR   | Обновление                               | Решение и совместимость                                                                                 |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| #113 | deploy-pages 4 → 5                       | Включить: runtime Node 24, GitHub-hosted ubuntu-latest поддерживается; permissions и inputs прежние.    |
| #112 | upload-pages-artifact 3 → 5              | Включить: v4 исключает dotfiles; v5 добавляет include-hidden-files и использует upload-artifact v7.     |
| #111 | eslint-plugin-playwright 2.12.0 → 2.12.1 | Включить: исправление JSON schema contains → enum; recommended rules сохранены.                         |
| #110 | lint-staged 17.5.1 → 17.6.0              | Включить: logger для функций, исправления параллельных задач и worktree patch; конфигурация совместима. |
| #109 | Stylelint 17.15.0 → 17.16.0              | Включить: исправления layout-mappings; standard 40 и JSON config сохранены.                             |

В inventory tracked dotfiles только конфигурация разработки/CI; `.well-known`, `.nojekyll` и другие обязательные скрытые
ресурсы сайта отсутствуют. `include-hidden-files` оставлен false; `.git` и `.github` исключены самим action. Артефакт
по-прежнему содержит корневые HTML, screenshots и docs, имя github-pages и path `.` сохранены.

lint-staged 17.6 добавляет в индекс все tracked-файлы, изменённые задачами, даже вне исходного набора staged. Наши
команды получают список путей от lint-staged; функций с широким `prettier --write .` нет. Перед коммитом проверять
полный diff и отсутствие посторонних изменений; при смешанных правках использовать `--hide-unstaged`. Проверка
настоящего Husky-хука обязательна. Node проекта остаётся 24.19.0.

Первоисточники: [deploy-pages v5](https://github.com/actions/deploy-pages/releases/tag/v5.0.0),
[upload-pages-artifact v4](https://github.com/actions/upload-pages-artifact/releases/tag/v4.0.0),
[upload-pages-artifact v5](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0),
[lint-staged 17.6](https://github.com/lint-staged/lint-staged/releases/tag/v17.6.0),
[Stylelint 17.16](https://github.com/stylelint/stylelint/releases/tag/17.16.0),
[Playwright plugin 2.12.1](https://github.com/mskelton/eslint-plugin-playwright/releases/tag/v2.12.1).

Runbook доставки прежний: тяжёлые проверки через mac3-heavy-gate, lint/format/npm test и audit; сборки нет. Затем пять
required checks, независимое ревью финального SHA, do merge-check и обычный merge с `--match-head-commit`. После
успешного Pages на merge SHA проверить HTTP 200 и совпадение опубликованных package.json и этого журнала с Git; только
затем закрыть #109–#113 со ссылкой на общий PR.

## Security Scan и Dependabot #115–#117 (2026-11-02)

`npm audit` стал отдавать moderate-advisory minimatch, а его граф содержит законный цикл eslint ↔
@eslint-community/eslint-utils. `audit-policy` принимал любой цикл за повреждённый отчёт, поэтому Security Scan падал на
всех PR. Теперь обход просто не заходит в пройденную запись. Порог high/critical и исключение GHSA-vfj7-8cjw-p6xm не
менялись; запись без единого достижимого advisory, как и неполный граф, по-прежнему блокирует.

Общим PR включены eslint 9.32.0 → 10.14.0 (#115, новее версии из PR) и prettier 3.6.2 → 3.9.10 (#117) по решению
владельца. Откат: revert merge-коммита. #116 (markdownlint-cli 0.50.0) не включён: markdownlint 0.42.0 жёстко закрепляет
re2js 2.8.6 с high GHSA-gg6h-894w-4m9c (исправлено в 2.8.7); ждём релиз с новой версией. Оставшиеся moderate/low —
dev-зависимости, порог проверки их не блокирует.

## Решение по Dependabot #116 — 03.11.2026

Выбран markdownlint-cli 0.50.0 → markdownlint 0.42.0 со scoped override `markdownlint@0.42.0: { re2js: "2.8.7" }`. Это
заменяет ожидание релиза из записи 02.11. Польза обновления — защита регулярных выражений от ReDoS, исправления
MD011/MD018/MD020/MD043/MD051/MD055/MD060 и поддержка диагностики front matter. Код сайта, правила Markdown и
audit-политика не меняются.

На 03.11 npm registry публикует latest CLI 0.50.0, markdownlint 0.42.0 и re2js 2.9.1. У markdownlint всё ещё точная
зависимость re2js 2.8.6: `npm update re2js` её не исправляет. Upstream
[PR #2338](https://github.com/DavidAnson/markdownlint/pull/2338) предлагал 2.8.8, но закрыт Dependabot без merge; это не
исправленный релиз. Проверены registry (`npm view <package> version dependencies --json`) и upstream main.

[GHSA-gg6h-894w-4m9c](https://github.com/advisories/GHSA-gg6h-894w-4m9c) имеет severity high, затрагивает re2js ≥2.2.0
<2.8.7; первая исправленная версия — 2.8.7. [Релиз 2.8.7](https://github.com/le0pard/re2js/releases/tag/2.8.7)
исправляет квадратичный поиск с LOOKBEHINDS. Закреплён минимальный исправленный patch, без новых изменений DFA из 2.8.8
и последующих minor. [Релиз CLI 0.50.0](https://github.com/igorshubovych/markdownlint-cli/releases/tag/v0.50.0)
описывает пользу обновления.

Проверка на базе main с исправлением audit-графа (#118, `57577dd`): CLI 0.50.0 без override реально блокируется по этому
high (exit 1). С override настоящий `audit:security` сообщает 0 других high/critical (exit 0),
`npm ls markdownlint-cli markdownlint re2js` подтверждает 0.50.0 / 0.42.0 / 2.8.7 без уязвимой копии. Чистый `npm ci` и
настоящий `npm run lint:md` проверяют установленный граф и все Markdown проекта. Дополнительный smoke через
`markdownlint/sync`: ошибочный Markdown вызывает MD011/MD013/MD039, корректный — 0 ошибок; front matter исключается из
проверки. Это все три правила, напрямую импортирующие re2js, и путь компиляции front matter. Порог high/critical и
существующие исключения не изменены; audit unit-тесты — 25/25.

### Runbook сопровождения override

1. На следующем обновлении CLI проверить registry и точную зависимость re2js у выбранного markdownlint. Если upstream
   использует ≥2.8.7, удалить scoped override в том же PR; не переносить pin на новую версию вслепую. Пересмотреть не
   позднее 22.11.2026, даже если Dependabot не открыл PR.
2. После изменения выполнить `npm ci`, `npm ls markdownlint-cli markdownlint re2js`, `npm run lint:md`,
   `npm run test:audit`, `npm run audit:security`, полный lint/format и `npm test`. Тяжёлые команды запускать в фоне
   через `~/.claude/scripts/mac3-heavy-gate.sh`, максимум два слота на машине.
3. Проверить, что нет re2js <2.8.7 и audit реально проходит. При несовместимости сохранить 0.49.1 либо откатить это
   обновление обычным revert PR; не добавлять исключение GHSA и не понижать severity-порог.
4. Цена сопровождения — один временный pin, проверка следующего upstream-релиза и повторный lint/audit. Перед merge
   обязательны пять Quality checks, независимое ревью финального head, `do merge-check`; merge обычный с
   `--match-head-commit`, без admin и force-push.
5. После merge дождаться успешного Pages на merge SHA, проверить HTTP 200 и совпадение опубликованных package.json и
   журнала с Git. Только после этого закрыть #116 со ссылкой на заменяющий PR; удалить чистый рабочий worktree через
   `git worktree remove` без `--force`.

Финальные CI/review/head/merge/Pages receipts публикуются в заменяющем PR и итоговом отчёте задачи.

## 09.11.2026 — образ runner для Playwright

В PR #120–#122 Cross-Browser Tests падает до тестов, Quality Report — вслед за ним. В
[run 42591094687](https://github.com/w111/AI-Pages/actions/runs/42591094687) runner — Ubuntu 26.04.1; установка Chromium
завершается `Playwright does not support chromium on ubuntu26.04-x64`. `npx playwright` фактически запускает 1.57.0 из
`@playwright/test`, даже в #122 с прямой зависимостью `playwright` 1.65.0. На main используется та же 1.57.0, поэтому
отказ не ограничен Dependabot.

Минимальное исправление: только job `test` закреплён на `ubuntu-24.04`, поддерживаемом npm Playwright 1.57 и Python
Playwright 1.54. Обе установки браузеров, JS/Python тесты, матрица и required checks сохранены. Обновление ОС требует
отдельной проверки обеих версий; версия runner больше не меняется вслед за `ubuntu-latest`.

PR #121 отдельно обновляет `@eslint/js` 9.32.0 → 10.0.1. ESLint уже 10.14.0, Node в CI — 24.19.0, что удовлетворяет
новым engines и peer `eslint: ^10.0.0`. Используется flat config `js.configs.recommended`; v10 добавляет
`no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`. Проверка Code Quality на head
`e9ef370af6fe1d199259061b1e185a23ed75f019` успешна: новых ошибок эти правила в текущей области линтинга не дали. Это
подтверждает совместимость линтера, но не заменяет браузерный CI после исправления runner.

Источники: Chromium для Ubuntu 24.04 в
[Playwright 1.57](https://github.com/microsoft/playwright/blob/v1.57.0/packages/playwright-core/src/server/registry/index.ts)
и [1.54](https://github.com/microsoft/playwright/blob/v1.54.0/packages/playwright-core/src/server/registry/index.ts),
[миграция ESLint 10](https://eslint.org/docs/latest/use/migrate-to-10.0.0).

Проверка #120–#122 на исправленной базе main возможна после мёржа PR с runner владельцем. Если Dependabot не обновит
ветки автоматически, запросить `@dependabot rebase`, затем дождаться всех пяти required checks на новых head. До этого
старые красные runs не считать проверкой исправленной базы. Dependabot PR и исправление автоматически не мёржить.

## 09.11.2026 — приёмка runner и очереди Dependabot

Владелец разрешил мёрж #123 и последовательно зелёных #120–#122. Исправление runner принято в
[#123](https://github.com/w111/AI-Pages/pull/123), merge `a1c1342c55b5046c4a9c9087a6f8960b8c6426d2`. Перед мёржем:
независимое ревью PASS, пять required checks и CodeQL success на точном head; CI — 60 JS и 19 Python тестов, обе
установки браузеров успешны на Ubuntu 24.04. Штатный `do merge-check` выполнен, мёрж — squash с `--match-head-commit`,
без обхода проверок.

После мёржа #123 на main успешно завершились
[Quality Checks 42700912990](https://github.com/w111/AI-Pages/actions/runs/42700912990) и
[Pages 42700912722](https://github.com/w111/AI-Pages/actions/runs/42700912722) на том же merge SHA.
