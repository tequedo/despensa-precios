import {mkdir,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

// Audit records are independent of quotation files. Rotate on UTF-8 bytes,
// retain every record, and describe the complete sequence in a small index.
export async function ndjsonParts(directory,{maxBytes=2_000_000,context={}}={}){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new Error('Límite de partes inválido');
 await rm(directory,{recursive:true,force:true});await mkdir(directory,{recursive:true});
 let lines=[],bytes=0,records=0,totalBytes=0,closed=false,pending=Promise.resolve(),manifest;
 const parts=[];
 const flush=async()=>{
  if(!lines.length)return;
  const body=lines.join(''),file='part-'+String(parts.length+1).padStart(6,'0')+'.ndjson';
  await writeFile(join(directory,file),body);
  parts.push({file,records:lines.length,bytes,sha256:createHash('sha256').update(body).digest('hex'),...(bytes>maxBytes?{oversizedRecord:true}:{})});
  lines=[];bytes=0;
 };
 return {
  append(record){
   if(closed)throw new Error('El informe ya está cerrado');
   const line=JSON.stringify(record)+'\n',size=Buffer.byteLength(line);
   pending=pending.then(async()=>{
    if(bytes&&bytes+size>maxBytes)await flush();
    lines.push(line);bytes+=size;totalBytes+=size;records++;
   });
   return pending;
  },
  async close({complete=true}={}){
   if(closed)return manifest;
   closed=true;await pending;await flush();
   manifest={schemaVersion:1,format:'ndjson',complete,records,bytes:totalBytes,context,parts};
   await writeFile(join(directory,'index.json'),JSON.stringify(manifest,null,2)+'\n');
   return manifest;
  }
 };
}
