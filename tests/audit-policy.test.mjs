import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAudit,
  exception,
  parseAuditResult,
} from '../scripts/audit-policy.mjs';

const before = new Date('2026-10-23T12:00:00Z');
const advisory = (url = exception.url, severity = 'high') => ({ url, severity });
const node = (via, severity = 'high') => ({ via, severity });
const report = vulnerabilities => ({
  auditReportVersion: 2,
  vulnerabilities,
  metadata: {
    vulnerabilities: {
      total: Object.keys(vulnerabilities).length,
      ...Object.fromEntries(
        ['info', 'low', 'moderate', 'high', 'critical'].map(severity => [
          severity,
          Object.values(vulnerabilities).filter(n => n.severity === severity).length,
        ])
      ),
    },
  },
});
const result = value => ({ status: 1, stdout: JSON.stringify(value) });

test('Исключается только отозванный GHSA и его meta-цепь', () => {
  const r = report({
    braces: node([advisory()]),
    glob: node(['braces']),
    stylelint: node(['glob']),
  });
  const verdict = evaluateAudit(parseAuditResult(result(r)), before);
  assert.equal(verdict.blocked.length, 0);
  assert.deepEqual(
    verdict.ignored.map(a => a.url),
    [exception.url]
  );
});

for (const severity of ['high', 'critical']) {
  test(`Другой ${severity} в том же пакете и цепи блокирует`, () => {
    const other = advisory('https://github.com/advisories/GHSA-other', severity);
    const verdict = evaluateAudit(
      report({ braces: node([advisory(), other]), glob: node(['braces']) }),
      before
    );
    assert.deepEqual(verdict.blocked, [other]);
  });
}

test('Имя пакета braces не является исключением', () => {
  assert.equal(
    evaluateAudit(
      report({ braces: node([advisory('https://other.example/GHSA-vfj7-8cjw-p6xm')]) }),
      before
    ).blocked.length,
    1
  );
});

test('Точный срок пересмотра закрывает исключение', () => {
  const r = report({ braces: node([advisory()]) });
  assert.equal(
    evaluateAudit(r, new Date('2026-11-21T23:59:59.999Z')).ignored.length,
    1
  );
  assert.equal(evaluateAudit(r, new Date(exception.reviewAt)).blocked.length, 1);
  assert.equal(evaluateAudit(r, new Date('2027-01-01')).blocked.length, 1);
});

test('Без advisory после синхронизации registry исключение не требуется', () => {
  assert.deepEqual(
    evaluateAudit(parseAuditResult({ ...result(report({})), status: 0 }), before),
    {
      blocked: [],
      ignored: [],
    }
  );
});

test('Moderate сохраняет исходный порог high/critical', () => {
  assert.equal(
    evaluateAudit(
      report({ parser: node([advisory('https://other', 'moderate')], 'moderate') }),
      before
    ).blocked.length,
    0
  );
});

for (const graph of [
  { glob: node(['missing']) },
  { glob: node(['glob']) },
  { glob: node([]) },
  { glob: node([{ url: exception.url }]) },
  { glob: node([advisory(exception.url, 'moderate')]) },
]) {
  test(`Неполный/циклический граф audit блокирует: ${JSON.stringify(graph)}`, () => {
    assert.throws(() => evaluateAudit(report(graph), before));
  });
}

for (const r of [
  { status: null, stdout: '' },
  { status: 2, stdout: JSON.stringify(report({})) },
  { status: 0, stdout: '{' },
  { status: 0, stdout: '{}' },
  result(report({})),
  { status: 1, signal: 'SIGTERM', error: new Error('timeout'), stdout: '' },
  result({
    ...report({}),
    metadata: { vulnerabilities: { ...report({}).metadata.vulnerabilities, high: 1 } },
  }),
  result({ ...report({}), error: { code: 'AUTH' } }),
  result({ ...report({}), auditReportVersion: 3 }),
  result({ ...report({}), metadata: { vulnerabilities: { total: 1 } } }),
]) {
  test(`Ошибка процесса/формата не превращается в PASS: ${JSON.stringify(r)}`, () => {
    assert.throws(() => parseAuditResult(r));
  });
}
