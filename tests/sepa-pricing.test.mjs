import test from 'node:test';
import assert from 'node:assert/strict';
import {readSepaPricing, promotionDetails} from '../sepa-pricing.mjs';

test('conserva promo1, promo2 y referencia sin reemplazar el precio del envase',()=>{
  const result=readSepaPricing({productos_precio_unitario_promo1:'1500,50',productos_leyenda_promo1:'Precio especial',productos_precio_unitario_promo2:'1200',productos_leyenda_promo2:'Con tarjeta del banco',productos_precio_referencia:'4000',productos_cantidad_referencia:'1',productos_unidad_medida_referencia:'KG'},1800,'2026-09-16');
  assert.deepEqual(result.promotions.map(p=>[p.slot,p.promoPrice]),[['promo1',1500.50],['promo2',1200]]);
  assert.equal(result.promotions[1].requiredBenefit,'Con tarjeta del banco');
  assert.deepEqual(result.referencePrice,{price:4000,quantity:1,unit:'KG'});
  assert.deepEqual(result.issues,[]);
});
test('promo2 sobrevive sin promo1 y una promoción vencida no elimina la otra',()=>{
  const row={productos_precio_unitario_promo1:'900',productos_leyenda_promo1:'Hasta el 15/09/2026',productos_precio_unitario_promo2:'800',productos_leyenda_promo2:'Oferta'};
  const result=readSepaPricing(row,1000,'2026-09-16');
  assert.deepEqual(result.promotions.map(p=>p.slot),['promo2']);
  assert.equal(result.issues[0].reason,'expired_promotion');
  assert.equal(readSepaPricing({...row,productos_precio_unitario_promo1:'0',productos_leyenda_promo1:''},1000,'2026-09-16').promotions[0].slot,'promo2');
});
test('no convierte precios inválidos, vigencias imposibles ni referencias incompletas en ofertas',()=>{
  for(const value of ['1e3','1.200,00','1200','99','-200']) assert.equal(readSepaPricing({productos_precio_unitario_promo2:value},1000,'2026-09-16').promotions.length,0,value);
  const result=readSepaPricing({productos_leyenda_promo1:'3x2 hasta 31/02/2026',productos_precio_referencia:'2000',productos_unidad_medida_referencia:'L'},1000,'2026-09-16');
  assert.equal(result.promotions.length,0);assert.equal(result.referencePrice,undefined);assert.equal(result.issues.length,2);
});
test('segunda unidad reconoce ambos órdenes y las reglas ambiguas no se simplifican',()=>{
  for(const text of ['80% en la segunda unidad','Segunda unidad al 80% de descuento']) assert.deepEqual(promotionDetails(600,text),{promoKind:'second_unit',discountPercent:80,requiredBenefit:''});
  assert.equal(promotionDetails(600,'20% o 40% según el producto').promoKind,'none');
  assert.equal(promotionDetails(600,'Oferta segunda unidad').promoKind,'none');
  assert.equal(promotionDetails(600,'Segunda unidad al 80%').promoKind,'none');
  assert.equal(promotionDetails(600,'3x2 más 20% adicional').promoKind,'none');
  assert.equal(promotionDetails(undefined,'3x2').buyQuantity,3);
});
