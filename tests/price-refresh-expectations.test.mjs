import test from 'node:test';
import assert from 'node:assert/strict';
import { dehezaExpectation, verifyStaleDeheza } from './price-refresh-expectations.mjs';
const now = Date.parse('2026-09-25T15:00:00Z');
const index = { generatedAt: '2026-09-25T13:36:48.448Z', stores: [] };
const quality = () => ({ checkedAt: '2026-09-25T13:42:13.487Z', productFiles: [{file:'2026-09-22/sepa_1_comercio-sepa-3_2026-09-22_09-05-11/productos.csv', date:'2026-09-21', accepted:false, reason:'stale_product_file_date'}] });
test('a documented four-day-old Deheza file must stay excluded', () => {
  const expected = dehezaExpectation(index, quality(), now);
  assert.deepEqual(expected, {status:'stale_source_excluded', sourceDates:['2026-09-21']});
  assert.equal(verifyStaleDeheza({data:{options:[]},coverage:{generatedAt:index.generatedAt}}, expected).excludedAsExpected,true);
  assert.throws(() => verifyStaleDeheza({data:{options:[{price:2500}]},coverage:{}},expected), /reaparecieron/);
});
test('a current Deheza branch still requires a real quotation', () => {
  assert.deepEqual(dehezaExpectation({...index,stores:[{externalId:'3|1|3'}]},quality(),now),{status:'quote_required'});
});
test('missing, fresh, accepted, unrelated or older evidence cannot turn missing prices green', () => {
  const variants = [
    {...quality(),productFiles:[]},
    {...quality(),checkedAt:'2026-09-24T13:00:00Z'},
    {...quality(),productFiles:[{...quality().productFiles[0],date:'2026-09-22'}]},
    {...quality(),productFiles:[{...quality().productFiles[0],accepted:true}]},
    {...quality(),productFiles:[{...quality().productFiles[0],reason:'invalid_product_file_date'}]},
    {...quality(),productFiles:[{...quality().productFiles[0],file:'comercio-sepa-30_2026.csv'}]}
  ];
  for (const q of variants) assert.throws(() => dehezaExpectation(index,q,now));
});
