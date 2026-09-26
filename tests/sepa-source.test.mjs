import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareSource } from '../sepa-source.mjs';

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'sepa-auto-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, options: { mode: 'auto', auditFile: join(root, 'audit.json') } };
}
function accepted(kind) {
  return { resource: { last_modified: '2026-09-25T16:20:00Z' },
    source: { official: kind === 'official', modified: '2026-09-25T16:20:00Z', kind },
    report: { status: `${kind}_integrity_checked`, sourceType: kind } };
}
test('auto accepts a verified official acquisition without consulting the intermediary', async t => {
  const { root, options } = await setup(t);
  const result = await prepareSource(root, options, { official: async () => accepted('official'),
    replica: async () => assert.fail('intermediary must not be called') });
  assert.equal(result.source.official, true);
  assert.equal(result.report.selection.selected, 'official');
  assert.equal(result.report.selection.attempts.length, 1);
  assert.equal(JSON.parse(await readFile(options.auditFile)).selection.selected, 'official');
});
test('a failed official attempt allows only a separately validated and disclosed replica', async t => {
  const { root, options } = await setup(t);
  const result = await prepareSource(root, options, { official: async () => { throw new Error('HTTP 403'); },
    replica: async () => accepted('replica') });
  assert.equal(result.source.official, false);
  assert.equal(result.source.modified, '2026-09-25T16:20:00Z');
  assert.equal(result.report.selection.selected, 'replica');
  assert.match(result.report.selection.attempts[0].error, /403/);
});
test('no valid source records both failures and leaves the existing price file intact', async t => {
  const { root, options } = await setup(t);
  const prices = join(root, 'prices.ndjson');
  await writeFile(prices, 'previous valid prices');
  await assert.rejects(prepareSource(root, options, {
    official: async () => { throw new Error('HTTP 403'); },
    replica: async () => { throw new Error('Recurso con más de 72 horas'); },
  }), /official: HTTP 403; replica: Recurso con más de 72 horas/);
  const audit = JSON.parse(await readFile(options.auditFile));
  assert.equal(audit.selection.selected, null);
  assert.equal(audit.selection.attempts.length, 2);
  assert.equal(await readFile(prices, 'utf8'), 'previous valid prices');
});
test('explicit official mode never falls back to a replica', async t => {
  const { root, options } = await setup(t);
  await assert.rejects(prepareSource(root, { ...options, mode: 'official' }, {
    official: async () => { throw new Error('HTTP 403'); },
    replica: async () => assert.fail('explicit origin must be respected'),
  }), /403/);
});
