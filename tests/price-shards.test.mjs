import test from 'node:test';
import assert from 'node:assert/strict';
import {readPriceShard} from '../price-shards.mjs';

function fixture(){
 const generatedAt='2026-10-29T18:00:00.000Z',sourceDate='2026-10-29',store={externalId:'12|1|108',province:'Buenos Aires'};
 const files=['a'.repeat(24)+'.json','b'.repeat(24)+'.json'];
 const prices=[['p1','Leche','Marca','1 L','L',1500,sourceDate],['p2','Arroz','Marca','1 kg','kg',2000,sourceDate]];
 const header={version:2,generatedAt,sourceDate,store,source:{name:'SEPA'},records:2,parts:files.map(file=>({file,records:1}))};
 const parts=Object.fromEntries(files.map((file,index)=>[file,{version:1,kind:'price-part',generatedAt,sourceDate,storeId:store.externalId,prices:[prices[index]]}]));
 return {header,parts,prices,files,expected:{storeId:store.externalId,sourceDate,generatedAt,records:2}};
}

test('reúne todas las partes como una sucursal y conserva el catálogo anterior de un archivo',async()=>{
 const f=fixture(),before=JSON.stringify(f.header),reads=[];
 const result=await readPriceShard(f.header,async file=>{reads.push(file);return f.parts[file];},f.expected);
 assert.deepEqual(result.prices,f.prices);assert.equal(result.version,1);assert.deepEqual(reads,f.files);
 assert.equal(JSON.stringify(f.header),before,'No convierte la cabecera cacheada en una copia completa');
 const legacy={...f.header,version:1,prices:f.prices};delete legacy.parts;
 assert.equal(await readPriceShard(legacy,()=>{throw new Error('No debe leer partes');},f.expected),legacy);
});

test('rechaza una sucursal completa si falta una parte o cambian generación, fecha o identidad',async()=>{
 for(const change of [part=>undefined,part=>({...part,generatedAt:'otra'}),part=>({...part,sourceDate:'2026-10-28'}),part=>({...part,storeId:'otra'}),part=>({...part,prices:[]})]){
  const f=fixture();f.parts[f.files[1]]=change(f.parts[f.files[1]]);
  await assert.rejects(()=>readPriceShard(f.header,async file=>f.parts[file],f.expected));
 }
 const f=fixture();await assert.rejects(()=>readPriceShard(f.header,async()=>{throw new Error('404');},f.expected),/404/);
});

test('valida los nombres y el recuento de las partes antes de descargar y rechaza duplicados de producto',async()=>{
 for(const parts of [[{file:'../index.json',records:2}],[{file:'https://example.invalid/file',records:2}],[{file:'a'.repeat(24)+'.json',records:1}],[{file:'a'.repeat(24)+'.json',records:1},{file:'a'.repeat(24)+'.json',records:1}]]){
  const f=fixture();f.header.parts=parts;
  await assert.rejects(()=>readPriceShard(f.header,()=>{assert.fail('No debe leer una ruta inválida');},f.expected));
 }
 const f=fixture();f.parts[f.files[1]].prices=[f.prices[0]];
 await assert.rejects(()=>readPriceShard(f.header,async file=>f.parts[file],f.expected),/repetidos/);
});

test('no acepta un archivo incompleto ni una cabecera de otra generación como la sucursal pedida',async()=>{
 const f=fixture();
 await assert.rejects(()=>readPriceShard(f.header,async file=>f.parts[file],{...f.expected,records:3}),/cantidad/);
 for(const expected of [{...f.expected,storeId:'otra'},{...f.expected,sourceDate:'2026-10-28'},{...f.expected,generatedAt:'otra'}])
  await assert.rejects(()=>readPriceShard(f.header,async file=>f.parts[file],expected),/actualización/);
 await assert.rejects(()=>readPriceShard({version:1,store:f.header.store,prices:[f.prices[0]]},async()=>{}, {records:2}),/cantidad/);
});
