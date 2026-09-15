import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { normalize } from './price-safety.mjs';
import { emptySepaLine } from './sepa-values.mjs';
import { isUpdateFooter } from './sepa-catalog-controls.mjs';

// Quotes delimit a field only at its start; doubled quotes are literal quotes.
// A null result means a quoted field continues on the next physical line.
function parseRecord(record) {
  const values = []; let value = '', state = 'plain';
  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    if (state === 'quoted') {
      if (char !== '"') value += char;
      else if (record[i + 1] === '"') { value += '"'; i++; }
      else state = 'closed';
    } else if (char === '|') {
      values.push(value); value = ''; state = 'plain';
    } else if (state === 'closed') {
      throw new Error('characters after a closing quote');
    } else if (char === '"' && value === '') state = 'quoted';
    else value += char;
  }
  if (state === 'quoted') return null;
  values.push(value); return values;
}

// Comodín's observed branch CSV has unquoted line breaks immediately before
// delimiters. Recover only an incomplete row with explicit numeric branch IDs
// followed by delimiter-led continuations, and require the exact header width.
// Never apply this exception to commerce or product files, or guess missing data.
export async function readSepaRows(file, handler, {
  allowBranchContinuations = false, onRepair = () => {},
  maxRecordChars = 1024 * 1024, maxRecordLines = 64
} = {}) {
  const stream = createReadStream(file);
  const input = createInterface({ input: stream, crlfDelay: Infinity });
  let headers, record = '', startLine = 0, lineNumber = 0, pending = '', repaired = false;
  const fail = message => new Error(`Invalid SEPA CSV ${file}:${startLine || lineNumber}: ${message}`);
  try {
    for await (const raw of input) {
      lineNumber++;
      const line = lineNumber === 1 ? raw.replace(/^\uFEFF/, '') : raw;
      if (!pending) {
        if (emptySepaLine(line) || isUpdateFooter(line)) continue;
        record = line; startLine = lineNumber; repaired = false;
      } else if (pending === 'quoted') record += '\n' + line;
      else {
        if (!line.startsWith('|')) throw fail('incomplete branch row is not followed by a delimiter continuation');
        record += line; repaired = true;
      }
      if (record.length > maxRecordChars || lineNumber - startLine + 1 > maxRecordLines) throw fail('record exceeds the size or line limit');
      let values;
      try { values = parseRecord(record); } catch (error) { throw fail(error.message); }
      if (!values) { pending = 'quoted'; continue; }
      pending = '';
      if (!headers) {
        headers = values.map(value => normalize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
        if (headers.some(header => !header) || new Set(headers).size !== headers.length) throw fail('empty or duplicate column names');
        continue;
      }
      if (values.length !== headers.length) {
        const branchIds = headers.slice(0, 3).join('|') === 'id_comercio|id_bandera|id_sucursal'
          && values.length >= 3 && values.slice(0, 3).every(value => /^\d+$/.test(value));
        if (allowBranchContinuations && branchIds && values.length < headers.length) { pending = 'branch'; continue; }
        throw fail(`expected ${headers.length} columns, received ${values.length}`);
      }
      if (repaired) await onRepair({ reason: 'unquoted_branch_continuation', startLine, endLine: lineNumber, externalId: values.slice(0, 3).join('|') });
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
      await handler(row);
    }
    if (pending) throw fail(pending === 'quoted' ? 'unterminated quoted field' : 'incomplete branch row at end of file');
    if (!headers) throw fail('missing header');
  } finally { input.close(); stream.destroy(); }
}
