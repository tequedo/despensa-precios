import test from 'node:test';
import assert from 'node:assert/strict';
import { sepaAmount, emptySepaLine } from '../sepa-values.mjs';
test('interpreta decimales explícitos y rechaza números ambiguos o no positivos',()=>{
  for(const [raw,expected] of [['1234.56',1234.56],['1234,56',1234.56],['  10 ',10],['.50',0.5]])assert.equal(sepaAmount(raw),expected);
  for(const raw of ['', ' ', '0', '.00', '-12', '1.234,56', '1,234.56', '1,234', '1.234', '1e3', '0x10', 'Infinity', '$120', true, null])assert.equal(sepaAmount(raw),undefined,String(raw));
});
test('ignora renglones vacíos y con NUL sin eliminar productos',()=>{
  for(const raw of ['', '  ', '\u0000','\uFEFF \u0000'])assert.equal(emptySepaLine(raw),true);
  assert.equal(emptySepaLine('1|2|Leche'),false);
});
