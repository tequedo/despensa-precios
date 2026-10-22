import test from 'node:test';
import assert from 'node:assert/strict';
import {productPromotionSources, productPromotionSourceMatches} from '../promotion-sources.mjs';

test('accented chain names reach their own official source without crossing chains', () => {
  for (const [id, names] of [['la_anonima',['La Anónima','LA ANONIMA']],['atomo',['Átomo','Familia Millán']]]) {
    const source = productPromotionSources.find(source=>source.id===id);
    for (const name of names) assert.equal(productPromotionSourceMatches(source,name),true,name);
    assert.equal(productPromotionSourceMatches(source,'Hipermercado Carrefour'),false);
  }
});
