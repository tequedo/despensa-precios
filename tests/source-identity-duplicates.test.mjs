import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readSepaRows} from '../sepa-csv.mjs';
import {sepaProductIdentity} from '../product-identity.mjs';
import {nationalExporter} from '../national-export.mjs';
import {writeSanJuanSnapshot} from '../san-juan-snapshot.mjs';
import {mergeRecordIdentity,mergeTupleIdentity} from '../source-identity-duplicates.mjs';
import {productFromTuple,createProductIdMatcher} from '../catalog-policy/lib/product-identity.mjs';

async function originalRecords(){
  const result=[];
  await readSepaRows(new URL('./fixtures/sepa-duplicate-ean-indicator.csv',import.meta.url),row=>{
    const {accepted,...identity}=sepaProductIdentity(row);assert.equal(accepted,true);
    result.push({source:{priceDate:'2026-10-29',fileUpdatedAt:'2026-10-29T12:00:02.000Z'},
      store:{externalId:'5|1|1',province:'Buenos Aires',locality:'Localidad',chain:'Cadena',channel:'sucursal'},
      product:{...identity,name:row.productos_descripcion,brand:row.productos_marca,presentation:row.productos_cantidad_presentacion+' '+row.productos_unidad_medida_presentacion,referenceUnit:row.productos_unidad_medida_referencia},
      price:{listPrice:Number(row.productos_precio_lista),validDate:'2026-10-29'}});
  });
  assert.equal(result.length,2);return result;
}

test('el duplicado real del 29/10 conserva el precio, ID y los dos indicadores sin bloquear el catálogo',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'source-indicator-'));
  try{
    const rows=await originalRecords(),before=structuredClone(rows);
    const exporter=await nationalExporter(join(dir,'national'),join(dir,'tmp'));
    for(const row of [...rows,rows[0],rows[1]])await exporter.add(row);
    const coverage=await exporter.finish();
    const index=JSON.parse(await readFile(join(dir,'national/AR-B/index.json'),'utf8'));
    const shard=JSON.parse(await readFile(join(dir,'national/AR-B',index.stores[0].file),'utf8'));
    assert.equal(coverage.find(p=>p.code==='AR-B').records,1);
    assert.equal(index.stores[0].records,1);assert.equal(shard.prices.length,1);
    const tuple=shard.prices[0];assert.equal(tuple[0],'sepa:5:1:0079400052919');assert.equal(tuple[5],942);
    assert.equal(tuple[1],rows[0].product.name);assert.equal(tuple[6],'2026-10-29');
    assert.equal(tuple[9].barcode,null);assert.equal(tuple[9].barcodeStatus,'internal');
    assert.deepEqual(tuple[9].sourceIdentityVariants.map(v=>v.sourceEanIndicator).sort(),['0','1']);
    assert.deepEqual(tuple[9].sourceIdentityVariants.map(v=>v.barcodeStatus).sort(),['internal','valid_format_and_checksum']);
    assert.deepEqual(rows,before,'El original no se modifica al reunir duplicados');
    const snapshot=await writeSanJuanSnapshot(join(dir,'sj.ndjson'),rows.map(r=>({...r,store:{...r.store,province:'San Juan'}})),1);
    assert.equal(snapshot.rows[0].price.listPrice,942);
    assert.equal(snapshot.rows[0].product.sourceIdentityVariants.length,2);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('un indicador interno impide usar como GTIN un código válido y conserva ambas evidencias',()=>{
  const product=flag=>{const {accepted,...p}=sepaProductIdentity({id_comercio:'5',id_bandera:'1',id_producto:'7790895000997',productos_ean:flag});return p;};
  const record=flag=>({product:{...product(flag),name:'Leche',brand:'Marca',presentation:'1 L'},price:{listPrice:1500,validDate:'2026-10-29'}});
  const left=record('1'),right=record('0'),merged=mergeRecordIdentity(left,right);
  assert.equal(merged.product.barcodeStatus,'internal');assert.equal(merged.product.barcode,undefined);assert.equal(merged.product.gtin,undefined);
  assert.equal(merged.product.sourceIdentityVariants.find(v=>v.sourceEanIndicator==='1').barcode,'7790895000997');
  const tuple=p=>[p.ean,'Leche','Marca','1 L','L',1500,'2026-10-29',null,null,{barcode:p.barcode??null,barcodeStatus:p.barcodeStatus,sourceEanIndicator:p.sourceEanIndicator}];
  const resolved=mergeTupleIdentity(tuple(left.product),tuple(right.product));
  const parsed=productFromTuple(resolved);
  assert.equal(parsed.barcodeStatus,'internal');assert.equal(parsed.barcode,undefined);
  assert.equal(createProductIdMatcher([{product:parsed}])('7790895000997',parsed),false);
  assert.equal(createProductIdMatcher([{product:parsed}])(parsed.ean,parsed),true);
});

test('sólo se reúne la discrepancia del indicador; precios, promociones e identidad diferentes siguen rechazados',async()=>{
  const [left,right]=await originalRecords();
  for(const edit of [r=>r.price.listPrice++,r=>r.price.promoPrice=900,r=>r.price.referencePrice={price:900,quantity:1,unit:'unidad'},r=>r.product.brand+=' otra',r=>r.product.presentation='2 unidades',r=>r.product.name+=' otro',r=>r.product.ean+='otro',r=>r.price.validDate='2026-10-28']){
    const changed=structuredClone(right);edit(changed);assert.equal(mergeRecordIdentity(left,changed),null);
  }
  const unverified=structuredClone(right);unverified.product.barcodeStatus='unverified';
  assert.equal(mergeRecordIdentity(left,unverified),null);
});
