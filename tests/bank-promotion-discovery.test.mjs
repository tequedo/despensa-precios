import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverBankPromotion} from '../bank-promotion-discovery.mjs';
const input={id:'official-1',title:'Jubilados lunes 20%',terms:'Válido del 01/09/2026 al 30/09/2026. Reintegro sujeto a condiciones.',provider:'Banco ejemplo',chain:'ChangoMás',sourceUrl:'https://www.masonline.com.ar/promociones-bancarias',checkedAt:'2026-09-25T15:00:00Z'};
test('discovery keeps official conditions and never treats partial terms as a calculable discount',()=>{const b=discoverBankPromotion(input);assert.equal(b.retiredOnly,true);assert.equal(b.kind,'reimbursement');assert.equal(b.status,'incomplete');assert.equal(b.calculationEligible,false);assert.deepEqual(b.daysOfWeek,[1]);assert.equal(b.discountPercent,20);assert.equal(b.termsText,input.terms);});
test('an empty legal produces no offer and old complete ranges are expired',()=>{assert.equal(discoverBankPromotion({...input,terms:''}),null);const b=discoverBankPromotion({...input,terms:'Vigencia 01/08/2026 al 31/08/2026'});assert.equal(b.status,'expired');});
