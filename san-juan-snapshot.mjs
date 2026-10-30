import { readFile, writeFile, rename, rm, mkdir, readdir } from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import './catalog-policy/scripts/verify-catalog-policy.mjs';
import {catalogPolicyReport} from './catalog-policy/lib/catalog-policy.mjs';
import {mergeRecordIdentity} from './source-identity-duplicates.mjs';
import {ndjsonParts} from './ndjson-parts.mjs';

export async function writeSanJuanSnapshot(path, records, expectedRecords) {
  const unique = new Map();
  for (const record of records) {
    if (record.store.province !== 'San Juan') throw new Error('La salida de San Juan contiene otra provincia');
    const key = [record.store.externalId, record.product.ean, record.price.validDate].join('|');
    const old = unique.get(key);
    if (old && JSON.stringify([old.product,old.price]) !== JSON.stringify([record.product,record.price])) {
      const reconciled=mergeRecordIdentity(old,record);
      if(!reconciled)throw new Error('Precios o identidades contradictorios para la misma sucursal, producto y fecha');
      unique.set(key,reconciled);continue;
    }
    unique.set(key,record);
  }
  if (expectedRecords !== undefined && unique.size !== expectedRecords) throw new Error('El archivo de San Juan no coincide con las referencias del catálogo nacional');
  const rows = [...unique.values()];
  const catalogPolicy=catalogPolicyReport(rows);
  const hash=createHash('sha256');
  const temporary = path + '.pending-' + randomUUID();
  const base=path+'.parts',generation=randomUUID(),partDirectory=join(base,generation);
  await mkdir(base,{recursive:true});
  let writer,smallRows=[],smallLines=[],bytes=0,published=false,sha256;
  try {
    for(const row of rows){
      const line=JSON.stringify(row)+'\n';hash.update(line);bytes+=Buffer.byteLength(line);
      if(!writer&&bytes<=2_000_000){smallRows.push(row);smallLines.push(line);continue;}
      if(!writer){writer=await ndjsonParts(partDirectory,{context:{scope:'San Juan'}});for(const prior of smallRows)await writer.append(prior);smallRows=[];smallLines=[];}
      await writer.append(row);
    }
    sha256=hash.digest('hex');
    const parts=writer?(await writer.close()).parts.map(part=>({...part,file:basename(base)+'/'+generation+'/'+part.file})):[];
    const manifest={kind:'san-juan-snapshot',version:2,records:rows.length,bytes,sha256,parts,sourceFieldsPreserved:true};
    const body=writer?JSON.stringify(manifest)+'\n':smallLines.join('');
    await writeFile(temporary,body);
    if(createHash('sha256').update(await readFile(temporary)).digest('hex')!==createHash('sha256').update(body).digest('hex'))throw new Error('La escritura de San Juan no conservó el contenido completo');
    await writeFile(join(base,'index.json'),JSON.stringify({...manifest,storage:writer?'parts':'inline'})+'\n');
    await rename(temporary,path);published=true;
    for(const entry of await readdir(base,{withFileTypes:true}))if(entry.isDirectory()&&/^[a-f0-9-]{36}$/.test(entry.name)&&(!writer||entry.name!==generation))await rm(join(base,entry.name),{recursive:true,force:true});
  } finally { await rm(temporary,{force:true});if(!published&&writer)await rm(partDirectory,{recursive:true,force:true}); }
  return { rows, sha256,catalogPolicy };
}
