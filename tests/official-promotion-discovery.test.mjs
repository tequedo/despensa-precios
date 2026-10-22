import test from 'node:test';
import assert from 'node:assert/strict';
import { cencosudCandidates, cotoCandidates, separateLegalCards } from '../official-promotion-discovery.mjs';
const checkedAt='2026-10-22T12:00:00Z';
const source={chain:'Vea',accounts:['veaargentina'],url:'https://www.vea.com.ar/descuentos-del-dia'};
const record={websites:['veaargentina'],stores:[],dateStart:Date.parse('2026-10-01T03:00:00Z')/1000,dateEnd:Date.parse('2026-10-31T23:00:00Z')/1000,days:['4'],banks:[{name:'Banco de prueba'}],info:'20% de descuento',legals:'Válido del 01/10/2026 al 31/10/2026. Los jueves 20% de descuento pagando con tarjeta Visa. Tope mensual $10.000 por persona. No acumulable. Sucursales adheridas. Excluye carnes.'};
test('keeps each chain and legal separate; old and other-chain records never become current offers',()=>{
 const data=cencosudCandidates([record,{...record,websites:['discoargentina']},{...record,dateEnd:1600000000},{...record,websites:[],stores:[{refId:'953'}]}],source,checkedAt);
 assert.equal(data.candidates.length,1);assert.equal(data.expiredRecords,1);assert.equal(data.excludedRecords,2);
 const c=data.candidates[0];assert.equal(c.calculationEligible,false);assert.equal(c.status,'incomplete');assert.equal(c.provider,'Banco de prueba');assert.equal(c.sourceActiveTo,'2026-10-31');assert.deepEqual(c.sourceWebsites,['veaargentina']);
});
test('record dates and day restrictions never override conflicting legal',()=>{
 const c=cencosudCandidates([{...record,days:['1']}],source,checkedAt).candidates[0];
 assert.equal(c.status,'conflict');assert.equal(c.calculationEligible,false);
 const incomplete=cencosudCandidates([{...record,legals:'20% de descuento en productos seleccionados, sujeto a condiciones.'}],source,checkedAt).candidates[0];
 assert.equal(incomplete.validTo,null);assert.equal(incomplete.status,'incomplete');
});
test('separates legal containers and ignores scripts and unrelated page text',()=>{
 const card=terms=>`<div class="legal-card"><h3>Beneficio</h3><div>${terms}</div></div>`;
 const a=record.legals,b=record.legals.replace('20%','10%').replace('Visa','Mastercard');
 const cards=separateLegalCards('<script>'+card(a)+'</script>'+card(a)+card(b));
 assert.equal(cards.length,2);assert.match(cards[0].terms,/Visa/);assert.doesNotMatch(cards[0].terms,/Mastercard/);
 assert.equal(separateLegalCards('<main>'+a+b+'</main>').length,0);
});

test('Coto multichannel summaries stay blocked until complete legal is retrieved',()=>{
 const r={id:'1',textoDescuento:'20% DE DESCUENTO',descripcion:'Con tarjeta Visa los jueves',observacion:'Sin tope. Aplican exclusiones. Ver legales.'};
 const results=cotoCandidates({codigoError:'0',result:{promocionesDigitales:[r],promocionesSucursalesFisicas:[r]}},{url:'https://www.coto.com.ar/descuentos'},checkedAt);
 assert.equal(results.length,2);assert.deepEqual(results.map(r=>r.channels[0]),['Sucursales físicas','Online']);assert.notEqual(results[0].id,results[1].id);
 for (const c of results) {assert.equal(c.status,'incomplete');assert.equal(c.calculationEligible,false);assert.match(c.calculationBlockedReason,/legal completo/);}
});
