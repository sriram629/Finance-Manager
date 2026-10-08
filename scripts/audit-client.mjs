import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// No patched release exists. Only trusted, repository-owned build patterns reach
// braces; it is absent from the browser bundle and production install.
const exception = {
  package: 'braces',
  url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
  version: '3.0.3',
  expires: '2026-11-08T00:00:00Z',
};
const levels = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

export function auditFailures(report, lock, now = new Date()) {
  if (report.error || report.auditReportVersion !== 2 || !report.vulnerabilities || !report.metadata || !lock.packages) {
    throw new Error('Invalid npm audit response or lockfile; refusing to pass.');
  }
  const failures = [];
  function inspect(name, seen = new Set()) {
    if (seen.has(name)) return; // npm's advisory dependency graph can contain cycles.
    const item = report.vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || !(item.severity in levels)) throw new Error(`Invalid advisory: ${name}`);
    const path = new Set([...seen, name]);
    for (const via of item.via) {
      if (typeof via === 'string') { inspect(via, path); continue; }
      if (!(via.severity in levels)) throw new Error(`Unknown advisory severity: ${name}`);
      if (levels[via.severity] < levels.moderate) continue;
      const buildOnly = item.nodes?.length > 0 && item.nodes.every(node => {
        const installed = lock.packages[node];
        return installed?.dev === true && installed.version === exception.version;
      });
      const allowed = name === exception.package && via.url === exception.url && buildOnly && now < new Date(exception.expires);
      if (!allowed) failures.push(`${name}: ${via.title} (${via.url})`);
    }
  }
  for (const name of Object.keys(report.vulnerabilities)) inspect(name);
  return [...new Set(failures)];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const client = fileURLToPath(new URL('../client/', import.meta.url));
    const result = spawnSync('npm', ['audit', '--json'], { cwd: client, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (result.error || result.signal || ![0, 1].includes(result.status)) throw new Error('npm audit did not complete successfully.');
    const report = JSON.parse(result.stdout);
    const lock = JSON.parse(readFileSync(resolve(client, 'package-lock.json'), 'utf8'));
    const failures = auditFailures(report, lock);
    if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
    else if (report.vulnerabilities.braces) console.log(`Audit passed with ONE temporary build-only exception: ${exception.url}; expires ${exception.expires}.`);
    else console.log('Audit passed without exceptions.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
