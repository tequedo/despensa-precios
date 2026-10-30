import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PROVINCES,argentinaDate} from '../price-safety.mjs';

// Synthetic transport fixtures exercise all 24 scopes; they are not price evidence.
async function fixture(t,{corruptPart=false,wrongPrice=false,promotion=false}={}){
 const root=await mkdtemp(join(tmpdir(),'national-large-check-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const national=join(root,'national');await mkdir(national);
 const generatedAt=new Date().toISOString(),date=argentinaDate(),expected={};
 const summaries=[];
 for(const province of PROVINCES){
  const folder=join(national,province.code);await mkdir(folder);
  const file='a'.repeat(24)+'.json',store={externalId:'test-only-'+province.code,chain:'Fixture',branch:'Control',province:province.name,provinceCode:province.code,locality:'Fixture',latitude:-31.5,longitude:-68.5,address:'Fixture',channel:'sucursal',file,sourceDate:date,records:2};
  const source={official:true,fileUpdatedAt:generatedAt},parts=[];
  for(const id of [111,222]){
   const row=[province.code+':'+id,'Control '+id,'Fixture','1 unidad','unidad',id===222?1200:1000,date,null,null,{barcode:null,barcodeStatus:'internal'},null,{catalogPolicy:{quoteEligible:true}}];
   const bytes=JSON.stringify({version:1,kind:'price-part',storeId:store.externalId,generatedAt,sourceDate:date,prices:[row]})+'\n';
   const name=createHash('sha256').update(bytes).digest('hex').slice(0,24)+'.json';
   await writeFile(join(folder,name),corruptPart&&province.code==='AR-C'&&id===222?bytes.replace('1200','1201'):bytes);
   parts.push({file:name,records:1});
  }
  await writeFile(join(folder,file),JSON.stringify({version:2,store,source,sourceDate:date,generatedAt,records:2,parts}));
  await writeFile(join(folder,'index.json'),JSON.stringify({version:1,geographyVerified:true,province,generatedAt,stores:[store]}));
  summaries.push({...province,stores:1,records:2,sourceDate:date});
  expected[province.code]={storeId:store.externalId,ean:province.code+':222',listPrice:wrongPrice?1201:1200,price:promotion?1100:1200,...(promotion?{appliedPromotion:{id:'test-only-promotion'}}:{}),validDate:date,address:store.address,province:store.province,channel:'sucursal',official:true,observedAt:generatedAt};
 }
 await writeFile(join(national,'coverage.json'),JSON.stringify({version:1,geographyVerified:true,generatedAt,provinces:summaries}));
 const quality=join(root,'quality.json');await writeFile(quality,JSON.stringify({catalogScope:'all_valid_physical_source_products',filteredByCatalogPolicy:0}));
 const network=join(root,'network.mjs');
 await writeFile(network,`const expected=${JSON.stringify(expected)};globalThis.fetch=async input=>{const u=new URL(input),q=expected[u.searchParams.get('province')];if(!q||q.storeId!==u.searchParams.get('storeIds')||q.ean!==u.searchParams.get('ean'))throw new Error('Control incorrecto');return Response.json({coverage:{generatedAt:${JSON.stringify(generatedAt)}},data:{options:[q]}});};`);
 const output=join(root,'report.json');
 const run=spawnSync(process.execPath,['--import',network,new URL('./national-large-branch-smoke.mjs',import.meta.url).pathname],{env:{...process.env,NATIONAL_DATA_DIR:national,QUALITY_FILE:quality,NATIONAL_LARGE_BRANCH_REPORT:output,SITE_ORIGIN:'https://example.test'},encoding:'utf8',timeout:15000});
 return {run,report:JSON.parse(await readFile(output,'utf8'))};
}

test('las 24 provincias reconstruyen su sucursal mayor y contrastan una cotización de su última parte',async t=>{
 const {run,report}=await fixture(t);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 assert.equal(report.success,true);assert.equal(report.indexChecks.length,24);assert.equal(report.branchChecks.length,24);
 assert.equal(report.stores,24);assert.equal(report.publishedRecords,48);
 assert.ok(report.branchChecks.every(b=>b.success&&b.partCount===2&&b.controlFromLastPart&&b.listPriceMatchesSource));
});
test('una parte alterada falla por hash aunque mantenga cantidad y generación',async t=>{
 const {run,report}=await fixture(t,{corruptPart:true});assert.equal(run.status,1);assert.equal(report.success,false);
 assert.ok(report.errors.some(e=>e.province==='AR-C'&&/hash distinto/.test(e.error)));
 assert.equal(report.branchChecks.filter(b=>b.success).length,23);
});
test('un precio distinto al archivo no permite dar por validada la publicación nacional',async t=>{
 const {run,report}=await fixture(t,{wrongPrice:true});assert.equal(run.status,1);assert.equal(report.success,false);
 assert.equal(report.branchChecks.filter(b=>b.success).length,0);assert.equal(report.errors.length,24);
});
test('una promoción identificada conserva el contraste del precio de lista sin confundirlo con el importe final',async t=>{
 const {run,report}=await fixture(t,{promotion:true});assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 assert.equal(report.success,true);assert.ok(report.branchChecks.every(b=>b.control.listPrice===1200&&b.control.price===1100&&b.control.promotionApplied));
});
