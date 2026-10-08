import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditFailures } from './audit-client.mjs';
const now = new Date('2026-10-08');
function fixture() {
  return {
    report: { auditReportVersion: 2, metadata: {}, vulnerabilities: {
      braces: { severity: 'high', nodes: ['node_modules/braces'], via: [{ severity: 'high', title: 'Known build advisory', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' }] },
      tailwindcss: { severity: 'high', via: ['braces'] },
    } },
    lock: { packages: { 'node_modules/braces': { dev: true, version: '3.0.3' } } },
  };
}
test('only the exact build-only advisory and its inherited findings pass', () => {
  const {report,lock}=fixture(); assert.deepEqual(auditFailures(report,lock,now),[]);
});
test('exception expires', () => {
  const {report,lock}=fixture(); assert.equal(auditFailures(report,lock,new Date('2026-11-08')).length,1);
});
test('runtime installation cannot use the exception', () => {
  const {report,lock}=fixture(); delete lock.packages['node_modules/braces'].dev;
  assert.equal(auditFailures(report,lock,now).length,1);
});
test('new advisory on the same package still fails', () => {
  const {report,lock}=fixture(); report.vulnerabilities.braces.via.push({ severity:'moderate',title:'New issue',url:'https://github.com/advisories/new' });
  assert.equal(auditFailures(report,lock,now).length,1);
});
test('unrelated moderate or higher vulnerability still fails', () => {
  const {report,lock}=fixture(); report.vulnerabilities.other={severity:'critical',via:[{severity:'critical',title:'Other issue',url:'https://github.com/advisories/other'}]};
  assert.equal(auditFailures(report,lock,now).length,1);
});
test('malformed reports and unresolved dependency references fail closed', () => {
  const {report,lock}=fixture(); assert.throws(()=>auditFailures({error:'network'},lock,now));
  report.vulnerabilities.tailwindcss.via=['missing']; assert.throws(()=>auditFailures(report,lock,now));
});
