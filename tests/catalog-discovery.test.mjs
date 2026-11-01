import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {matchesCatalogQuery,matchesProductQuery,catalogIndexWords,catalogIndexHints,matchesCatalogBrand} from '../catalog-policy/lib/product-search.mjs';
import {createProductIdMatcher} from '../catalog-policy/lib/product-identity.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('../catalog-policy/data/catalog-discovery-regressions.json',import.meta.url),'utf8'));
const {products,bulbBarcodes}=fixture;

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
