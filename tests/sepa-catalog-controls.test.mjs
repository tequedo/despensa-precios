import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { branchChannel, fileDateEvidence, isUpdateFooter, productFileEvidence } from '../sepa-catalog-controls.mjs';
import { nationalExporter } from '../national-export.mjs';

const now = Date.parse('2026-09-14T15:00:00Z');
const publication = '2026-09-14T13:00:00Z';
test('Web is a separate channel; missing or shifted branch fields are not presumed physical', () => {
  assert.equal(branchChannel(' Web '), 'online');
  for (const type of ['Supermercado', 'hipermercado', 'Autoservicio', 'Tradicional']) assert.equal(branchChannel(type), 'sucursal');
  for (const type of ['', null, 'San Salvador de Jujuy', 'Tienda desconocida']) assert.equal(branchChannel(type), 'unknown');
});
test('retains the inner file date, including accented and -0300 footers seen in SEPA', () => {
  for (const label of ['Última actualización', 'Ultima actualizacion', 'Ultima Actualizacion']) {
    const e = fileDateEvidence(label + ': 2026-09-13T04:00:00-0300', publication, now);
    assert.equal(e.accepted, true); assert.equal(e.date, '2026-09-13'); assert.equal(e.updatedAt, '2026-09-13T07:00:00.000Z');
    assert.equal(isUpdateFooter(label + ': invalid'), true);
  }
});
test('a recent package cannot rejuvenate the old Unicoop file or manufacture a missing date', () => {
  assert.equal(fileDateEvidence('Ultima actualizacion: 2025-06-11T21:00:01-03:00', publication, now).reason, 'stale_product_file_date');
  assert.equal(fileDateEvidence('1|2|3', publication, now).reason, 'missing_product_file_date');
  for (const value of ['2026-02-30T10:00:00-03:00', '2026-09-13T25:00:00-03:00', '2026-09-13T10:00:00', 'today']) assert.equal(fileDateEvidence('Ultima actualizacion: ' + value, publication, now).reason, 'invalid_product_file_date');
  assert.equal(fileDateEvidence('Ultima actualizacion: 2026-09-14T13:00:00-03:00', publication, now).reason, 'future_product_file_date');
});
test('uses Argentina calendar days across UTC midnight without silently extending freshness', () => {
  assert.equal(fileDateEvidence('Ultima actualizacion: 2026-09-14T01:00:00Z', publication, now).date, '2026-09-13');
  assert.equal(fileDateEvidence('Ultima actualizacion: 2026-09-10T23:00:00-03:00', publication, now).reason, 'stale_product_file_date');
});
test('reads a large product tail before import, ignoring trailing blank and NUL lines', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-footer-'));
  try {
    const file = join(dir, 'productos.csv');
    await writeFile(file, 'x|y\n'.repeat(20000) + '\nUltima actualizacion: 2026-09-13T12:00:00-03:00\n\0\n');
    assert.equal((await productFileEvidence(file, publication, now)).date, '2026-09-13');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

const record = () => ({ source: { modified: publication, priceDate: '2026-09-13', fileUpdatedAt: '2026-09-13T15:00:00Z' }, store: { externalId: '2|1|15', province: 'Buenos Aires', chain: 'La Anónima', locality: 'Ituzaingó', type: 'Supermercado', channel: 'sucursal' }, product: { ean: 'sepa:2:1:7790895000997', name: 'Leche', brand: 'Marca', presentation: '1 L' }, price: { listPrice: 1800, validDate: '2026-09-13', channel: 'sucursal' } });
test('a Web record cannot accidentally enter the physical national catalogue', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-web-'));
  try {
    const exporter = await nationalExporter(join(dir, 'data'), join(dir, 'tmp'));
    const r = record(); r.store.type = 'Web';
    await assert.rejects(exporter.add(r), /Web/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('national output keeps the CSV date separate from the newer publication date', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-date-export-'));
  try {
    const exporter = await nationalExporter(join(dir, 'data'), join(dir, 'tmp'));
    await exporter.add(record()); await exporter.finish();
    const index = JSON.parse(await readFile(join(dir, 'data/AR-B/index.json'), 'utf8'));
    const shard = JSON.parse(await readFile(join(dir, 'data/AR-B', index.stores[0].file), 'utf8'));
    assert.equal(index.stores[0].sourceDate, '2026-09-13');
    assert.equal(shard.sourceDate, shard.prices[0][6]); assert.equal(shard.source.modified, publication);
    assert.equal(shard.store.channel, 'sucursal');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('conflicting product descriptions or prices stop replacement of the previous national catalogue', async () => {
  for (const field of ['brand', 'listPrice']) {
    const dir = await mkdtemp(join(tmpdir(), 'sepa-conflict-'));
    try {
      const root = join(dir, 'data');
      const first = await nationalExporter(root, join(dir, 'before'));
      await first.add(record()); await first.finish();
      const original = await readFile(join(root, 'coverage.json'), 'utf8');
      const changed = await nationalExporter(root, join(dir, 'after'));
      await changed.add(record()); const other = record();
      if (field === 'brand') other.product.brand = 'Otra marca'; else other.price.listPrice = 900;
      await changed.add(other); await assert.rejects(changed.finish(), /contradictorios/);
      assert.equal(await readFile(join(root, 'coverage.json'), 'utf8'), original);
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
});
