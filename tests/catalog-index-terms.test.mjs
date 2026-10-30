import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalogIndexWords,catalogIndexHints,matchesCatalogQuery} from '../catalog-policy/lib/product-search.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('../catalog-policy/data/catalog-policy-regressions.json',import.meta.url),'utf8'));
test('los títulos reales conservan candidatos completos sin sustituir los matchers de precio',()=>{
 for(const {product}of cases){if(!matchesCatalogQuery(product,product.name))continue;const words=catalogIndexWords(product);assert.ok(catalogIndexHints(product.name).some(hint=>words.some(word=>word.startsWith(hint))),product.name);}
});
