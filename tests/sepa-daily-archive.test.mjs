import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { prepareDailyArchive, dailyResource } from '../sepa-daily-archive.mjs';

const now = Date.parse('2026-10-02T23:30:00Z');
const reply = (url, bytes, init = {}) => {
  const response = new Response(bytes, init);
  Object.defineProperty(response, 'url', { value: url });
  return response;
};

async function fixture(t, footer = 'Ultima actualizacion: 2026-10-02T12:00:00-0300', options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'sepa-daily-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const header = 'id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_marca|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_precio_lista\n';
  const files = {
    'merchant/comercio.csv': 'id_comercio|id_bandera|comercio_bandera_nombre\n2|1|Cadena 2\n',
    'merchant/sucursales.csv': 'id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_provincia|sucursales_localidad|sucursales_latitud|sucursales_longitud\n2|1|15|Centro|Supermercado|AR-J|San Juan|-31.536|-68.527\n',
    'merchant/productos.csv': header + '2|1|15|7790895000997|1|Leche entera|Marca|1|L|1800\n' + footer + '\n',
  };
  if (options.staleMerchant) for (const name of ['comercio.csv','sucursales.csv','productos.csv']) {
    files['old/' + name] = name === 'productos.csv'
      ? header + 'Ultima actualizacion: 2026-09-22T12:00:00-0300\n' : files['merchant/' + name];
  }
  await writeFile(join(root, 'files.json'), JSON.stringify(files));
  execFileSync('python3', ['-c', `import sys,json,zipfile
from pathlib import Path
r=Path(sys.argv[1])
with zipfile.ZipFile(r/'source.zip','w',compression=zipfile.ZIP_STORED) as z:
 for name,data in json.loads((r/'files.json').read_text()).items(): z.writestr(name,data)
`, root]);
  const zip = await readFile(join(root, 'source.zip'));
  const requests = [], resource = dailyResource(now);
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push(url);
    assert.equal(url, resource.url, 'only the published official archive URL is requested');
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers['accept-encoding'], 'identity');
    assert.equal(init.headers['user-agent'], undefined);
    if (options.denied) return reply(url, '<h1>Forbidden</h1>Request ID: <code>0123456789abcdef0123456789abcdef</code> 192.0.2.8 BunkerWeb', { status: 403 });
    const body = options.corrupt ? Buffer.from(zip.toString('latin1').replace('1800', '1900'), 'latin1') : zip;
    return reply(url, body);
  });
  const work = join(root, 'work'); await mkdir(work);
  return { root, work, zip, requests, options: { now, originalDir: join(root, 'retained'), auditFile: join(root, 'audit.json') } };
}

test('weekday follows Argentina across UTC midnight and the weekend', () => {
  assert.equal(dailyResource(Date.parse('2026-10-03T01:00:00Z')).name, 'viernes');
  assert.equal(dailyResource(Date.parse('2026-10-03T03:00:00Z')).name, 'sabado');
  assert.equal(dailyResource(Date.parse('2026-10-04T18:00:00Z')).name, 'domingo');
});

test('official ZIP acquisition works without CKAN, retains original bytes and declares actual footer dates and unobserved revision', async t => {
  const f = await fixture(t, undefined, { staleMerchant: true });
  const result = await prepareDailyArchive(f.work, f.options);
  assert.equal(result.source.official, true);
  assert.equal(result.source.modified, '2026-10-02T15:00:00.000Z');
  assert.equal(result.report.priceDate, '2026-10-02');
  assert.equal(result.report.officialResource.last_modified, null);
  assert.equal(result.source.revisionId, null);
  assert.equal(result.report.metadataStatus, 'catalog_revision_not_observed');
  assert.equal(result.report.status, 'official_archive_content_checked');
  assert.equal(result.report.productFiles.find(f => f.path.startsWith('old/')).accepted, false);
  assert.deepEqual(await readFile(join(result.bundle, 'original.zip')), f.zip);
  assert.deepEqual(f.requests, [dailyResource(now).url]);
});

for (const [name, footer] of [
  ['old weekly file', 'Ultima actualizacion: 2026-09-22T12:00:00-0300'],
  ['yesterday instead of daily prices', 'Ultima actualizacion: 2026-10-01T12:00:00-0300'],
  ['future footer', 'Ultima actualizacion: 2026-10-03T12:00:00-0300'],
  ['missing footer', ''],
]) test(`today's ZIP name cannot relabel ${name} as current`, async t => {
  const f = await fixture(t, footer);
  await assert.rejects(prepareDailyArchive(f.work, f.options), /fechas internas válidas del día/);
  const report = JSON.parse(await readFile(f.options.auditFile));
  assert.equal(report.status, 'failed');
  assert.equal(report.priceDate, undefined);
});

test('damaged ZIP payload is rejected before an acquisition is accepted', async t => {
  const f = await fixture(t, undefined, { corrupt: true });
  await assert.rejects(prepareDailyArchive(f.work, f.options), /CRC|zip/i);
  assert.equal(JSON.parse(await readFile(f.options.auditFile)).status, 'failed');
});

test('HTTP 403 stops after one archive request and retains only sanitized support evidence', async t => {
  const f = await fixture(t, undefined, { denied: true });
  await assert.rejects(prepareDailyArchive(f.work, f.options), /HTTP 403/);
  assert.equal(f.requests.length, 1);
  const report = JSON.parse(await readFile(f.options.auditFile));
  assert.deepEqual(report.http, { status: 403, host: 'datos.produccion.gob.ar', requestId: '0123456789abcdef0123456789abcdef', protection: 'BunkerWeb', accessDenied: true });
  assert.ok(!JSON.stringify(report).includes('192.0.2.8'));
  assert.ok(!JSON.stringify(report).includes('<h1>'));
});

test('real importer can publish source prices from the official daily ZIP while never querying the inaccessible catalog', async t => {
  const f = await fixture(t);
  const source = await readFile(join(f.root, 'source.zip'));
  const preload = join(f.root, 'preload.mjs');
  await writeFile(preload, `import {readFile} from 'node:fs/promises';
const Original=Date;globalThis.Date=class extends Original{constructor(...a){super(...(a.length?a:[${now}]));}static now(){return ${now};}};
globalThis.fetch=async (url,options)=>{
 if(url!==${JSON.stringify(dailyResource(now).url)})throw Error('Unexpected network request');
 const r=new Response(await readFile(${JSON.stringify(join(f.root,'source.zip'))}));
 Object.defineProperty(r,'url',{value:url});return r;
};`);
  const output = join(f.root, 'prices.ndjson');
  const run = spawnSync(process.execPath, ['--import', preload, new URL('../update-san-juan.mjs', import.meta.url).pathname], {
    encoding: 'utf8', timeout: 20000, env: { ...process.env, SEPA_SOURCE: 'official-daily',
      MANUAL_ZIP_URL: '', SEPA_ORIGINAL_DIR: f.options.originalDir, PROVENANCE_FILE: f.options.auditFile,
      OUTPUT_FILE: output, NATIONAL_EXPORT: '1', NATIONAL_OUTPUT_DIR: join(f.root, 'national'),
      QUARANTINE_FILE: join(f.root, 'quarantine.ndjson'), QUALITY_FILE: join(f.root, 'quality.json'),
      PROMOTIONS_FILE: join(f.root, 'promotions.json'), DESPENSA_INGEST_URL: '' },
  });
  assert.equal(run.status, 0, run.stderr);
  const rows = (await readFile(output, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].price.listPrice, 1800);
  assert.equal(rows[0].price.validDate, '2026-10-02');
  assert.equal(rows[0].store.externalId, '2|1|15');
  assert.equal(rows[0].source.revisionId, null);
  assert.equal(rows[0].source.modifiedBasis, 'product_file_footer');
  const index = JSON.parse(await readFile(join(f.root, 'national/AR-J/index.json')));
  assert.equal(index.stores[0].sourceDate, '2026-10-02');
  const [bundle] = await readdir(f.options.originalDir);
  assert.deepEqual(await readFile(join(f.options.originalDir, bundle, 'original.zip')), source);
});
