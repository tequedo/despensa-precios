import { appendFile, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PROVINCES, provinceFor, isoDate } from './price-safety.mjs';

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
      const province=provinceFor(record.store.province);if(!province)throw new Error('Provincia desconocida');
      const id=createHash('sha256').update(record.store.externalId).digest('hex').slice(0,24);
      stores.set(id,{...record.store,province:province.name,provinceCode:province.code,source:record.source});
      const p=record.product,v=record.price;
      const tuple=[p.ean,p.name,p.brand??'',p.presentation??'',p.referenceUnit??'',v.listPrice,v.validDate,v.productUpdatedAt??null];
      // Promotional text remains a candidate until independent, scoped evidence exists.
      if(v.promoPrice||v.promoConditions)tuple.push({promoPrice:v.promoPrice,promoConditions:v.promoConditions,promoKind:v.promoKind,buyQuantity:v.buyQuantity,payQuantity:v.payQuantity,discountPercent:v.discountPercent,requiredBenefit:v.requiredBenefit,discountCap:v.discountCap});
      const lines=buffers.get(id)??[];lines.push(JSON.stringify(tuple));buffers.set(id,lines);
      if(++buffered>=2000)await flush();
    },
    async finish(){
      await flush();
      await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
      const byProvince=new Map(PROVINCES.map(p=>[p.code,[]]));
      for(const [id,store] of stores){
        const rows=(await readFile(join(temporary,id+'.ndjson'),'utf8')).trim().split('\n').map(JSON.parse);
        const latest=new Map();for(const row of rows){const old=latest.get(row[0]);if(!old||row[6]>old[6])latest.set(row[0],row);}
        const prices=[...latest.values()];
        const {source,...branch}=store;
        const sourceDate=isoDate(source.modified);if(!sourceDate)throw new Error('Fecha del archivo SEPA inválida');
        const file=id+'.json',folder=join(root,store.provinceCode);await mkdir(folder,{recursive:true});
        const payload=JSON.stringify({version:1,generatedAt,sourceDate,source,store:branch,prices});
        if(Buffer.byteLength(payload)>2_000_000)throw new Error('La sucursal supera el límite de consulta: '+store.externalId);
        await writeFile(join(folder,file),payload+'\n');
        byProvince.get(store.provinceCode).push({...branch,file,records:prices.length,sourceDate});
      }
      const coverage=[];
      for(const p of PROVINCES){
        const branches=byProvince.get(p.code).sort((a,b)=>a.locality.localeCompare(b.locality)||a.chain.localeCompare(b.chain));
        const entry={...p,stores:branches.length,records:branches.reduce((n,s)=>n+s.records,0),sourceDate:branches[0]?.sourceDate??null};
        coverage.push(entry);await mkdir(join(root,p.code),{recursive:true});
        await writeFile(join(root,p.code,'index.json'),JSON.stringify({version:1,generatedAt,province:p,stores:branches})+'\n');
      }
      await writeFile(join(root,'coverage.json'),JSON.stringify({version:1,generatedAt,scope:'Argentina',provinces:coverage})+'\n');
      console.log(JSON.stringify({nationalCoverage:coverage}));
      return coverage;
    }
  };
}
