import assert from 'node:assert/strict';
import { freshDate, isoDate } from '../price-safety.mjs';

// An absent retailer is acceptable only when this generation documents why
// its own product-file date was rejected. Missing evidence remains a failure.
export function dehezaExpectation(index, quality, now = Date.now()) {
  if (index.stores.some(store => String(store.externalId).startsWith('3|'))) {
    return { status: 'quote_required' };
  }
  assert.equal(isoDate(quality.checkedAt), isoDate(index.generatedAt), 'Deheza: el diagnóstico no corresponde al día de la generación');
  const files = quality.productFiles.filter(file => /comercio-sepa-3_/.test(file.file));
  assert.ok(files.length, 'Deheza: falta evidencia de su ausencia');
  for (const file of files) {
    assert.equal(file.accepted, false, 'Deheza: una fuente aceptada desapareció del catálogo');
    assert.equal(file.reason, 'stale_product_file_date', 'Deheza: exclusión sin causa de antigüedad comprobada');
    assert.ok(isoDate(file.date), 'Deheza: fecha interna inválida');
    assert.ok(!freshDate(file.date, now), 'Deheza: se excluyó una fuente vigente');
  }
  return { status: 'stale_source_excluded', sourceDates: [...new Set(files.map(file => file.date))] };
}

export function verifyStaleDeheza(body, expectation) {
  assert.equal(expectation.status, 'stale_source_excluded');
  assert.deepEqual(body.data.options, [], 'Deheza: reaparecieron precios sin fuente vigente');
  return { label: 'Fecha interna de Deheza', generation: body.coverage.generatedAt, ...expectation, excludedAsExpected: true };
}
