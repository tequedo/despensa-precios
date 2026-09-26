import test from 'node:test';
import assert from 'node:assert/strict';
import { priceUpdateDetails } from '../price-update-message.mjs';
const coverage = { geographyVerified: true, provinces: [{ stores: 3, records: 100 }] };
const provenance = { status: 'replica_integrity_checked', sourceType: 'replica',
  officialResource: { last_modified: '2026-09-22T16:20:00Z' } };
test('successful import of an old replica never claims prices are new today', () => {
  const message = priceUpdateDetails(coverage, provenance, new Date('2026-09-25T00:00:00Z')).join('\n');
  assert.match(message, /22\/9\/26/);
  assert.match(message, /no acredita precios nuevos del día/);
  assert.match(message, /réplica de terceros/);
});
test('fresh official acquisition identifies the real source and keeps branch validity distinct', () => {
  const message = priceUpdateDetails(coverage, { ...provenance, status: 'official_original_integrity_checked',
    sourceType: 'official_original' }, new Date('2026-09-23T00:00:00Z')).join('\n');
  assert.match(message, /descarga directa del catálogo oficial/);
  assert.match(message, /cada sucursal y producto/);
  assert.doesNotMatch(message, /ATENCIÓN/);
});
test('failed acquisitions or missing dates cannot be announced as success', () => {
  assert.throws(() => priceUpdateDetails(coverage, { ...provenance, status: 'failed' }), /sin adquisición validada/);
  assert.throws(() => priceUpdateDetails(coverage, { ...provenance, officialResource: {} }), /Fecha real/);
});
