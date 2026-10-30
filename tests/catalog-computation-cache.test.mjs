import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,sizes,packageEvidence} from '../catalog-policy/lib/price-safety.mjs';
import {barcodeIdentity} from '../catalog-policy/lib/product-identity.mjs';

test('los cálculos reutilizados respetan correcciones del nombre, la marca y la presentación de origen',()=>{
 const product={name:'Agua botella 1 L',brand:'Prueba',presentation:'1 L'};
 assert.deepEqual(packageEvidence(product),{content:{amount:1000,dimension:'volume'},pack:1});
 product.presentation='500 ml';assert.equal(packageEvidence(product),null);
 product.name='Agua botella 500 ml';assert.deepEqual(packageEvidence(product),{content:{amount:500,dimension:'volume'},pack:1});
 const numeric={name:'1854 X 120 GRS',presentation:'120 g',brand:'1854'};
 assert.equal(packageEvidence(numeric).pack,1);numeric.brand='Otra';assert.equal(packageEvidence(numeric).pack,1854);
 assert.equal(normalize('JABÓN Líquido'),'jabon liquido');assert.equal(normalize('JABÓN En Pan'),'jabon en pan');
});
test('modificar un resultado anterior no cambia la evidencia que recibe otra consulta',()=>{
 const product={name:'Agua botella 1 L',brand:'Prueba',presentation:'1 L'};
 const first=packageEvidence(product);first.content.amount=99;first.pack=100;
 assert.deepEqual(packageEvidence(product),{content:{amount:1000,dimension:'volume'},pack:1});
 const measure=sizes('1 L');measure[0].amount=99;measure.push({amount:999,dimension:'mass'});
 assert.deepEqual(sizes('1 L'),[{amount:1000,dimension:'volume'}]);
 const code='7790895000997',identity=barcodeIdentity(code),expected=structuredClone(identity);
 identity.status='invalid';identity.gtin='corrupt';assert.deepEqual(barcodeIdentity(code),expected);
 assert.deepEqual(barcodeIdentity('not-a-barcode'),{status:'invalid'});
 for(let i=0;i<11000;i++)packageEvidence({name:`Producto ensayo ${i}`,presentation:'1 L',brand:'Ensayo'});
 assert.deepEqual(packageEvidence(product),{content:{amount:1000,dimension:'volume'},pack:1});
});
