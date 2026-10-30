import { appendFile, mkdir, readFile, writeFile, rm, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { PROVINCES, provinceFor, isoDate } from './price-safety.mjs';
import { branchChannel } from './sepa-catalog-controls.mjs';
import './catalog-policy/scripts/verify-catalog-policy.mjs';
import {classifyCatalogRecord,catalogPolicyVersion} from './catalog-policy/lib/catalog-policy.mjs';
import {mergeTupleIdentity} from './source-identity-duplicates.mjs';
import {ndjsonParts} from './ndjson-parts.mjs';

const MAX_SHARD_BYTES=2_000_000;
async function writeStorePrices(folder,file,header,prices){
  const original=JSON.stringify({...header,prices})+'\n';
  if(Buffer.byteLength(original)<=MAX_SHARD_BYTES){await writeFile(join(folder,file),original);return;}
  const parts=[];
  const partHeader={version:1,kind:'price-part',generatedAt:header.generatedAt,sourceDate:header.sourceDate,storeId:header.store.externalId,prices:[]};
  const baseBytes=Buffer.byteLength(JSON.stringify(partHeader)+'\n');
  let rows=[],bytes=baseBytes;
  const flush=async()=>{
    if(!rows.length)return;
    const payload=JSON.stringify({...partHeader,prices:rows})+'\n';
    const name=createHash('sha256').update(payload).digest('hex').slice(0,24)+'.json';
    if(Buffer.byteLength(payload)>MAX_SHARD_BYTES)throw new Error('Una parte de sucursal supera el límite de consulta');
    await writeFile(join(folder,name),payload);parts.push({file:name,records:rows.length});
    rows=[];bytes=baseBytes;
  };
  for(const row of prices){
    const rowBytes=Buffer.byteLength(JSON.stringify(row));
    if(baseBytes+rowBytes>MAX_SHARD_BYTES)throw new Error('Un producto supera el límite de consulta: '+header.store.externalId+' / '+row[0]);
    if(bytes+rowBytes+(rows.length?1:0)>MAX_SHARD_BYTES)await flush();
    bytes+=rowBytes+(rows.length?1:0);rows.push(row);
  }
  await flush();
  const manifest=JSON.stringify({...header,version:2,records:prices.length,parts})+'\n';
  if(Buffer.byteLength(manifest)>MAX_SHARD_BYTES)throw new Error('El índice de sucursal supera el límite de consulta');
  await writeFile(join(folder,file),manifest);
}

// Files are bounded by branch, not by province. No nationwide blob is sent to a phone.
export async function nationalExporter(root, temporary) {
  const stores=new Map(), buffers=new Map(); let buffered=0;
  const generatedAt=new Date().toISOString();
  await mkdir(temporary,{recursive:true});
  async function flush(){
    for(const [id,lines] of buffers)await appendFile(join(temporary,id+'.ndjson'),lines.join('\n')+'\n');
    buffers.clear(); buffered=0;
  }
  return {
    async add(record){
      if(record.price.channel==='online'||record.store.channel==='online'||branchChannel(record.store.type)==='online')throw new Error('Una sucursal Web no pertenece al catálogo presencial');
      const province=provinceFor(record.store.province);if(!province)throw new Error('Provincia desconocida');
      const id=createHash('sha256').update(record.store.externalId).digest('hex').slice(0,24);
      const priorStore=stores.get(id);
      if(priorStore&&(priorStore.source.priceDate!==record.source.priceDate||priorStore.provinceCode!==province.code))throw new Error('La misma sucursal tiene fechas de archivo o provincias contradictorias');
      stores.set(id,{...record.store,province:province.name,provinceCode:province.code,source:record.source});
      const p=record.product,v=record.price;
      const tuple=[p.ean,p.name,p.brand??'',p.presentation??'',p.referenceUnit??'',v.listPrice,v.validDate,v.productUpdatedAt??null];
      // Keep legacy promo1 at slot 8; the complete array preserves promo2 without stacking offers.
      const offers = v.promotions ?? [];
      if(v.promoPrice || v.promoConditions || offers.length) tuple[8] = {promoPrice:v.promoPrice,promoConditions:v.promoConditions,promoKind:v.promoKind,buyQuantity:v.buyQuantity,payQuantity:v.payQuantity,discountPercent:v.discountPercent,requiredBenefit:v.requiredBenefit,discountCap:v.discountCap,...(offers.length ? {promotions:offers} : {})};
      // Stable product IDs and existing reader positions remain unchanged.
      if(p.barcodeStatus) tuple[9] = {barcode:p.barcode??null,barcodeStatus:p.barcodeStatus,...(p.sourceProductId?{sourceProductId:p.sourceProductId}:{}),...(p.sourceEanIndicator!==undefined?{sourceEanIndicator:p.sourceEanIndicator}:{}),...(p.sourceIdentityVariants?{sourceIdentityVariants:p.sourceIdentityVariants}:{})};
      if(v.referencePrice) tuple[10] = {referencePrice:v.referencePrice};
      // Optional metadata preserves every existing source tuple position.
      tuple[11]={catalogPolicy:classifyCatalogRecord(record)};
      const lines=buffers.get(id)??[];lines.push(JSON.stringify(tuple));buffers.set(id,lines);
      if(++buffered>=2000)await flush();
    },
    async finish(){
      await flush();
      const staging=root+'.pending-'+randomUUID(),backup=root+'.previous-'+randomUUID();
      await mkdir(staging,{recursive:true});
      let backedUp=false;
      try {
      const byProvince=new Map(PROVINCES.map(p=>[p.code,[]]));
      const policyReports=new Map(PROVINCES.map(p=>[p.code,{records:0,quoteEligible:0,quarantined:0,needsMeaningReview:0,byReason:{},exceptions:[]} ]));
      for(const [id,store] of stores){
        const rows=(await readFile(join(temporary,id+'.ndjson'),'utf8')).trim().split('\n').map(JSON.parse);
        const latest=new Map();for(const row of rows){
          const old=latest.get(row[0]);
          if(old&&row[6]===old[6]&&JSON.stringify(row)!==JSON.stringify(old)){
            const reconciled=mergeTupleIdentity(old,row);
            if(!reconciled)throw new Error('Precios o identidades contradictorios: '+store.externalId+' / '+row[0]+' / '+row[6]);
            latest.set(row[0],reconciled);continue;
          }
          if(!old||row[6]>old[6])latest.set(row[0],row);
        }
        const prices=[...latest.values()];
        const report=policyReports.get(store.provinceCode);
        for(const row of prices){
          const policy=row[11]?.catalogPolicy;
          if(policy?.version!==catalogPolicyVersion||typeof policy.quoteEligible!=='boolean')throw new Error('Un registro llegó sin la política de catálogo vigente');
          report.records++;if(policy.quoteEligible)report.quoteEligible++;else{report.quarantined++;report.byReason[policy.reviewCode]=(report.byReason[policy.reviewCode]??0)+1;report.exceptions.push({storeId:store.externalId,id:row[0],sourceDate:row[6],reason:policy.reviewCode});}
          if(policy.needsMeaningReview)report.needsMeaningReview++;
        }
        const {source,...branch}=store;
        const sourceDate=isoDate(source.priceDate??source.modified);if(!sourceDate)throw new Error('Fecha del archivo SEPA inválida');
        if(prices.some(row=>row[6]!==sourceDate))throw new Error('La fecha del precio no coincide con la de su archivo');
        const file=id+'.json',folder=join(staging,store.provinceCode);await mkdir(folder,{recursive:true});
        await writeStorePrices(folder,file,{version:1,generatedAt,sourceDate,source,catalogPolicyVersion,store:branch},prices);
        byProvince.get(store.provinceCode).push({...branch,file,records:prices.length,sourceDate});
      }
      const coverage=[];
      for(const p of PROVINCES){
        const branches=byProvince.get(p.code).sort((a,b)=>a.locality.localeCompare(b.locality)||a.chain.localeCompare(b.chain));
        const dates=branches.map(s=>s.sourceDate).sort();
        const entry={...p,stores:branches.length,records:branches.reduce((n,s)=>n+s.records,0),sourceDate:dates[0]??null,latestSourceDate:dates.at(-1)??null};
        coverage.push(entry);await mkdir(join(staging,p.code),{recursive:true});
        await writeFile(join(staging,p.code,'index.json'),JSON.stringify({version:1,generatedAt,province:p,stores:branches})+'\n');
      }
      await writeFile(join(staging,'coverage.json'),JSON.stringify({version:1,generatedAt,scope:'Argentina',provinces:coverage})+'\n');
      const summaries={};
      for(const [code,report] of policyReports){
        const {exceptions,...summary}=report;
        let exceptionParts=[];
        if(exceptions.length){
          const relative='catalog-audits/'+code;
          const writer=await ndjsonParts(join(staging,relative),{context:{province:code,generatedAt,catalogPolicyVersion}});
          for(const entry of exceptions)await writer.append(entry);
          const manifest=await writer.close();
          exceptionParts=manifest.parts.map(part=>({...part,file:relative+'/'+part.file}));
        }
        summaries[code]={...summary,exceptionsCount:exceptions.length,exceptionParts,...(exceptions.length<=100?{exceptions}:{exceptionsStoredInParts:true})};
      }
      await writeFile(join(staging,'catalog-policy-report.json'),JSON.stringify({schemaVersion:2,version:catalogPolicyVersion,generatedAt,sourceFieldsPreserved:true,exceptionStorage:'bounded_ndjson_parts',provinces:summaries},null,2)+'\n');
      try { await rename(root,backup);backedUp=true; } catch(error) { if(error.code!=='ENOENT')throw error; }
      try { await rename(staging,root); } catch(error) { if(backedUp){await rename(backup,root);backedUp=false;}throw error; }
      if(backedUp){await rm(backup,{recursive:true,force:true});backedUp=false;}
      console.log(JSON.stringify({nationalCoverage:coverage}));
      return coverage;
      } finally { await rm(staging,{recursive:true,force:true}); }
    }
  };
}
