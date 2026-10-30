import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readPriceShard} from '../price-shards.mjs';
import {freshDate} from '../price-safety.mjs';
import {productFromTuple} from '../catalog-policy/lib/product-identity.mjs';
import {classifyCatalogRecord} from '../catalog-policy/lib/catalog-policy.mjs';

const origin=process.env.SITE_ORIGIN??'https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site';
const folder=join(process.env.NATIONAL_DATA_DIR??'data/national','AR-C');
const output=process.env.LARGE_CATALOG_REPORT??'data/large-catalog-smoke-report.json';
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const report={checkedAt:new Date().toISOString(),success:false,productionQuoteConfirmed:false};
try{
 const index=await json(join(folder,'index.json'));
 const store=index.stores.find(s=>s.externalId==='12|1|108');assert.ok(store,'Falta COTO Cabildo en la publicación');
 Object.assign(report,{generation:index.generatedAt,sourceDate:store.sourceDate,storeId:store.externalId,publishedRecords:store.records});
 assert.ok(freshDate(store.sourceDate),'El catálogo de control no tiene precios vigentes');
 const header=await json(join(folder,store.file)),partSizes=[];
 const shard=await readPriceShard(header,async file=>{const bytes=await readFile(join(folder,file));assert.ok(bytes.length<=2_000_000,'Una parte excede el límite de bytes');partSizes.push(bytes.length);return JSON.parse(bytes);},{storeId:store.externalId,generatedAt:index.generatedAt,sourceDate:store.sourceDate,records:store.records});
 const tail=header.version===2?(await json(join(folder,header.parts.at(-1).file))).prices:shard.prices;
 const candidates=[...tail].reverse().filter(row=>row[11]?.catalogPolicy?.quoteEligible===true&&classifyCatalogRecord({product:productFromTuple(row),store:shard.store,price:{listPrice:row[5],validDate:row[6]}}).quoteEligible);
 const row=candidates.find(row=>row[9]?.barcodeStatus!=='valid_format_and_checksum')??candidates[0];
 assert.ok(row,'La última parte no contiene un registro cotizable de control');
 const url=new URL('/api/public-prices',origin);
 url.search=new URLSearchParams({province:'AR-C',locality:store.locality,lat:String(store.latitude),lon:String(store.longitude),storeIds:store.externalId,ean:row[0],best:'producto'});
 let body;
 for(let attempt=0;attempt<13;attempt++){
  const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});body=await response.json();
  if(response.status===200&&body.coverage?.generatedAt===index.generatedAt)break;
  assert.ok([200,503].includes(response.status),'La consulta devolvió HTTP '+response.status);
  if(attempt===12)throw new Error('La app no leyó la generación publicada del catálogo grande');
  await new Promise(resolve=>setTimeout(resolve,15000));
 }
 assert.equal(body.coverage.generatedAt,index.generatedAt);
 const quote=body.data?.options?.find(q=>q.storeId===store.externalId&&q.ean===row[0]);
 assert.ok(quote,'No se recibió el producto de la última parte');
 assert.equal(quote.listPrice,row[5],'El importe no coincide con la fuente');
 if(!quote.appliedPromotion)assert.equal(quote.price,row[5],'Hay un precio distinto sin promoción identificada');
 else assert.ok(Number.isFinite(quote.price)&&quote.price>=0&&quote.price<=quote.listPrice,'El precio promocional es inválido');
 assert.equal(quote.validDate,row[6],'La fecha no coincide con la fuente');
 assert.equal(quote.address,shard.store.address);assert.equal(quote.province,shard.store.province);
 assert.equal(quote.channel,'sucursal','La cotización debe pertenecer al canal presencial');
 assert.equal(quote.observedAt,shard.source.fileUpdatedAt);assert.equal(quote.official,shard.source.official);
 let quality;try{quality=await json(process.env.QUALITY_FILE??'data/sepa-import-quality.json');}catch{}
 Object.assign(report,{success:true,productionQuoteConfirmed:true,allPublishedRecordsReassembled:shard.prices.length,partCount:header.parts?.length??1,partSizes,controlFromLastPart:header.version===2,catalogScope:quality?.catalogScope??(quality?.filteredByCatalogPolicy>0?'legacy_filtered':'not_declared'),categoryFilteredRecords:quality?.filteredByCatalogPolicy??null,control:{ean:quote.ean,price:quote.price,listPrice:quote.listPrice,promotionApplied:Boolean(quote.appliedPromotion),validDate:quote.validDate,observedAt:quote.observedAt,address:quote.address,channel:quote.channel,official:quote.official}});
}catch(error){report.error=error.message;process.exitCode=1;}
finally{await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
