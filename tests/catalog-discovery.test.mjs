import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {matchesCatalogQuery,matchesProductQuery,catalogIndexWords,catalogIndexHints,matchesCatalogBrand,catalogBrandQueryIntent,relatedCatalogBrand,matchesCatalogTitleQuery} from '../catalog-policy/lib/product-search.mjs';
import {createProductIdMatcher} from '../catalog-policy/lib/product-identity.mjs';
import {productSearchFamily} from '../catalog-policy/lib/product-search.mjs';
import {marketCategory} from '../catalog-policy/lib/market-features.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('../catalog-policy/data/catalog-discovery-regressions.json',import.meta.url),'utf8'));
const {products,bulbBarcodes}=fixture;

test('el vínculo de marca solo ayuda a descubrir: una variante en el título no autoriza otra marca al cotizar',()=>{
 const zero={name:'GASEOSA ZERO 2L',brand:'FANTA',presentation:'2 L'};
 assert.equal(matchesCatalogQuery(zero,'Fanta Zero'),true);
 assert.equal(relatedCatalogBrand('FANTA','FANTA ZERO'),true);
 assert.equal(relatedCatalogBrand('BODY FANTASIES','FANTA'),false);
 assert.equal(matchesCatalogBrand('FANTA','FANTA ZERO'),false);
 assert.equal(catalogBrandQueryIntent('Lays'),true);
 for(const query of ['leche','aceite','foco'])assert.equal(catalogBrandQueryIntent(query),false,query);
});

test('una marca completa recupera sus productos aunque contenga familias o números, sin deducir su envase',()=>{
 const original=JSON.stringify(fixture.brandQueries.products);
 assert.ok(fixture.brandQueries.products.length>60);
 for(const product of fixture.brandQueries.products){
  assert.equal(matchesCatalogQuery(product,product.brand),true,product.brand+': '+product.name);
  assert.ok(catalogIndexHints(product.brand).some(hint=>catalogIndexWords(product).some(word=>word.startsWith(hint))),product.brand);
 }
 assert.equal(JSON.stringify(fixture.brandQueries.products),original);
});

test('las palabras completas de nombres comerciales conservan sus marcas originales sin aceptar fantasía como Fanta',()=>{
 const original=JSON.stringify(fixture.qualifiedTitles);
 for(const {query,product}of fixture.qualifiedTitles){assert.equal(matchesCatalogTitleQuery(product,query),true,product.ean);assert.equal(matchesCatalogQuery(product,query),true,product.ean);}
 assert.equal(matchesCatalogTitleQuery({name:'AZUCAR FANTASIA NEGRA'},'Fanta'),false);
 assert.equal(JSON.stringify(fixture.qualifiedTitles),original);
});

test('las dos leches micelares reales son higiene y no aparecen al buscar leche de consumo',()=>{
 const original=JSON.stringify(fixture.micellarMilk.products);
 assert.equal(fixture.micellarMilk.products.length,2);
 for(const product of fixture.micellarMilk.products){
  assert.equal(productSearchFamily(product),'leche limpiadora');
  assert.equal(marketCategory(product),'Higiene');
  assert.equal(matchesCatalogQuery(product,'leche'),false);
  assert.equal(matchesCatalogQuery(product,'leche limpiadora'),true);
  assert.equal(matchesCatalogQuery(product,product.name),true);
  assert.ok(catalogIndexHints('leche limpiadora').some(hint=>catalogIndexWords(product).some(word=>word.startsWith(hint))));
 }
 assert.equal(JSON.stringify(fixture.micellarMilk.products),original);
});

test('foco, focos y lamparitas descubren las diez lámparas reales sin carpas, anafes ni linternas',()=>{
 const original=JSON.stringify(products);
 for(const query of fixture.bulbQueries){
  assert.deepEqual(products.filter(p=>matchesCatalogQuery(p,query)).map(p=>p.barcode).sort(),[...bulbBarcodes].sort(),query);
 }
 assert.equal(JSON.stringify(products),original,'Los campos originales no se corrigen ni enriquecen en origen');
});

test('el índice contiene los candidatos de los alias y permite la búsqueda explícita de marca FOCO',()=>{
 for(const query of fixture.bulbQueries){
  for(const p of products.filter(p=>bulbBarcodes.includes(p.barcode))){
   assert.ok(catalogIndexHints(query).some(hint=>catalogIndexWords(p).some(word=>word.startsWith(hint))),query+': '+p.name);
  }
 }
 const tents=products.filter(p=>p.name.startsWith('CARPA'));
 assert.equal(tents.length,4);
 for(const p of tents){assert.equal(matchesCatalogQuery(p,'carpa FOCO'),true);assert.equal(matchesCatalogQuery(p,p.name),true);assert.equal(matchesCatalogBrand(p.brand,'FOCO'),true);}
 for(const p of products)assert.equal(matchesCatalogQuery(p,p.name),true,p.name);
});

test('el alias de descubrimiento conserva los controles exactos de cotización y de códigos',()=>{
 const bulb=products.find(p=>p.barcode==='7791772047609'),matchesId=createProductIdMatcher(products.map(product=>({product})));
 assert.equal(matchesCatalogQuery(bulb,'focos led 9w'),true);
 assert.equal(matchesCatalogQuery(bulb,'focos led 7w'),false);
 assert.equal(matchesCatalogQuery(bulb,'focos otra marca'),false);
 assert.equal(matchesProductQuery(bulb,'foco'),false);
 assert.equal(matchesProductQuery(bulb,'lamparita'),false);
 assert.equal(matchesProductQuery(bulb,'lampara'),true);
 assert.equal(matchesId(bulb.ean,bulb),true);
 assert.equal(matchesId(bulb.ean,products.find(p=>p.barcode==='7791772047616')),false);
});

test('no confunde un velador con su bombilla y mantiene consultas independientes al rotar la caché',()=>{
 const desk={name:'LAMPARA LED DE MESA',brand:'PRUEBA',presentation:'1 UNI'};
 assert.equal(matchesCatalogQuery(desk,'lampara'),true);
 assert.equal(matchesCatalogQuery(desk,'foco'),false);
 assert.equal(matchesCatalogQuery(desk,'lampara de mesa'),true);
 const bulb=products.find(p=>p.barcode==='7791772047609');
 for(let i=0;i<80;i++)matchesCatalogQuery(bulb,'consulta '+i);
 assert.equal(matchesCatalogQuery(bulb,'focos'),true);
 assert.equal(matchesCatalogQuery(bulb,'carpa FOCO'),false);
 assert.equal(matchesCatalogQuery(bulb,'focos'),true);
 assert.equal(matchesCatalogQuery(bulb,'lampara 1 EA'),false,'Un número de unidades no se infiere de otra medida');
});
