/** Узкое разрешение владельца от 2026-10-23, пересмотр через 30 дней.
 * GitHub отозвал advisory как practically unexploitable:
 * https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
 * Пакет braces и другие advisory не исключаются. После срока high снова блокирует.
 */
export const exception = Object.freeze({
  url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
  reviewAt: '2026-11-22T00:00:00Z',
});
const severities = ['info', 'low', 'moderate', 'high', 'critical'];
const blocking = severity => ['high', 'critical'].includes(severity);

/**
 * @function parseAuditResult
 * @description Отличить штатный audit JSON от ошибки процесса/инструмента.
 * @param {object} result Результат spawnSync npm audit --json.
 * @returns {object} Проверенный JSON; ошибка никогда не становится успешным audit.
 */
export function parseAuditResult(result) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error('npm audit не завершился штатно');
  }
  const report = JSON.parse(result.stdout);
  validateReport(report);
  validateCounters(report);
  if (result.status === 1 && report.metadata.vulnerabilities.total === 0) {
    throw new Error('Ненулевой exit npm audit без объясняющих advisory');
  }
  return report;
}

/**
 * @function validateReport
 * @description Проверить версию и обязательную структуру audit.
 * @param {object} report Распарсенный JSON.
 * @returns {void} Ошибка блокирует неверный формат.
 */
function validateReport(report) {
  if (
    report.error ||
    report.auditReportVersion !== 2 ||
    !report.vulnerabilities ||
    Array.isArray(report.vulnerabilities) ||
    typeof report.vulnerabilities !== 'object' ||
    !report.metadata?.vulnerabilities ||
    report.metadata.vulnerabilities.total !== Object.keys(report.vulnerabilities).length
  ) {
    throw new Error('Неизвестный/неполный формат npm audit');
  }
}

/**
 * @function validateCounters
 * @description Сверить счётчики с фактическими записями графа.
 * @param {object} report Структурно проверенный JSON.
 * @returns {void} Ошибка блокирует несогласованный отчёт.
 */
function validateCounters(report) {
  const nodes = Object.values(report.vulnerabilities);
  for (const severity of severities) {
    if (
      report.metadata.vulnerabilities[severity] !==
      nodes.filter(n => n.severity === severity).length
    ) {
      throw new Error('Счётчики severity не соответствуют графу audit');
    }
  }
}

/**
 * @function rootAdvisories
 * @description Раскрыть цепь meta-vulnerabilities до advisory, без пакетных ignore.
 * @param {string} name Имя записи audit.
 * @param {object} graph Карта vulnerabilities.
 * @param {Set<string>} trail Предки, для обнаружения циклов/повреждённого отчёта.
 * @returns {object[]} Корневые advisory; неизвестные связи блокируют проверку.
 */
function rootAdvisories(name, graph, trail = new Set()) {
  const node = graph[name];
  if (
    !node ||
    trail.has(name) ||
    !severities.includes(node.severity) ||
    !Array.isArray(node.via) ||
    node.via.length === 0
  ) {
    throw new Error(`Неполная/циклическая цепь audit: ${name}`);
  }
  const next = new Set([...trail, name]);
  return node.via.flatMap(via => {
    if (typeof via === 'string') return rootAdvisories(via, graph, next);
    if (!via || typeof via.url !== 'string' || !severities.includes(via.severity)) {
      throw new Error(`Неизвестный advisory: ${name}`);
    }
    return [via];
  });
}

/**
 * @function evaluateAudit
 * @description Сохранить порог high/critical, исключив только конкретный отозванный GHSA.
 * @param {object} report Проверенный parseAuditResult отчёт.
 * @param {Date} now Текущее время; тесты проверяют границу срока пересмотра.
 * @returns {object} Массивы блокирующих и временно исключённых advisory.
 */
export function evaluateAudit(report, now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error('Некорректная дата audit');
  const all = auditRoots(report);
  const high = [
    ...new Map(
      all.filter(root => blocking(root.severity)).map(root => [root.url, root])
    ).values(),
  ];
  const allowed = root =>
    root.url === exception.url && now < new Date(exception.reviewAt);
  return {
    blocked: high.filter(root => !allowed(root)),
    ignored: high.filter(allowed),
  };
}

/**
 * @function auditRoots
 * @description Собрать исходные advisory и проверить происхождение severity.
 * @param {object} report Проверенный audit JSON.
 * @returns {object[]} Исходные advisory без изменения уровня риска.
 */
function auditRoots(report) {
  return Object.entries(report.vulnerabilities).flatMap(([name, node]) => {
    const roots = rootAdvisories(name, report.vulnerabilities);
    if (blocking(node.severity) && !roots.some(root => blocking(root.severity))) {
      throw new Error(`Необъяснённая severity audit: ${name}`);
    }
    return roots;
  });
}
