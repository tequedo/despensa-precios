import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { compareManifests, validateResource, validateEmbedded, replicaEntry, selectResource, timestamp, prepareReplica, OFFICIAL_DATASET_ID } from '../sepa-provenance.mjs';

const now = new Date('2026-09-14T00:00:00Z');
const resource = { id: 'b3c3da5d-213d-41e7-8d74-f23fda0a3c30', revision_id: '11d22be1-1cf9-4284-a6bc-9d3727db52b5', size: 330525329, last_modified: '2026-09-12T16:19:10.177837' };
resource.url = `https://datos.produccion.gob.ar/dataset/${OFFICIAL_DATASET_ID}/resource/${resource.id}/download/sepa_sabado.zip`;
const metadata = { success: true, result: { id: OFFICIAL_DATASET_ID, resources: [resource] } };
const replicaId = `${resource.id}-revID-${resource.revision_id}`;
const entry = { id: replicaId, firstSeenAt: '2026-09-12T16:35:24.134Z', warnings: '', name: `${replicaId}-sepa_sabado.zip-repackaged.tar.zst` };
entry.link = `https://f004.backblazeb2.com/file/precios-justos-datasets/${entry.name}`;

test('identifies exact official resource, revision and replica; normalizes source time without replacing it', () => {
  const selected = selectResource(metadata, now);
  assert.equal(selected.last_modified, '2026-09-12T16:19:10.177Z');
  assert.equal(replicaEntry({ day: [entry] }, selected).link, entry.link);
});
test('selects the newest available resource even when it was published today', () => {
  const recent = { ...resource, last_modified: '2026-09-14T10:00:00Z' };
  assert.equal(selectResource({ ...metadata, result: { ...metadata.result, resources: [resource, recent] } }, new Date('2026-09-14T15:00:00Z')).last_modified, recent.last_modified.replace('Z', '.000Z'));
});
test('rejects different datasets, disguised domains, missing resource identity and invalid dates', () => {
  assert.throws(() => selectResource({ ...metadata, result: { ...metadata.result, id: 'other' } }, now));
  for (const changes of [{ revision_id: null }, { size: 0 }, { url: resource.url.replace('gob.ar', 'gob.ar.attacker.test') }, { last_modified: '2026-02-30T16:00:00Z' }, { last_modified: '2026-09-15T00:00:00Z' }, { last_modified: '2026-09-01T00:00:00Z' }]) assert.throws(() => validateResource({ ...resource, ...changes }, now));
  assert.throws(() => timestamp(''));
});
test('rejects contradictory index entries and archive warnings', () => {
  for (const changed of [{ link: entry.link.replace('11d22be1', 'aaaaaaaa') }, { warnings: 'failed extraction' }, { firstSeenAt: '2026-09-10T12:00:00Z' }]) assert.throws(() => replicaEntry({ day: [{ ...entry, ...changed }] }, resource));
  assert.throws(() => replicaEntry({ a: [entry], b: [entry] }, resource));
});
test('rejects an archive from a different date, revision, URL or size even when CSV files exist', () => {
  validateEmbedded({ embeddedMetadata: { value: metadata } }, resource);
  for (const changes of [{ revision_id: 'other' }, { size: 1 }, { last_modified: '2026-09-11T16:00:00Z' }, { url: 'https://example.com/a.zip' }]) {
    const changed = { embeddedMetadata: { value: { ...metadata, result: { ...metadata.result, resources: [{ ...resource, ...changes }] } } } };
    assert.throws(() => validateEmbedded(changed, resource));
  }
});
test('compares unpacked bytes rather than compressed archive hashes', () => {
  const files = [{ path: 'retailer/productos.csv', bytes: 2, sha256: 'same' }];
  const a = { archive: { sha256: 'zip-hash' }, files }, b = { archive: { sha256: 'zstd-hash' }, files };
  assert.equal(compareManifests(a, b).status, 'matched');
  assert.deepEqual(compareManifests(a, { ...b, files: [{ ...files[0], sha256: 'changed' }] }).changed, [files[0].path]);
  assert.deepEqual(compareManifests(a, { ...b, files: [] }).missing, [files[0].path]);
  assert.deepEqual(compareManifests({ ...a, files: [] }, b).added, [files[0].path]);
});
test('the actual importer preserves its previous output when manual provenance is absent', async () => {
  const work = await mkdtemp(join(tmpdir(), 'provenance-test-'));
  try {
    const output = join(work, 'prices.ndjson'), auditFile = join(work, 'audit.json');
    await writeFile(output, 'previous generation\n');
    const result = spawnSync(process.execPath, [new URL('../update-san-juan.mjs', import.meta.url).pathname], {
      env: { ...process.env, MANUAL_ZIP_URL: 'https://example.com/unverified.zip', OUTPUT_FILE: output, PROVENANCE_FILE: auditFile, NATIONAL_EXPORT: '0', DESPENSA_INGEST_URL: '' },
      encoding: 'utf8', timeout: 10_000,
    });
    assert.equal(result.status, 1);
    const report = JSON.parse(await readFile(auditFile, 'utf8'));
    assert.equal(report.status, 'failed');
    assert.equal(report.originalComparison.status, 'not_performed');
    assert.equal(await readFile(output, 'utf8'), 'previous generation\n');
  } finally { await rm(work, { recursive: true, force: true }); }
});
