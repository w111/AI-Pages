# Аудит обновлений зависимостей — 23.10.2026

## Область и состояние

Аудит PR Dependabot #97–#106. Приложения и тестовые assertions не изменяются. Сборки нет; основной checkout не
изменяется. Обновления подготовлены совместно, но не считаются доставленными до обычного merge и успешного Pages на
merge SHA.

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
и playwright/prefer-web-first-assertions в тесте data-converter. Не менять тесты или правила ради зелёного статуса.

После обычного merge с `--match-head-commit` проверить workflow Pages на merge SHA, статус deployment и HTTP 200 на
<https://w111.github.io/AI-Pages/>. При отказе изучить failed step и исправить отдельным проверенным PR либо откатить
изменение обычным revert PR. Не использовать admin/force-push и не отключать required checks. Dependabot PR закрывать со
ссылкой на заменяющий PR только после его принятия; при блокере оставить их открытыми и явно сообщить недоставленное
состояние.
