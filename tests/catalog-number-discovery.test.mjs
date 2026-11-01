import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {matchesCatalogQuery,matchesProductQuery,catalogIndexHints,catalogIndexWords} from '../catalog-policy/lib/product-search.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('../catalog-policy/data/catalog-discovery-regressions.json',import.meta.url)));

test('descubre números del nombre original sin convertirlos en contenido del envase',()=>{
 for(const {product,query}of fixture.numericDiscovery.products){
  const before=JSON.stringify(product);
  assert.equal(matchesCatalogQuery(product,query),true,query);
  assert.ok(catalogIndexHints(query).some(h=>catalogIndexWords(product).some(w=>w.startsWith(h))),query);
  assert.equal(JSON.stringify(product),before);
 }
});

test('un número literal conserva la variante completa y los prefijos de autocompletado',()=>{
 // Contrafactuales sintéticos, sin precios: no son nuevas filas de la fuente.
 const sample=(name,presentation='1 EA')=>({name,brand:'PRUEBA',presentation});
 assert.equal(matchesCatalogQuery(sample('ULTRAFLEX 15 SOBRES'),'ultra 15'),true);
 for(const name of ['ULTRAFLEX 150 SOBRES','ULTRAFLEX 15.5 SOBRES','ULTRAFLEX 115 SOBRES'])assert.equal(matchesCatalogQuery(sample(name),'ultraflex 15'),false,name);
 assert.equal(matchesCatalogQuery(sample('TINTE MODELO 7.10 50 GR','50 GR'),'tinte 7.10'),true);
 assert.equal(matchesCatalogQuery(sample('TINTE MODELO 7.1 50 GR','50 GR'),'tinte 7.10'),false);
 assert.equal(matchesCatalogQuery(sample('HUEVOS X6'),'huevos 6'),true);
 assert.equal(matchesCatalogQuery(sample('HUEVOS X12'),'huevos 6'),false);
 assert.equal(matchesCatalogQuery(sample('CIF LIMPIADOR 7 EN 1 500 ML','500 ML'),'cif 7 en 1'),true);
 assert.equal(matchesCatalogQuery(sample('CIF LIMPIADOR 7 EN 10 500 ML','500 ML'),'cif 7 en 1'),false);
});

test('unidades explícitas y filtros de familia siguen exigiendo su contenido real',()=>{
 const oil={name:'Aceite Natura girasol 1.5 L',brand:'NATURA',presentation:'1.5 L'};
 assert.equal(matchesCatalogQuery(oil,'aceite 900'),false);
 assert.equal(matchesCatalogQuery(oil,'aceite 900 ml'),false);
 assert.equal(matchesCatalogQuery(oil,'aceite 1500 ml'),true);
 assert.equal(matchesCatalogQuery({name:'Alfajor de arroz 6 unidades',brand:'PRUEBA',presentation:'6 EA'},'arroz 6'),false);
 assert.equal(matchesCatalogQuery({name:'Agua oxigenada 10 volumenes 100 ML',brand:'PRUEBA',presentation:'100 ML'},'agua 10'),false);
 const eggs=fixture.numericDiscovery.products.find(x=>x.query==='huevos 6').product;
 assert.equal(matchesProductQuery(eggs,'huevos 6'),false,'La cotización estricta no incorpora la vía numérica de descubrimiento');
});
