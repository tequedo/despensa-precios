import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {nationalExporter} from '../national-export.mjs';
import {writeSanJuanSnapshot} from '../san-juan-snapshot.mjs';
import {includeCatalogProduct,catalogPolicyVersion} from '../catalog-policy/lib/catalog-policy.mjs';
import {matchesCatalogQuery} from '../catalog-policy/lib/product-search.mjs';
import {marketCategory} from '../catalog-policy/lib/market-features.mjs';
import {productFromTuple,createProductIdMatcher} from '../catalog-policy/lib/product-identity.mjs';

const record=(presentation='70 g',province='San Juan')=>({source:{priceDate:'2026-10-25',modified:'2026-10-25T18:00:00Z'},product:{ean:'test-only:chips',name:'PAPAS FRITAS 70 G',brand:'LAYS',presentation,referenceUnit:'g',barcodeStatus:'internal'},store:{externalId:'fixture-'+province,type:'Supermercado',channel:'sucursal',province,locality:'Fixture',chain:'Fixture'},price:{listPrice:1000,validDate:'2026-10-25',channel:'sucursal'}});

test('las regresiones de nombres reales de A, B, C y D siguen aplicándose en cada importación',async()=>{
 const cases=JSON.parse(await fs.readFile(new URL('../catalog-policy/data/catalog-policy-regressions.json',import.meta.url),'utf8'));
 assert.equal(cases.length,151);
 for(const {product,forbidden,required,category} of cases){assert.equal(includeCatalogProduct(product,false),true,product.name);assert.equal(matchesCatalogQuery(product,forbidden),false,product.name);assert.equal(matchesCatalogQuery(product,required),true,product.name);if(category)assert.equal(marketCategory(product),category,product.name);}
});

test('dos importaciones consecutivas recalculan las reglas, conservan la fuente y liberan un dato sólo cuando la nueva fuente es consistente',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'catalog-import-policy-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const [index,input] of [record('.07 g'),record('70 g')].entries()){
  const before=JSON.stringify(input),exporter=await nationalExporter(path.join(root,'national'),path.join(root,'tmp-'+index));
  await exporter.add(input);await exporter.finish();assert.equal(JSON.stringify(input),before);
  const folder=path.join(root,'national','AR-J'),indexFile=JSON.parse(await fs.readFile(path.join(folder,'index.json'),'utf8'));
  const shard=JSON.parse(await fs.readFile(path.join(folder,indexFile.stores[0].file),'utf8')),row=shard.prices[0];
  assert.deepEqual(row.slice(0,8),[input.product.ean,input.product.name,input.product.brand,input.product.presentation,input.product.referenceUnit,1000,'2026-10-25',null]);
  assert.equal(row[11].catalogPolicy.quoteEligible,index===1);assert.equal(shard.catalogPolicyVersion,catalogPolicyVersion);
  const report=JSON.parse(await fs.readFile(path.join(root,'national','catalog-policy-report.json'),'utf8'));
  assert.equal(report.provinces['AR-J'].records,1);assert.equal(report.provinces['AR-J'].quarantined,index===0?1:0);
 }
});

test('la misma política se ejecuta para otras provincias y para la salida de San Juan sin cambiar su NDJSON original',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'catalog-import-provinces-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const exporter=await nationalExporter(path.join(root,'national'),path.join(root,'tmp'));
 await exporter.add(record());await exporter.add(record('.07 g','Buenos Aires'));await exporter.finish();
 const report=JSON.parse(await fs.readFile(path.join(root,'national','catalog-policy-report.json'),'utf8'));
 assert.equal(report.provinces['AR-J'].quoteEligible,1);assert.equal(report.provinces['AR-B'].quarantined,1);
 const input=record(),out=path.join(root,'san-juan.ndjson'),result=await writeSanJuanSnapshot(out,[input],1);
 assert.equal(result.catalogPolicy.counts.quoteEligible,1);assert.deepEqual(JSON.parse((await fs.readFile(out,'utf8')).trim()),input);
 assert.equal(includeCatalogProduct({name:'TAKIS FUEGO 90G',brand:'TAKIS'},false),true);
 assert.equal(includeCatalogProduct({name:'LAYS ORIGINALES 250G',brand:'LAYS'},false),true);
});


test('dos descargas conservan el alcance del código restringido y apartan una huella local modificada',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'catalog-scoped-import-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const cases=JSON.parse(await fs.readFile(new URL('../catalog-policy/data/catalog-policy-regressions.json',import.meta.url),'utf8'));
 const source=cases.find(c=>c.product.name==='DOVE DURAZNO Y LECHE').product;
 for(const [index,name] of [source.name,'LECHE NUEVA 50ML'].entries()){
  const input={...record(),product:{...source,name}},before=JSON.stringify(input);
  const exporter=await nationalExporter(path.join(root,'national'),path.join(root,'tmp-'+index));await exporter.add(input);await exporter.finish();
  const folder=path.join(root,'national/AR-J'),ix=JSON.parse(await fs.readFile(path.join(folder,'index.json'),'utf8'));
  const shard=JSON.parse(await fs.readFile(path.join(folder,ix.stores[0].file),'utf8')),row=shard.prices[0],p=productFromTuple(row);
  assert.equal(row[11].catalogPolicy.quoteEligible,index===0);assert.equal(p.barcodeStatus,'restricted');assert.equal(matchesCatalogQuery(p,'leche'),false);
  assert.equal(createProductIdMatcher([{product:p}])(source.barcode,p),false);
  if(index===0){assert.equal(matchesCatalogQuery(p,'desodorante'),true);assert.equal(row[11].catalogPolicy.category,'Higiene');}
  else assert.equal(row[11].catalogPolicy.reviewCode,'semantic_fingerprint_changed');
  assert.equal(JSON.stringify(input),before);
 }
});
