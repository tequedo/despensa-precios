import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSepaRows } from '../sepa-csv.mjs';

async function read(text, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-csv-'));
  try {
    const file = join(dir, 'test.csv'), rows = [];
    await writeFile(file, text);
    await readSepaRows(file, row => rows.push(row), options);
    return rows;
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('quoted pipes, doubled quotes and multiline fields stay in one logical record', async () => {
  const rows = await read('\uFEFFid|description|price\r\n1|"Aceite | marca ""A""\r\nUltima actualizacion: texto dentro del producto"|1900\r\n\u0000\r\nUltima actualizacion: 2026-09-14T09:30:00-03:00\r\n');
  assert.deepEqual(rows, [{id:'1', description:'Aceite | marca "A"\nUltima actualizacion: texto dentro del producto', price:'1900'}]);
});

test('the observed Comodín record recovers its branch, coordinates and hours with an audit span', async () => {
  const rows = [], repairs = [];
  // First branch from the 2026-09-14 replica, archive SHA256 16193a95…0eaee.
  await readSepaRows(new URL('fixtures/sepa-comodin-multiline.csv', import.meta.url), row => rows.push(row), {allowBranchContinuations:true, onRepair:repair => repairs.push(repair)});
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.id_comercio, '6'); assert.equal(row.id_sucursal, '1');
  assert.equal(row.sucursales_nombre, 'Comodin 1'); assert.equal(row.sucursales_tipo, 'Hipermercado');
  assert.equal(row.sucursales_latitud, '-24.183838'); assert.equal(row.sucursales_longitud, '-65.304235');
  assert.equal(row.sucursales_provincia, 'AR-Y'); assert.equal(row.sucursales_localidad, 'San Salvador de Jujuy');
  assert.equal(row.sucursales_jueves_horario_atencion, 'cerrado'); assert.equal(row.sucursales_domingo_horario_atencion, '09:00 a 14:00');
  assert.deepEqual(repairs, [{reason:'unquoted_branch_continuation', startLine:2, endLine:4, externalId:'6|1|1'}]);
});

test('ambiguous or excessive records fail instead of shifting columns or joining another branch', async () => {
  const header = 'id_comercio|id_bandera|id_sucursal|name|province\n';
  for (const text of [header+'6|1|1|Centro\n6|1|2|Norte|AR-Y\n', header+'6|1|1|Centro\n', header+'6|1|1|Centro\n|AR-Y|extra\n']) {
    await assert.rejects(read(text, {allowBranchContinuations:true}), /Invalid SEPA CSV/);
  }
  await assert.rejects(read(header+'6|1|1|Centro\n|AR-Y\n'), /expected 5 columns/);
  await assert.rejects(read('id|name\n1|"sin cierre\n'), /unterminated quoted/);
  await assert.rejects(read('id|name\n1|"cerrado"extra\n'), /closing quote/);
  await assert.rejects(read('id|name\n1|"a\nb\nc"\n', {maxRecordLines:2}), /line limit/);
  await assert.rejects(read('id|name\n1|texto demasiado largo\n', {maxRecordChars:15}), /size or line limit/);
  await assert.rejects(read('id|id\n1|2\n'), /duplicate column/);
});
