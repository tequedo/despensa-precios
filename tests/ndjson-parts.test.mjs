import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ndjsonParts} from '../ndjson-parts.mjs';
import {nationalExporter} from '../national-export.mjs';

test('divide auditorías por bytes UTF-8 sin perder registros, orden ni hashes',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ndjson-parts-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=Array.from({length:30},(_,i)=>({id:i,reason:'revisión áéíóú '+i}));
 const writer=await ndjsonParts(dir,{maxBytes:200,context:{source:'fixture'}});
 await Promise.all(input.map(row=>writer.append(row)));
 const manifest=await writer.close(),actual=[];
 assert.equal(manifest.records,input.length);assert.ok(manifest.parts.length>1);
 for(const part of manifest.parts){const bytes=await readFile(join(dir,part.file));assert.ok(bytes.length<=200);assert.equal(bytes.length,part.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256);const rows=bytes.toString('utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.length,part.records);actual.push(...rows);}
 assert.deepEqual(actual,input);assert.deepEqual(await writer.close(),manifest);
 assert.throws(()=>writer.append({id:31}),/cerrado/);
});

test('un registro excepcional no se descarta y una captura interrumpida queda identificada',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ndjson-exception-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const writer=await ndjsonParts(dir,{maxBytes:100});const input=[{id:1},{id:2,text:'á'.repeat(200)},{id:3}];
 for(const row of input)await writer.append(row);
 const manifest=await writer.close({complete:false});assert.equal(manifest.complete,false);assert.equal(manifest.records,3);assert.equal(manifest.parts.length,3);assert.equal(manifest.parts[1].oversizedRecord,true);
 const actual=[];for(const part of manifest.parts)actual.push(...(await readFile(join(dir,part.file),'utf8')).trim().split('\n').map(JSON.parse));assert.deepEqual(actual,input);
});

test('el resumen nacional conserva todas sus exclusiones por partes sin hacer un único informe gigante',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'policy-audit-parts-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const root=join(dir,'national'),exporter=await nationalExporter(root,join(dir,'tmp'));
 for(let i=0;i<1001;i++)await exporter.add({source:{priceDate:'2026-10-29'},store:{externalId:'fixture',province:'San Juan',locality:'Fixture',chain:'Fixture'},product:{ean:'fixture:'+i,name:'PAPAS FRITAS 70 G',brand:'LAYS',presentation:'.07 g',referenceUnit:'g'},price:{listPrice:1000,validDate:'2026-10-29'}});
 await exporter.finish();const report=JSON.parse(await readFile(join(root,'catalog-policy-report.json'),'utf8')),summary=report.provinces['AR-J'];
 assert.equal(report.schemaVersion,2);assert.equal(summary.records,1001);assert.equal(summary.quarantined,1001);assert.equal(summary.exceptionsCount,1001);assert.equal(summary.exceptions,undefined);assert.equal(summary.exceptionsStoredInParts,true);
 const entries=[];for(const part of summary.exceptionParts){const bytes=await readFile(join(root,part.file));assert.ok(bytes.length<=2_000_000);assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256);entries.push(...bytes.toString('utf8').trim().split('\n').map(JSON.parse));}
 assert.equal(entries.length,1001);assert.equal(new Set(entries.map(e=>e.id)).size,1001);assert.equal(summary.exceptionParts.reduce((n,p)=>n+p.records,0),1001);
});
