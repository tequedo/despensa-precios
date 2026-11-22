import test from 'node:test';
import assert from 'node:assert/strict';
import {separateReviewedPrices} from '../catalog-policy/lib/price-review.mjs';
import {separateReviewedPrices as original} from './fixtures/price-review-oracle.mjs';

const gtin='7790895000997';
const make=(company,price,date='2026-10-25',attributes={})=>({
 product:{ean:'sepa:'+company+':1:'+gtin,name:'Gaseosa Coca Cola 2.25 L',brand:'Coca Cola',presentation:'2.25 L',barcode:gtin,barcodeStatus:'valid_format_and_checksum',...attributes},
 store:{chain:company,province:'San Juan'},price:{listPrice:price,validDate:date}
});
test('mismas revisiones y orden con varias fechas, sucursales, precios e identidades conflictivas',()=>{
 const first=[make('a',10),make('b',130),make('c',100),make('c',120),make('a',108),make('c',3,'2026-10-26'),make('d',6,'2026-10-26'),make('b',25,'2026-10-26')];
 const conflict=[...first,make('a',10,'2026-10-25',{presentation:'500 ml',name:'Gaseosa Coca Cola 500 ml'})];
 const unverified=[...first,make('a',3,'2026-10-25',{barcodeStatus:'unverified'}),make('a',99,'2026-10-25',{catalogReview:{code:'source_conflict',status:'pending_source_confirmation'}})];
 for(const input of [first,conflict,unverified,[...first].reverse()])assert.deepEqual(separateReviewedPrices(input),original(input));
 assert.equal(separateReviewedPrices(first).reviewedRecords.length,1);
 assert.equal(separateReviewedPrices(conflict).reviewedRecords.length,0);
 assert.ok(separateReviewedPrices(unverified).reviewedRecords.some(row=>row.review.id==='source_conflict'));
});

test('el contexto no mezcla alias con otro GTIN ni la cadena cuando el ID no está acotado a SEPA',()=>{
 const known=[make('a',10),make('b',120),make('c',130)];
 const ambiguous=[...known,make('a',13,'2026-10-25',{barcode:'7790895000430'})];
 assert.deepEqual(separateReviewedPrices(ambiguous),original(ambiguous));
 assert.equal(separateReviewedPrices(ambiguous).reviewedRecords.length,0);
 const noScope=company=>make(company,10,'2026-10-25',{ean:gtin});
 const independent=[noScope('extra'),noScope('b'),make('b',120),make('c',130)];
 const result=separateReviewedPrices(independent);
 assert.deepEqual(result,original(independent));
 assert.equal(result.reviewedRecords.length,1);
 assert.equal(result.reviewedRecords[0].record.store.chain,'extra');
});

