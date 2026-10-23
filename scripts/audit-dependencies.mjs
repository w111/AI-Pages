import { spawnSync } from 'node:child_process';
import { evaluateAudit, exception, parseAuditResult } from './audit-policy.mjs';

try {
  const result = spawnSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 120_000,
  });
  const { blocked, ignored } = evaluateAudit(parseAuditResult(result));
  for (const advisory of ignored) {
    console.log(
      `Отозванный advisory: ${advisory.url}; пересмотр ${exception.reviewAt}`
    );
  }
  for (const advisory of blocked) {
    console.error(`Блокирует ${advisory.severity}: ${advisory.url}`);
  }
  console.log(`Других high/critical: ${blocked.length}`);
  process.exitCode = blocked.length ? 1 : 0;
} catch (error) {
  console.error(`Security audit недоступен: ${error.message}`);
  process.exitCode = 1;
}
