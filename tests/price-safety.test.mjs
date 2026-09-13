import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVINCES, provinceFor, isoDate, freshDate, sameSize, coordinate, promotionTotal } from '../price-safety.mjs';
const now=Date.parse('2026-09-13T15:00:00Z');
test('las 24 jurisdicciones tienen códigos separados y alias inequívocos',()=>{
 assert.equal(PROVINCES.length,24);assert.equal(new Set(PROVINCES.map(p=>p.code)).size,24);
 for(const p of PROVINCES){assert.equal(provinceFor(p.code)?.name,p.name);assert.equal(provinceFor(p.id)?.code,p.code);assert.equal(provinceFor(p.name)?.code,p.code);}
 assert.equal(provinceFor('CABA').code,'AR-C');assert.equal(provinceFor('Buenos Aires').code,'AR-B');assert.equal(provinceFor('Jujuy').code,'AR-Y');assert.equal(provinceFor('inexistente'),undefined);
});
test('fechas inválidas, futuras y antiguas no se presentan actuales',()=>{
 for(const date of ['',null,'2026-02-30','2026-09-14','2026-09-01'])assert.equal(freshDate(date,now),false);
 assert.equal(freshDate('2026-09-12',now),true);assert.equal(isoDate('2024-02-29'),'2024-02-29');assert.equal(isoDate('2025-02-29'),null);
});
test('coordenadas ausentes no se convierten en cero',()=>{assert.equal(coordinate(null,-90,90),null);assert.equal(coordinate('',-90,90),null);assert.equal(coordinate('999',-90,90),null);assert.equal(coordinate('-31.5',-90,90),-31.5);});
test('equivalencias conservan peso, volumen y tamaño exacto',()=>{
 assert.equal(sameSize('1 kg','1000 g'),true);assert.equal(sameSize('1 L','1000 ml'),true);assert.equal(sameSize('1 kg','1 L'),false);assert.equal(sameSize('500 g','550 g'),false);assert.equal(sameSize('1 L','1.5 L'),false);
});
test('3x2 respeta grupos, sobrantes y prioridad sobre precio promocional',()=>{
 const p={listPrice:100,promoPrice:66.67,promoKind:'nxm',buyQuantity:3,payQuantity:2};
 for(const [q,total] of [[1,100],[2,200],[3,200],[4,300],[6,400]])assert.equal(promotionTotal(q,p,true).total,total);
 assert.equal(promotionTotal(3,p,false).total,300);
});
test('segunda unidad y porcentajes nunca aplican descuentos imposibles',()=>{
 assert.equal(promotionTotal(3,{listPrice:100,promoKind:'second_unit',discountPercent:80},true).total,220);
 assert.equal(promotionTotal(2,{listPrice:100,promoKind:'percent',discountPercent:110},true).total,200);
 assert.equal(promotionTotal(2,{listPrice:100,promoConditions:'80% segunda unidad'},true).total,200);
 assert.equal(promotionTotal(.5,{listPrice:10000,promoKind:'nxm',buyQuantity:2,payQuantity:1},true).total,5000);
});
test('tarjetas, topes y mínimos no cambian el ranking sin elegibilidad',()=>{
 for(const text of ['Con tarjeta del banco','Compra mínima $10000','Tope $5000','Socios del club']){
  assert.equal(promotionTotal(3,{listPrice:100,promoKind:'percent',discountPercent:50,promoConditions:text},true).total,300);
 }
});

