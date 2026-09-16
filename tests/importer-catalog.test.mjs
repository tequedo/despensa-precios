import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('the real importer excludes Web and stale files and publishes the inner price date', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-import-integration-'));
  try {
    const payload = join(dir, 'payload');
    const header = 'id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_marca|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_unidad_medida_referencia|productos_precio_lista|productos_precio_unitario_promo1|productos_leyenda_promo1|productos_precio_unitario_promo2|productos_leyenda_promo2|productos_precio_referencia|productos_cantidad_referencia\n';
    for (const [id, date] of [['2', '2026-09-13'], ['47', '2025-06-11']]) {
      const folder = join(payload, id); await mkdir(folder, { recursive: true });
      await writeFile(join(folder, 'comercio.csv'), `id_comercio|id_bandera|comercio_bandera_nombre\n${id}|1|Cadena ${id}\n`);
      await writeFile(join(folder, 'sucursales.csv'), `id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_provincia|sucursales_localidad|sucursales_latitud|sucursales_longitud\n${id}|1|15|"Centro\nSucursal"|Supermercado|AR-J|San Juan|-31.536\n|-68.527\n${id}|1|8015|ONLINE|Web|AR-J|San Juan|-31.536|-68.527\n`);
      await writeFile(join(folder, 'productos.csv'), header + `${id}|1|15|7790895000997|1|Leche entera|Marca|1|L|L|1800|1500|Precio especial|1200|Con tarjeta del banco|1800|1\n${id}|1|8015|7790895000997|1|Leche entera|Marca|1|L|L|900|800|Oferta|700|Club|900|1\n\nUltima actualizacion: ${date}T12:00:00-03:00\n`);
    }
    const source = { modified: '2026-09-14T13:00:00Z', kind: 'dataset_replica', official: false };
    const prepared = { folder: payload, resource: { name: 'fixture', last_modified: source.modified }, source, report: { sourceType: 'replica', originalComparison: { status: 'not_performed' } } };
    // Mock acquisition only. All importer, channel, date, snapshot and exporter code is real.
    // Production has no environment switch to skip source verification.
    await writeFile(join(dir, 'loader.mjs'), `export async function resolve(s,c,n){if(s.endsWith('/sepa-source.mjs'))return {url:'data:text/javascript,'+encodeURIComponent(${JSON.stringify('export async function prepareSource(){return ' + JSON.stringify(prepared) + ';}')}),shortCircuit:true};return n(s,c);}`);
    await writeFile(join(dir, 'preload.mjs'), `import {register} from 'node:module';register('./loader.mjs',import.meta.url);const Original=Date;globalThis.Date=class extends Original{constructor(...a){super(...(a.length?a:['2026-09-14T15:00:00Z']));}static now(){return Original.parse('2026-09-14T15:00:00Z');}};`);
    const output = join(dir, 'sj.ndjson'), national = join(dir, 'national'), quality = join(dir, 'quality.json');
    const result = spawnSync(process.execPath, ['--import', join(dir, 'preload.mjs'), new URL('../update-san-juan.mjs', import.meta.url).pathname], { encoding: 'utf8', timeout: 20000, env: { ...process.env, NATIONAL_EXPORT: '1', NATIONAL_OUTPUT_DIR: national, OUTPUT_FILE: output, QUALITY_FILE: quality, PROMOTIONS_FILE: join(dir, 'promotions.json'), QUARANTINE_FILE: join(dir, 'quarantine.ndjson'), DESPENSA_INGEST_URL: '' } });
    assert.equal(result.status, 0, result.stderr);
    const rows = (await readFile(output, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(rows.length, 1); assert.equal(rows[0].store.externalId, '2|1|15');
    assert.deepEqual(rows[0].price.promotions.map(p=>[p.slot,p.promoPrice]),[['promo1',1500],['promo2',1200]]);
    assert.deepEqual(rows[0].price.referencePrice,{price:1800,quantity:1,unit:'L'});
    assert.equal(rows[0].price.promoPrice,1500);
    assert.equal(rows[0].price.listPrice, 1800); assert.equal(rows[0].price.validDate, '2026-09-13');
    assert.equal(rows[0].price.observedAt, '2026-09-13T15:00:00.000Z');
    assert.equal(rows[0].source.modified, source.modified); assert.equal(rows[0].store.channel, 'sucursal');
    assert.equal(rows[0].store.branch, 'Centro\nSucursal'); assert.equal(rows[0].store.longitude, -68.527);
    const audit = JSON.parse(await readFile(quality, 'utf8'));
    assert.equal(audit.excludedStores.length, 2); assert.equal(audit.productFiles.filter(f => !f.accepted).length, 1);
    assert.equal(audit.csvRepairs.length, 2); assert.equal(audit.csvRepairs[0].externalId, '2|1|15');
    const index = JSON.parse(await readFile(join(national, 'AR-J/index.json'), 'utf8'));
    const shard=JSON.parse(await readFile(join(national,'AR-J',index.stores[0].file),'utf8'));
    assert.equal(shard.prices[0][8].promoPrice,1500);assert.equal(shard.prices[0][8].promotions[1].promoPrice,1200);
    assert.deepEqual(shard.prices[0][10].referencePrice,rows[0].price.referencePrice);
    const promotions=JSON.parse(await readFile(join(dir,'promotions.json'),'utf8'));
    assert.deepEqual(promotions.promotions.map(p=>p.promotionSlot),['promo1','promo2']);
    assert.equal(index.stores.length, 1); assert.equal(index.stores[0].sourceDate, rows[0].price.validDate);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
