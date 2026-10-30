import {readFile} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';

export async function readSnapshotRecords(path){
 const bytes=await readFile(path),text=bytes.toString('utf8').replace(/^\uFEFF/,'');
 const lines=text.split(/\r?\n/).filter(line=>line.trim());
 const first=lines[0];if(!first)return [];
 const header=JSON.parse(first);
 if(header?.kind!=='san-juan-snapshot')return lines.map(JSON.parse);
 if(lines.length!==1)throw new Error('La cabecera del snapshot contiene registros ajenos');
 const prefix=basename(path)+'.parts/';
 if(header.version!==2||!Number.isSafeInteger(header.records)||header.records<1||!Array.isArray(header.parts)||!header.parts.length||new Set(header.parts.map(p=>p.file)).size!==header.parts.length||header.parts.reduce((n,p)=>n+p.records,0)!==header.records)throw new Error('Índice de snapshot inválido');
 const rows=[],hash=createHash('sha256');
 for(const part of header.parts){
  const suffix=String(part.file??'').slice(prefix.length);
  if(!String(part.file??'').startsWith(prefix)||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/part-\d{6}\.ndjson$/.test(suffix)||!Number.isSafeInteger(part.records)||part.records<1||!Number.isSafeInteger(part.bytes)||part.bytes<1||! /^[a-f0-9]{64}$/.test(part.sha256))throw new Error('Parte de snapshot inválida');
  const body=await readFile(join(dirname(path),part.file));
  if(body.length!==part.bytes||createHash('sha256').update(body).digest('hex')!==part.sha256)throw new Error('La parte de snapshot no conserva su contenido');
  const entries=body.toString('utf8').split('\n').filter(line=>line.trim()).map(JSON.parse);
  if(entries.length!==part.records)throw new Error('La cantidad de registros del snapshot no coincide');
  rows.push(...entries);hash.update(body);
 }
 if(rows.length!==header.records||hash.digest('hex')!==header.sha256)throw new Error('El snapshot está incompleto');
 return rows;
}
export async function countSnapshotRecords(path){return (await readSnapshotRecords(path)).length;}
