import test from 'node:test';
import assert from 'node:assert/strict';
import { scopedPromotionEvidence } from '../promotion-evidence.mjs';

// Isolated fixtures exercise rejection rules; they are never published as offers.
const now = Date.parse('2026-10-22T15:00:00Z');
const item = {ean:'7790000000001', storeId:'10|1|123', province:'San Juan',
  validDate:'2026-10-22', promoPrice:800, conditions:'20% de descuento'};
const offer = {priceCurrency:'ARS', price:'800', validFrom:'2026-10-01',
  validThrough:'2026-10-31', availability:'https://schema.org/InStoreOnly',
  availableAtOrFrom:{branchCode:item.storeId, address:{addressRegion:'San Juan'}},
  description:item.conditions};
const html = (changes = {}, productChanges = {}) => '<script type="application/ld+json">' +
  JSON.stringify({'@type':'Product', gtin13:item.ean, offers:{...offer,...changes},...productChanges}) + '</script>';

test('corroborates only the exact structured physical branch offer, keeping evidenceVersion 2', () => {
  const proof = scopedPromotionEvidence(item, html(), now);
  assert.equal(proof.evidenceVersion, 2);
  assert.equal(proof.storeId, item.storeId);
  assert.equal(proof.channel, 'sucursal');
  assert.equal(proof.verifiedPrice, 800);
});
test('never drops extra payment, quantity or exclusion conditions from official evidence', () => {
  for (const suffix of [' con tarjeta del banco', '; mínimo 2 unidades', '; excepto productos seleccionados']) {
    assert.equal(scopedPromotionEvidence(item, html({description:item.conditions+suffix}), now), null);
  }
});
test('a missing or unknown declared province cannot establish a geographic match', () => {
  assert.equal(scopedPromotionEvidence({...item,province:'desconocida'}, html({
    availableAtOrFrom:{branchCode:item.storeId,address:{addressRegion:'desconocida'}}
  }), now), null);
});
test('the SEPA observation date must itself fall inside the corroborated offer validity', () => {
  assert.equal(scopedPromotionEvidence({...item,validDate:'2026-10-21'}, html({validFrom:'2026-10-22'}), now), null);
});
test('only the Schema.org in-store enum establishes the physical channel', () => {
  for (const availability of ['https://example.test/InStoreOnly','https://schema.org/OnlineOnly']) {
    assert.equal(scopedPromotionEvidence(item, html({availability}), now), null);
  }
});
test('rejects another branch, GTIN, currency, price, stale date and invalid validity', () => {
  for (const changes of [{priceCurrency:'USD'},{price:700},{validThrough:'2026-02-31'},
    {availableAtOrFrom:{branchCode:'other',address:{addressRegion:'San Juan'}}}]) {
    assert.equal(scopedPromotionEvidence(item, html(changes), now), null);
  }
  assert.equal(scopedPromotionEvidence(item, html({}, {gtin13:'7790000000002'}), now), null);
  assert.equal(scopedPromotionEvidence({...item,validDate:'2026-10-01'}, html(), now), null);
});
test('never obtains a GTIN by stripping the legacy SEPA scoped key', () => {
  assert.equal(scopedPromotionEvidence({...item,ean:'sepa:10:1:'+item.ean}, html(), now), null);
});
