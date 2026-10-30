import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {writeSanJuanSnapshot} from '../san-juan-snapshot.mjs';
import {readSnapshotRecords} from '../snapshot-records.mjs';
const row=(ean,price=100)=>({store:{externalId:'test',province:'San Juan'},product:{ean,name:'Producto'},price:{validDate:'2026-09-13',listPrice:price}});
test('guarda todas las referencias, conserva sus códigos y deduplica repeticiones idénticas',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sj-snapshot-'));
 try{
  const path=join(dir,'prices.ndjson'),rows=Array.from({length:22838},(_,i)=>row('sepa:1:1:'+i));
  const result=await writeSanJuanSnapshot(path,[...rows,rows[0]],22838);
  const actual=await readSnapshotRecords(path);
  assert.equal(result.rows.length,22838);assert.deepEqual(actual,rows);assert.match(result.sha256,/^[a-f0-9]{64}$/);
  const header=JSON.parse(await readFile(path,'utf8'));assert.equal(header.kind,'san-juan-snapshot');assert.equal(header.version,2);assert.ok(header.parts.length>1);assert.equal(header.records,rows.length);
  const part=join(dir,header.parts.at(-1).file),body=await readFile(part);
  await writeFile(part,'contenido alterado\n');await assert.rejects(readSnapshotRecords(path),/contenido/);
  await writeFile(part,body);assert.deepEqual(await readSnapshotRecords(path),rows);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('un faltante o precio contradictorio conserva la generación anterior',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sj-snapshot-'));
 try{
  const path=join(dir,'prices.ndjson');await writeFile(path,'anterior\n');
  await assert.rejects(writeSanJuanSnapshot(path,[row('a')],2));
  await assert.rejects(writeSanJuanSnapshot(path,[row('a'),row('a',200)],1));
  assert.equal(await readFile(path,'utf8'),'anterior\n');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('el formato anterior conserva todos los registros con líneas vacías y una cabecera no admite datos anexados',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'snapshot-legacy-lines-'));
 try{
  const path=join(dir,'prices.ndjson');await writeFile(path,'\uFEFF\n'+JSON.stringify(row('a'))+'\n\n'+JSON.stringify(row('b'))+'\n');
  assert.deepEqual(await readSnapshotRecords(path),[row('a'),row('b')]);
  await writeFile(path,JSON.stringify({kind:'san-juan-snapshot',version:2,records:1,parts:[]})+'\n{}\n');
  await assert.rejects(readSnapshotRecords(path),/ajenos/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
