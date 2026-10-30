import test from 'node:test';
import assert from 'node:assert/strict';
import {sizes,sameSize,packageEvidence} from '../catalog-policy/lib/price-safety.mjs';
import {productFromTuple,createProductIdMatcher} from '../catalog-policy/lib/product-identity.mjs';
import {classifyCatalogRecord,catalogPolicyVersion} from '../catalog-policy/lib/catalog-policy.mjs';
import {matchesCatalogQuery} from '../catalog-policy/lib/product-search.mjs';

// Actual COTO Cabildo row in the original official 2026-10-29 archive.
const tuple=()=>['sepa:12:1:7791333000449','VINO MALBEC GOYENECHEA 100 AÑOS BOT 750 CC','GOYENECHEA  100','750 cmq','ltr',10145,'2026-10-29',null,null,{barcode:'7791333000449',barcodeStatus:'valid_format_and_checksum',sourceProductId:'7791333000449',sourceEanIndicator:'1'},{referencePrice:{price:13526.66,quantity:1,unit:'ltr'}},{catalogPolicy:{version:'2026-10-28.abecedario.1',quoteEligible:false,reviewCode:'package_conflict'}}];

test('CMQ y LTR conservan el volumen declarado y no convierten masa, cantidad ni packs',()=>{
 assert.deepEqual(sizes('750 CMQ'),[{amount:750,dimension:'volume'}]);
 assert.deepEqual(sizes('0,75 LTR'),[{amount:750,dimension:'volume'}]);
 assert.equal(sameSize('750 cmq','0.75 LTR'),true);
 for(const other of ['750 g','375 cmq','1 LTR','2 x 750 cmq'])assert.equal(sameSize('750 cmq',other),false,other);
 assert.equal(sameSize('2 x 750 cmq','2 x 0.75 LTR'),true);
 assert.deepEqual(sizes('750 CMQX'),[]);
});

test('la botella real se descubre y cotiza sin alterar código, nombre, envase ni precio de origen',()=>{
 const row=tuple(),before=JSON.stringify(row),product=productFromTuple(row);
 assert.equal(product.catalogReview,undefined);
 assert.equal(product.presentation,'750 cmq');assert.equal(product.referenceUnit,'ltr');
 assert.deepEqual(packageEvidence(product),{content:{amount:750,dimension:'volume'},pack:1});
 assert.equal(matchesCatalogQuery(product,'vino 750 cmq'),true);
 assert.equal(matchesCatalogQuery(product,'vino 0.75 LTR'),true);
 assert.equal(matchesCatalogQuery(product,'vino 375 cmq'),false);
 const policy=classifyCatalogRecord({product,store:{province:'Ciudad Autónoma de Buenos Aires'},price:{listPrice:row[5],validDate:row[6]}});
 assert.equal(policy.quoteEligible,true);assert.equal(policy.version,catalogPolicyVersion);
 assert.equal(row[5],10145);assert.equal(JSON.stringify(row),before);
 const peer={...product,ean:'test-only:peer',presentation:'0.75 LTR'};
 const records=[product,peer].map(product=>({product}));
 assert.equal(createProductIdMatcher(records)(product.ean,peer),true);
 assert.equal(createProductIdMatcher([...records,{product:{...peer,presentation:'375 cmq'}}])(product.ean,peer),false);
});

test('la revalidación se limita al defecto de unidades de la versión anterior y conserva las demás exclusiones',()=>{
 for(const policy of [
  {version:'2026-10-28.abecedario.1',reviewCode:'meat_price_out_of_range'},
  {version:'2026-10-28.abecedario.1',reviewCode:'semantic_fingerprint_changed'},
  {version:catalogPolicyVersion,reviewCode:'package_conflict'},
  {version:'unknown',reviewCode:'package_conflict'}
 ]){const row=tuple();row[11].catalogPolicy={...policy,quoteEligible:false};assert.equal(productFromTuple(row).catalogReview.code,policy.reviewCode);}
 for(const presentation of ['375 cmq','750 g','750 cmqx']){const row=tuple();row[3]=presentation;assert.equal(productFromTuple(row).catalogReview.code,'package_conflict');}
 const row=tuple();row[3]='750 cm3';assert.equal(productFromTuple(row).catalogReview.code,'package_conflict');
});
