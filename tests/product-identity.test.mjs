import test from 'node:test';
import assert from 'node:assert/strict';
import { barcodeIdentity, sepaProductIdentity } from '../product-identity.mjs';
const row = (id, flag='1', commerce='10') => ({id_comercio:commerce,id_bandera:'1',id_producto:id,productos_ean:flag});
test('lee el código desde id_producto y conserva referencias de compras existentes', () => {
  const product = sepaProductIdentity(row('7790895000997'));
  assert.equal(product.ean, 'sepa:10:1:7790895000997');
  assert.equal(product.barcode, '7790895000997');
  assert.equal(product.gtin, '07790895000997');
  assert.equal(product.gtin, sepaProductIdentity(row('7790895000997','1','11')).gtin);
});
test('un ID interno no se convierte en GTIN aunque sus dígitos sean válidos', () => {
  const product = sepaProductIdentity(row('7790895000997','0'));
  assert.equal(product.barcodeStatus, 'internal');assert.equal(product.gtin, undefined);
  assert.notEqual(product.ean, sepaProductIdentity(row('7790895000997','0','11')).ean);
});
test('no repara códigos, no elimina ceros y rechaza indicadores o IDs ausentes', () => {
  assert.equal(barcodeIdentity('036000291452').gtin, '00036000291452');
  for(const value of ['7790895000990','779-0895000997','00000000','1','1e12'])assert.equal(barcodeIdentity(value).status,'invalid');
  assert.equal(sepaProductIdentity(row('7790895000990')).barcodeStatus,'invalid');
  assert.equal(sepaProductIdentity(row('','1')).accepted,false);
  assert.equal(sepaProductIdentity(row('7790895000997','7790895000997')).accepted,false);
});
test('códigos de circulación restringida no se cruzan entre comercios', () => {
  for(const code of ['2000000000008','0200000000004','0400000000008','20000004']){
    assert.equal(barcodeIdentity(code).status,'restricted',code);
    assert.equal(barcodeIdentity(code).gtin,undefined);
  }
});
