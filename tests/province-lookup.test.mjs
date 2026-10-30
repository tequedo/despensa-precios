import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVINCES,normalize,provinceFor} from '../catalog-policy/lib/price-safety.mjs';

test('el índice de provincias conserva todos los códigos, nombres y alias de la consulta completa',()=>{
 const original=value=>{const key=normalize(value);return PROVINCES.find(p=>[p.code,p.id,p.name,p.code.slice(3)].some(v=>normalize(v)===key))??(/^(caba|capital federal|ciudad de buenos aires)$/.test(key)?PROVINCES[0]:key==='tierra del fuego'?PROVINCES.find(p=>p.code==='AR-V'):undefined);};
 const inputs=PROVINCES.flatMap(p=>[p.code,p.id,p.name,p.code.slice(3)]).concat(['CABA','Capital Federal','Ciudad de Buenos Aires','Tierra del Fuego',null,undefined,'','desconocida','AR-XX']);
 for(const value of inputs){
  for(const candidate of [value,typeof value==='string'?`  ${value.toUpperCase()}  `:value])assert.equal(provinceFor(candidate),original(candidate),String(candidate));
 }
});
