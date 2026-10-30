import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import './catalog-policy/scripts/verify-catalog-policy.mjs';
import {catalogPolicyReport} from './catalog-policy/lib/catalog-policy.mjs';
import {mergeRecordIdentity} from './source-identity-duplicates.mjs';

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
  const rows = [...unique.values()], body = rows.map(row=>JSON.stringify(row)).join('\n') + (rows.length?'\n':'');
  const catalogPolicy=catalogPolicyReport(rows);
  const hash = value => createHash('sha256').update(value).digest('hex');
  const temporary = path + '.pending-' + randomUUID();
  try {
    await writeFile(temporary,body);
    if (hash(await readFile(temporary)) !== hash(body)) throw new Error('La escritura de San Juan no conservó el contenido completo');
    await rename(temporary,path);
  } finally { await rm(temporary,{force:true}); }
  return { rows, sha256:hash(body),catalogPolicy };
}
