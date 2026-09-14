import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {nationalExporter} from '../national-export.mjs';
import {PROVINCES} from '../price-safety.mjs';
import {scopedPromotionEvidence} from '../promotion-evidence.mjs';
test('exporta por sucursal las 24 jurisdicciones sin mezclar precios',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'prices-test-'));
 try{
  const exporter=await nationalExporter(join(dir,'data'),join(dir,'tmp'));
  for(const [i,p] of PROVINCES.entries())await exporter.add({source:{modified:'2026-09-12T12:00:00Z'},store:{externalId:'store-'+p.code,province:p.name,locality:'Localidad de '+p.code,chain:'Cadena'},product:{ean:'123',name:'Leche',presentation:'1 L'},price:{listPrice:100+i,validDate:'2026-09-12'}});
  const coverage=await exporter.finish();assert.equal(coverage.length,24);
  for(const [i,p] of PROVINCES.entries()){
   const index=JSON.parse(await readFile(join(dir,'data',p.code,'index.json'),'utf8'));
   assert.equal(index.stores.length,1);assert.equal(index.stores[0].province,p.name);
   const shard=JSON.parse(await readFile(join(dir,'data',p.code,index.stores[0].file),'utf8'));
   assert.equal(shard.prices[0][5],100+i);assert.equal(shard.store.provinceCode,p.code);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('exige evidencia de la misma oferta, vigencia, provincia y sucursal',()=>{
 const now=Date.parse('2026-09-13T15:00:00Z');
 const item={ean:'7791234567890',promoPrice:800,conditions:'Precio especial',validDate:'2026-09-12',storeId:'17-1-4',province:'San Juan'};
 const offer={price:800,priceCurrency:'ARS',validFrom:'2026-09-12',priceValidUntil:'2026-09-15',availability:'https://schema.org/InStoreOnly',description:'Precio especial',availableAtOrFrom:{branchCode:item.storeId,address:{addressRegion:'San Juan'}}};
 const html=o=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',gtin13:item.ean,offers:o})+'</script>';
 assert.equal(scopedPromotionEvidence(item,'Leche '+item.ean+' promoción San Juan',now),null);
 assert.equal(scopedPromotionEvidence(item,html(offer),now).evidenceVersion,2);
 for(const change of [{price:700},{priceValidUntil:'2026-09-10'},{availability:'https://schema.org/InStock'},{availableAtOrFrom:{branchCode:'17-1-5',address:{addressRegion:'San Juan'}}}])assert.equal(scopedPromotionEvidence(item,html({...offer,...change}),now),null);
});
test('la identidad agregada no cambia IDs ni desplaza promociones de los lectores anteriores',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'identity-export-'));
 try{
  const exporter=await nationalExporter(join(dir,'data'),join(dir,'tmp'));
  for(const promotional of [false,true])await exporter.add({source:{modified:'2026-09-13T12:00:00Z'},store:{externalId:'test',province:'San Juan',locality:'San Juan',chain:'Cadena'},product:{ean:'sepa:10:1:'+promotional,name:'Leche',brand:'Marca',presentation:'1 L',referenceUnit:'L',barcode:'7790895000997',barcodeStatus:'valid_format_and_checksum'},price:{listPrice:1800,validDate:'2026-09-13',...(promotional?{promoPrice:1700,promoConditions:'Oferta'}:{})}});
  await exporter.finish();
  const index=JSON.parse(await readFile(join(dir,'data/AR-J/index.json'),'utf8'));
  const shard=JSON.parse(await readFile(join(dir,'data/AR-J',index.stores[0].file),'utf8'));
  assert.equal(shard.version,1);
  assert.equal(shard.prices[0][0],'sepa:10:1:false');assert.equal(shard.prices[0][8],null);
  assert.equal(shard.prices[1][8].promoPrice,1700);
  for(const row of shard.prices)assert.equal(row[9].barcode,'7790895000997');
 }finally{await rm(dir,{recursive:true,force:true});}
});
