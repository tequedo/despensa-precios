import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverBankPromotion} from '../bank-promotion-discovery.mjs';
const input={id:'official-1',title:'Jubilados lunes 20%',terms:'Válido del 01/09/2026 al 30/09/2026. Reintegro sujeto a condiciones.',provider:'Banco ejemplo',chain:'ChangoMás',sourceUrl:'https://www.masonline.com.ar/promociones-bancarias',checkedAt:'2026-09-25T15:00:00Z'};
test('discovery keeps official conditions and never treats partial terms as a calculable discount',()=>{const b=discoverBankPromotion(input);assert.equal(b.retiredOnly,true);assert.equal(b.kind,'reimbursement');assert.equal(b.status,'incomplete');assert.equal(b.calculationEligible,false);assert.deepEqual(b.daysOfWeek,[1]);assert.equal(b.discountPercent,20);assert.equal(b.termsText,input.terms);});
test('an empty legal produces no offer and old complete ranges are expired',()=>{assert.equal(discoverBankPromotion({...input,terms:''}),null);const b=discoverBankPromotion({...input,terms:'Vigencia 01/08/2026 al 31/08/2026'});assert.equal(b.status,'expired');});

test('extracts named validity, payment, cap period and channels without applying a benefit',()=>{
  const b=discoverBankPromotion({...input,checkedAt:'2026-10-09T15:00:00Z',terms:'Válido entre el 1 de octubre y el 31 de diciembre de 2026. Los lunes 20% de reintegro pagando con Visa crédito del Banco ejemplo. Tope mensual de $15.000 por cliente. Todo el país en sucursales físicas adheridas y online. No acumulable. No incluye electrodomésticos.'});
  assert.equal(b.validFrom,'2026-10-01'); assert.equal(b.validTo,'2026-12-31');
  assert.equal(b.capAmount,15000); assert.equal(b.capPeriod,'month');
  assert.match(b.paymentRequirement,/Visa crédito/); assert.equal(b.accumulable,false);
  assert.deepEqual(b.channels,['Sucursales físicas','Online']);
  assert.equal(b.status,'incomplete'); assert.equal(b.calculationEligible,false);
  assert.match(b.calculationBlockedReason,/Sucursales/);
});
test('rejects contradictions in percentages, days and caps',()=>{
  const b=discoverBankPromotion({...input,terms:'Válido del 01/09/2026 al 30/09/2026. Los martes 15% de reintegro. Sin tope. Tope mensual $10.000.'});
  assert.equal(b.status,'conflict'); assert.equal(b.calculationEligible,false);
  assert.match(b.calculationBlockedReason,/Porcentajes/); assert.match(b.calculationBlockedReason,/Días/); assert.match(b.calculationBlockedReason,/Topes/);
});
test('interest-free installments are not a discount percentage or an assumed cap',()=>{
  const b=discoverBankPromotion({...input,title:'Naranja X, 6 cuotas',terms:'Válido del 01/09/2026 al 30/09/2026. Todos los días 6 cuotas sin interés. CFT 0%. Pagando con Naranja X en locales adheridos. No acumulable.'});
  assert.equal(b.kind,'installments'); assert.equal(b.installments,6);
  assert.equal(b.discountPercent,null); assert.equal(b.capAmount,null);
  assert.equal(b.status,'incomplete'); assert.equal(b.calculationEligible,false);
});
test('does not infer dates, payment or cap periods from absent/invalid terms',()=>{
  const b=discoverBankPromotion({...input,terms:'Válido del 31/02/2026 al 30/09/2026. Lunes 20% de reintegro. Tope $10.000.'});
  assert.equal(b.validFrom,null); assert.equal(b.paymentRequirement,null); assert.equal(b.capPeriod,null);
  assert.equal(b.accumulable,null); assert.equal(b.calculationEligible,false);
  assert.throws(()=>discoverBankPromotion({...input,checkedAt:'wrong'}),/inválida/);
});
test('conflicting caps in the actual card header and its legal remain blocked',()=>{
  const b=discoverBankPromotion({...input,title:'En tu primera compra · Tope: $6.000 · Todos los días',terms:'Válido del 01/09/2026 al 30/09/2026. 20% de reintegro pagando con crédito. Tope: $8.000 por cliente por mes.'});
  assert.equal(b.status,'conflict');assert.equal(b.capAmount,null);assert.equal(b.calculationEligible,false);
  assert.match(b.calculationBlockedReason,/Topes/);
});
test('plural day labels and colon-delimited caps are extracted, not made calculable',()=>{
  const b=discoverBankPromotion({...input,title:'Todos los domingos',terms:'Válido del 01/09/2026 al 30/09/2026. Todos los domingos 20% de descuento pagando con Visa. Tope mensual: $20.000 por cliente. No acumulable.'});
  assert.deepEqual(b.daysOfWeek,[0]);assert.equal(b.capAmount,20000);assert.equal(b.capPeriod,'month');assert.equal(b.capOwner,'person');
  assert.match(b.capRule,/mensual.*persona/);assert.equal(b.calculationEligible,false);
});
