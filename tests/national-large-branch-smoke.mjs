import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {PROVINCES,freshDate,provinceFor} from '../price-safety.mjs';
import {readPriceShard} from '../price-shards.mjs';
import {productFromTuple} from '../catalog-policy/lib/product-identity.mjs';
import {classifyCatalogRecord} from '../catalog-policy/lib/catalog-policy.mjs';

const commit=process.env.DATA_COMMIT??null;
const root=process.env.NATIONAL_DATA_DIR??'data/national';
const output=process.env.NATIONAL_LARGE_BRANCH_REPORT??'data/national-large-branch-smoke-report.json';
const origin=process.env.SITE_ORIGIN??'https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site';
const report={checkedAt:new Date().toISOString(),commit,success:false,scope:'All province indexes plus the largest published branch per province; not every SKU in the country',indexChecks:[],branchChecks:[],errors:[]};
let largestFile=0;
async function json(path,{contentAddressed=false}={}){
 const file=path.startsWith('national/')?join(root,path.slice('national/'.length)):(process.env.QUALITY_FILE??'data/sepa-import-quality.json');
 const bytes=await readFile(file);
 assert.ok(bytes.length<=2_000_000,path+': supera el límite de consulta');
 largestFile=Math.max(largestFile,bytes.length);
 if(contentAddressed)assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0,24)+'.json',path.split('/').at(-1),path+': hash distinto');
 return JSON.parse(bytes.toString('utf8'));
}
try{
 const coverage=await json('national/coverage.json');
 assert.equal(coverage.geographyVerified,true);
 assert.deepEqual(coverage.provinces.map(p=>p.code).sort(),PROVINCES.map(p=>p.code).sort());
 report.generation=coverage.generatedAt;
 const indexes=[];
 const storesSeen=new Set();
 let publishedRecords=0,stores=0,staleStores=0,staleRecords=0;
 for(const province of coverage.provinces){
  const index=await json(`national/${province.code}/index.json`);
  assert.equal(index.generatedAt,coverage.generatedAt,province.code+': generación distinta');
  assert.equal(index.geographyVerified,true);
  assert.equal(index.province.code,province.code);
  assert.equal(index.stores.length,province.stores);
  assert.equal(index.stores.reduce((n,s)=>n+s.records,0),province.records);
  for(const store of index.stores){
   assert.equal(store.provinceCode,province.code);
   assert.equal(provinceFor(store.province)?.code,province.code);
   assert.equal(store.channel,'sucursal');
   assert.ok(Number.isSafeInteger(store.records)&&store.records>0);
   assert.match(store.file,/^[a-f0-9]{24}\.json$/);
   assert.ok(!storesSeen.has(store.externalId),'Sucursal repetida entre índices: '+store.externalId);
   storesSeen.add(store.externalId);
   if(!freshDate(store.sourceDate)){staleStores++;staleRecords+=store.records;}
  }
  indexes.push({province,index});publishedRecords+=province.records;stores+=province.stores;
  report.indexChecks.push({province:province.code,stores:province.stores,records:province.records,indexCountsMatch:true,generationMatches:true});
 }
 const quality=await json('sepa-import-quality.json');
 Object.assign(report,{provinces:indexes.length,stores,publishedRecords,staleStores,staleRecords,catalogScope:quality.catalogScope??'not_declared',categoryFilteredRecords:quality.filteredByCatalogPolicy??null});
 assert.equal(quality.catalogScope,'all_valid_physical_source_products','La publicación aún usa el filtro de categorías anterior');
 assert.equal(quality.filteredByCatalogPolicy,0);
 assert.equal(staleStores,0,'Hay sucursales con fechas vencidas');
 for(const {province,index} of indexes){
  const store=[...index.stores].sort((a,b)=>b.records-a.records)[0];
  if(!store){report.errors.push({province:province.code,error:'Sin sucursales publicadas'});continue;}
  const result={province:province.code,storeId:store.externalId,storeName:[store.chain,store.branch].filter(Boolean).join(' '),expectedRecords:store.records,success:false};
  try{
   const folder=`national/${province.code}/`,header=await json(folder+store.file);
   const shard=await readPriceShard(header,file=>json(folder+file,{contentAddressed:true}),{storeId:store.externalId,generatedAt:index.generatedAt,sourceDate:store.sourceDate,records:store.records});
   assert.equal(new Set(shard.prices.map(row=>String(row[0]))).size,shard.prices.length,'Hay códigos repetidos en la sucursal');
   assert.ok(shard.prices.every(row=>row[6]===store.sourceDate));
   const tail=header.version===2?(await json(folder+header.parts.at(-1).file,{contentAddressed:true})).prices:shard.prices;
   const isControl=row=>row[11]?.catalogPolicy?.quoteEligible===true&&classifyCatalogRecord({product:productFromTuple(row),store:shard.store,price:{listPrice:row[5],validDate:row[6]}}).quoteEligible;
   const row=[...tail].reverse().find(isControl)??shard.prices.find(isControl);
   assert.ok(row,'No hay un producto cotizable de control');
   const controlFromLastPart=header.version===2&&tail.includes(row);
   const url=new URL('/api/public-prices',origin);
   url.search=new URLSearchParams({province:province.code,locality:store.locality,lat:String(store.latitude),lon:String(store.longitude),storeIds:store.externalId,ean:row[0],best:'producto'});
   const response=await fetch(url,{signal:AbortSignal.timeout(45000),redirect:'error'}),body=await response.json();
   assert.equal(response.status,200,'La app devolvió HTTP '+response.status);
   assert.equal(body.coverage?.generatedAt,index.generatedAt,'La app aún no lee esta generación');
   const quote=body.data?.options?.find(q=>q.storeId===store.externalId&&q.ean===row[0]);
   assert.ok(quote,'La app no devolvió el producto de control');
   assert.equal(quote.listPrice,row[5],'El precio de lista no coincide con la fuente');
   if(!quote.appliedPromotion)assert.equal(quote.price,row[5],'Hay un precio distinto sin promoción identificada');
   else assert.ok(Number.isFinite(quote.price)&&quote.price>=0&&quote.price<=quote.listPrice,'El precio promocional es inválido');
   assert.equal(quote.validDate,row[6]);
   assert.equal(quote.address,shard.store.address);assert.equal(quote.province,shard.store.province);
   assert.equal(quote.channel,'sucursal');assert.equal(quote.official,shard.source.official);
   assert.equal(quote.observedAt,shard.source.fileUpdatedAt);
   Object.assign(result,{success:true,allPublishedRecordsReassembled:shard.prices.length,partCount:header.parts?.length??1,controlFromLastPart,listPriceMatchesSource:true,sourceDate:store.sourceDate,official:quote.official,control:{ean:quote.ean,price:quote.price,listPrice:quote.listPrice,promotionApplied:Boolean(quote.appliedPromotion),address:quote.address}});
  }catch(error){result.error=error.message;report.errors.push({province:province.code,storeId:store.externalId,error:error.message});}
  report.branchChecks.push(result);console.log(JSON.stringify(result));
 }
 report.success=report.errors.length===0&&report.branchChecks.length===24&&report.branchChecks.every(b=>b.success);
}catch(error){report.errors.push({error:error.message});}
finally{
 report.largestFileBytes=largestFile;
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,indexChecks:report.indexChecks.length,branchChecks:report.branchChecks.length}));
 if(!report.success)process.exitCode=1;
}
