import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {argentinaDate} from '../price-safety.mjs';

async function fixture(t,{wrongPrice=false,stale=false}={}){
 const root=await mkdtemp(join(tmpdir(),'large-live-check-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const folder=join(root,'national/AR-C');await mkdir(folder,{recursive:true});
 const observed=new Date(Date.now()-(stale?10*86400000:3600000)).toISOString(),date=argentinaDate(Date.parse(observed)),generatedAt=new Date().toISOString();
 const store={externalId:'12|1|108',province:'Ciudad Autónoma de Buenos Aires',provinceCode:'AR-C',locality:'Capital Federal',address:'Av. Cabildo 4125',latitude:-34.5458941,longitude:-58.4705622,file:'a'.repeat(24)+'.json',records:2,sourceDate:date};
 const source={official:true,fileUpdatedAt:observed};
 const names=['b'.repeat(24)+'.json','c'.repeat(24)+'.json'];
 const tuple=id=>['sepa:12:1:'+id,'Control '+id,'Marca','1 unidad','unidad',id===222?1200:1000,date,null,null,{barcode:null,barcodeStatus:'internal'},null,{catalogPolicy:{quoteEligible:true}}];
 await writeFile(join(folder,'index.json'),JSON.stringify({version:1,generatedAt,stores:[store]}));
 await writeFile(join(folder,store.file),JSON.stringify({version:2,generatedAt,sourceDate:date,store,source,records:2,parts:names.map(file=>({file,records:1}))}));
 for(const [i,file] of names.entries())await writeFile(join(folder,file),JSON.stringify({version:1,kind:'price-part',storeId:store.externalId,generatedAt,sourceDate:date,prices:[tuple(i===0?111:222)]}));
 const body={coverage:{generatedAt},data:{options:[{storeId:store.externalId,ean:'sepa:12:1:222',listPrice:wrongPrice?1201:1200,price:wrongPrice?1201:1200,validDate:date,observedAt:observed,address:store.address,province:store.province,channel:'sucursal',official:true}]}};
 const preload=join(root,'network.mjs');
 await writeFile(preload,`globalThis.fetch=async input=>{const u=new URL(input);if(${stale}||u.searchParams.get('ean')!=='sepa:12:1:222'||u.searchParams.get('storeIds')!=='12|1|108')throw new Error('Se consultó un control incorrecto o vencido');return Response.json(${JSON.stringify(body)});};`);
 const output=join(root,'report.json'),quality=join(root,'quality.json');await writeFile(quality,JSON.stringify({catalogScope:'all_valid_physical_source_products',filteredByCatalogPolicy:0}));
 const run=spawnSync(process.execPath,['--import',preload,new URL('./large-catalog-smoke.mjs',import.meta.url).pathname],{env:{...process.env,NATIONAL_DATA_DIR:join(root,'national'),QUALITY_FILE:quality,LARGE_CATALOG_REPORT:output,SITE_ORIGIN:'https://example.test'},encoding:'utf8',timeout:10000});
 return {run,report:JSON.parse(await readFile(output,'utf8'))};
}
test('el control usa la última parte y contrasta todos los campos de la cotización publicada',async t=>{
 const {run,report}=await fixture(t);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);assert.equal(report.success,true);assert.equal(report.partCount,2);assert.equal(report.allPublishedRecordsReassembled,2);assert.equal(report.controlFromLastPart,true);assert.equal(report.control.ean,'sepa:12:1:222');assert.equal(report.catalogScope,'all_valid_physical_source_products');
});
test('una diferencia real de importe falla y conserva el diagnóstico',async t=>{
 const {run,report}=await fixture(t,{wrongPrice:true});assert.equal(run.status,1);assert.equal(report.success,false);assert.equal(report.productionQuoteConfirmed,false);assert.match(report.error,/importe no coincide/);
});
test('un catálogo vencido falla antes de consultar una cotización',async t=>{
 const {run,report}=await fixture(t,{stale:true});assert.equal(run.status,1);assert.equal(report.success,false);assert.match(report.error,/precios vigentes/);
});
