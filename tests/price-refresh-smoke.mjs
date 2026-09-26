import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dehezaExpectation, verifyStaleDeheza } from './price-refresh-expectations.mjs';

const origin = process.env.SITE_ORIGIN, token = process.env.PRICE_INGEST_TOKEN;
if (!origin || !token) throw new Error('Falta configuración para verificar la lectura de precios');
const report = {checkedAt:new Date().toISOString(), success:false, checks:[]};
const json = async path => JSON.parse(await readFile(path, 'utf8'));
let cookie;
async function query(scope, parameters, expectedGeneration) {
  const search = new URLSearchParams({...scope, best:'producto', ...parameters});
  for (let attempt = 0; attempt < 13; attempt++) {
    const response = await fetch(origin+'/api/prices?'+search, {headers:{origin,cookie}, signal:AbortSignal.timeout(45000)});
    const body = await response.json();
    if (response.status === 200 && body.coverage?.generatedAt === expectedGeneration) return body;
    if ((response.status !== 503 && response.status !== 200) || attempt === 12) {
      throw new Error(`La app no leyó la generación publicada: HTTP ${response.status}, esperada ${expectedGeneration}, recibida ${body.coverage?.generatedAt ?? 'ninguna'}`);
    }
    // Allow the public source CDN and the app's 60-second cache to converge.
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

async function province(code) {
  const index = await json(`data/national/${code}/index.json`);
  assert.equal(index.geographyVerified, true);
  const shards = new Map();
  for (const store of index.stores) shards.set(store.externalId, await json(`data/national/${code}/${store.file}`));
  return {index, shards};
}
function verifyQuotes(body, catalog, label) {
  assert.ok(body.data.options.length, label+': no devolvió precios');
  for (const quote of body.data.options) {
    const shard = catalog.shards.get(quote.storeId);
    assert.ok(shard, label+': sucursal ajena al índice');
    const row = shard.prices.find(row => row[0] === quote.ean);
    assert.ok(row, label+': código ajeno a la sucursal');
    assert.equal(quote.price, row[5], label+': precio distinto al publicado');
    assert.equal(quote.validDate, row[6], label+': fecha distinta al precio');
    assert.equal(quote.validDate, shard.sourceDate);
    assert.equal(quote.observedAt, shard.source.fileUpdatedAt);
    assert.equal(quote.channel, 'sucursal'); assert.equal(shard.store.channel, 'sucursal');
    assert.notEqual(shard.store.type.toLowerCase(), 'web');
    assert.equal(quote.address, shard.store.address);
    assert.equal(quote.province, shard.store.province);
    assert.equal(quote.barcode ?? null, row[9]?.barcode ?? null);
    assert.equal(quote.barcodeStatus, row[9]?.barcodeStatus);
    assert.equal(quote.provenance.originalComparison, shard.source.originalComparison);
    assert.equal(quote.official, shard.source.official);
  }
  report.checks.push({label, generation:body.coverage.generatedAt, quotes:body.data.options.length, pricesDatesCodesAndPhysicalBranchesMatch:true});
}

try {
  const response = await fetch(origin+'/api/access', {method:'POST', headers:{origin,authorization:`Bearer ${token}`,'content-type':'application/json'}, body:JSON.stringify({name:'Prueba técnica de actualización de precios',test:true}), signal:AbortSignal.timeout(30000)});
  assert.equal(response.status, 200, 'No se pudo crear el perfil técnico');
  cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  assert.ok(cookie.includes('despensa_profile='));
  const sj = await province('AR-J');
  const scope = {province:'AR-J',locality:'San Juan',lat:'-31.534016',lon:'-68.524744'};
  const natura = await query(scope, {ean:'7790272001029'}, sj.index.generatedAt);
  verifyQuotes(natura, sj, 'EAN Natura 1.5 L');
  const changomas = sj.index.stores.filter(store => /^11\|[25]\|/.test(store.externalId));
  assert.ok(changomas.length, 'San Juan: faltan sucursales de ChangoMás');
  for (const store of changomas) {
    const row = sj.shards.get(store.externalId).prices.find(row => row[9]?.barcode === '7790272001029');
    assert.ok(row, 'ChangoMás: falta el producto de control en '+store.externalId);
    const scoped = await query(scope, {ean:row[0],storeIds:store.externalId}, sj.index.generatedAt);
    verifyQuotes(scoped, sj, 'ChangoMás · '+store.branch);
    assert.equal(scoped.data.options.length,1);
    assert.equal(scoped.data.options[0].storeId,store.externalId);
  }
  const carrefour = sj.shards.get('10|1|123')?.prices.find(row => row[9]?.barcode === '7790272001029');
  if (carrefour) assert.ok(natura.data.options.some(q => q.storeId === '10|1|123' && q.price === carrefour[5]), 'No se reconoció el contenido explícito de Carrefour');
  const milk = await query(scope, {ean:'7790742357502'}, sj.index.generatedAt);
  assert.ok(milk.data.options.every(q => !/^11\|[25]\|/.test(q.storeId) || q.price !== 724), 'INC-059 volvió a los cálculos');
  const pendingMilk = [...sj.shards.values()].some(shard => /^11\|[25]\|/.test(shard.store.externalId) && shard.prices.some(row => row[9]?.barcode === '7790742357502' && row[5] === 724));
  if (pendingMilk) assert.ok(milk.data.review?.excludedCount > 0, 'Falta la advertencia del precio de leche observado');
  report.checks.push({label:'INC-059', observedPriceStillExcluded:pendingMilk, excludedCount:milk.data.review?.excludedCount ?? 0});
  const internal = await query(scope, {ean:'sepa:2:1:2060111000007'}, sj.index.generatedAt);
  verifyQuotes(internal, sj, 'Código interno de La Anónima');
  assert.ok(internal.data.options.every(q => q.ean === 'sepa:2:1:2060111000007' && !q.barcode));
  const caba = await province('AR-C');
  // Keep a positive CABA check even when Deheza is correctly excluded.
  const controlBranch = [...caba.shards.values()].find(shard => /^10\|1\|/.test(shard.store.externalId) && shard.prices.some(row => row[9]?.barcode === '7790272001029'));
  assert.ok(controlBranch, 'CABA: falta la sucursal del control positivo');
  const controlProduct = controlBranch.prices.find(row => row[9]?.barcode === '7790272001029');
  const cabaScope = {province:'AR-C',locality:controlBranch.store.locality,lat:String(controlBranch.store.latitude),lon:String(controlBranch.store.longitude)};
  const cabaNatura = await query(cabaScope, {ean:controlProduct[0],storeIds:controlBranch.store.externalId}, caba.index.generatedAt);
  verifyQuotes(cabaNatura, caba, 'CABA: lectura de precios vigentes');
  const expected = dehezaExpectation(caba.index, await json('data/sepa-import-quality.json'));
  const chocolate = await query({province:'AR-C',locality:'Buenos Aires',lat:'-34.546397',lon:'-58.451884'}, {ean:'sepa:3:1:7790580607210'}, caba.index.generatedAt);
  if (expected.status === 'quote_required') verifyQuotes(chocolate, caba, 'Fecha interna de Deheza');
  else report.checks.push(verifyStaleDeheza(chocolate, expected));
  report.success = true;
} catch (error) { report.error = error.message; throw error; }
finally {
  await writeFile('data/price-refresh-smoke-report.json', JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
