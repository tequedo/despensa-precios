import { appendFile, mkdir, readFile, writeFile, rm, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { PROVINCES, provinceFor, isoDate } from './price-safety.mjs';
import { branchChannel } from './sepa-catalog-controls.mjs';

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
      // Promotional text remains a candidate until independent, scoped evidence exists.
      if(v.promoPrice||v.promoConditions)tuple.push({promoPrice:v.promoPrice,promoConditions:v.promoConditions,promoKind:v.promoKind,buyQuantity:v.buyQuantity,payQuantity:v.payQuantity,discountPercent:v.discountPercent,requiredBenefit:v.requiredBenefit,discountCap:v.discountCap});
      // Slot 8 remains promotions. Slot 9 adds identity without changing stable IDs or v1 readers.
      if(p.barcodeStatus){if(tuple.length===8)tuple.push(null);tuple.push({barcode:p.barcode??null,barcodeStatus:p.barcodeStatus});}
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
      for(const [id,store] of stores){
        const rows=(await readFile(join(temporary,id+'.ndjson'),'utf8')).trim().split('\n').map(JSON.parse);
        const latest=new Map();for(const row of rows){
          const old=latest.get(row[0]);
          if(old&&row[6]===old[6]&&JSON.stringify(row)!==JSON.stringify(old))throw new Error('Precios o identidades contradictorios: '+store.externalId+' / '+row[0]+' / '+row[6]);
          if(!old||row[6]>old[6])latest.set(row[0],row);
        }
        const prices=[...latest.values()];
        const {source,...branch}=store;
        const sourceDate=isoDate(source.priceDate??source.modified);if(!sourceDate)throw new Error('Fecha del archivo SEPA inválida');
        if(prices.some(row=>row[6]!==sourceDate))throw new Error('La fecha del precio no coincide con la de su archivo');
        const file=id+'.json',folder=join(staging,store.provinceCode);await mkdir(folder,{recursive:true});
        const payload=JSON.stringify({version:1,generatedAt,sourceDate,source,store:branch,prices});
        if(Buffer.byteLength(payload)>2_000_000)throw new Error('La sucursal supera el límite de consulta: '+store.externalId);
        await writeFile(join(folder,file),payload+'\n');
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
      try { await rename(root,backup);backedUp=true; } catch(error) { if(error.code!=='ENOENT')throw error; }
      try { await rename(staging,root); } catch(error) { if(backedUp){await rename(backup,root);backedUp=false;}throw error; }
      if(backedUp){await rm(backup,{recursive:true,force:true});backedUp=false;}
      console.log(JSON.stringify({nationalCoverage:coverage}));
      return coverage;
      } finally { await rm(staging,{recursive:true,force:true}); }
    }
  };
}
