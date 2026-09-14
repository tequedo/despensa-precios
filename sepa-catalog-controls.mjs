import { open } from 'node:fs/promises';
import { argentinaDate, freshDate, isoDate, normalize } from './price-safety.mjs';
import { emptySepaLine } from './sepa-values.mjs';

// SEPA defines Web as a branch type, not a physical shop at its postal address.
export function branchChannel(type) {
  const value = normalize(type);
  if (value === 'web') return 'online';
  if (['hipermercado', 'supermercado', 'autoservicio', 'tradicional'].includes(value)) return 'sucursal';
  return 'unknown';
}

export const isUpdateFooter = line => /^ultima actualizacion\s*:/.test(String(line ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());

export function fileDateEvidence(line, sourceModified, now = Date.now()) {
  if (!isUpdateFooter(line)) return { accepted: false, reason: 'missing_product_file_date' };
  const raw = String(line).slice(String(line).indexOf(':') + 1).trim();
  // Accept the observed -0300 variant while retaining the original text.
  const value = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  if (!/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(value) || !isoDate(value)) {
    return { accepted: false, reason: 'invalid_product_file_date', raw };
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return { accepted: false, reason: 'invalid_product_file_date', raw };
  const date = argentinaDate(time);
  const evidence = { raw, updatedAt: new Date(time).toISOString(), date, dateBasis: 'product_file_footer' };
  const publicationDate = isoDate(sourceModified);
  if (!publicationDate || time > +new Date(now) || date > publicationDate) return { ...evidence, accepted: false, reason: 'future_product_file_date' };
  if (!freshDate(date, +new Date(now))) return { ...evidence, accepted: false, reason: 'stale_product_file_date' };
  return { ...evidence, accepted: true };
}

// Read only the tail: some product files exceed a gigabyte. Do this before
// accepting any rows, so a recent archive cannot hide an old inner CSV.
export async function productFileEvidence(file, sourceModified, now = Date.now()) {
  const handle = await open(file, 'r');
  try {
    const { size } = await handle.stat();
    const buffer = Buffer.alloc(Math.min(size, 65536));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, size - buffer.length);
    const lines = buffer.subarray(0, bytesRead).toString('utf8').split(/\r?\n/);
    const last = lines.findLast(line => !emptySepaLine(line));
    return fileDateEvidence(last ?? '', sourceModified, now);
  } finally { await handle.close(); }
}
