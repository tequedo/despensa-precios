import manifest from '../data/catalog-policy-manifest.json' with {type:'json'};
import reviews from '../data/catalog-search-reviews.json' with {type:'json'};
import {normalize,packageEvidence} from './price-safety.mjs';
import {barcodeIdentity} from './product-identity.mjs';
import {reviewedCatalogEntry} from './catalog-semantics.mjs';
import {productSearchFamily} from './product-search.mjs';
import {marketCategory} from './market-features.mjs';
import {priceReview} from './price-review.mjs';

export const catalogPolicyVersion=manifest.version;
const knownCodes=new Map(reviews.products.map(entry=>[barcodeIdentity(entry.barcode).gtin,entry]));
const descriptor=value=>/\b(snacks?|papas fritas|nachos|botanas?|takis|lays|lay s)\b/.test(normalize(value));

// Keep the configured basket, and also admit recognized families and snack
// brands. A product must not depend on an incidental flavour such as ketchup.
export function includeCatalogProduct(product,legacyMatch=false){
 return Boolean(legacyMatch||reviewedCatalogEntry(product)||productSearchFamily(product)||descriptor(`${product.name} ${product.brand??''}`));
}

export function classifyCatalogRecord(record){
 const p=record.product,known=p.barcodeStatus==='valid_format_and_checksum'&&knownCodes.has(barcodeIdentity(p.barcode).gtin);
 const meaning=reviewedCatalogEntry(p),changed=known&&!meaning;
 const review=priceReview(record),pack=packageEvidence(p);
 const reviewCode=changed?'semantic_fingerprint_changed':review?.id??(!pack?'package_conflict':null);
 return {version:catalogPolicyVersion,family:changed?null:productSearchFamily(p)??null,category:changed?'Otros':marketCategory(p),
  quoteEligible:!reviewCode,reviewCode,aliases:meaning?.aliases??[],needsMeaningReview:changed||!productSearchFamily(p)};
}

export function catalogPolicyReport(records){
 const counts={records:0,quoteEligible:0,quarantined:0,needsMeaningReview:0},byReason={},exceptions=[];
 for(const record of records){
  const policy=classifyCatalogRecord(record);counts.records++;if(policy.quoteEligible)counts.quoteEligible++;else counts.quarantined++;
  if(policy.needsMeaningReview)counts.needsMeaningReview++;
  if(policy.reviewCode){byReason[policy.reviewCode]=(byReason[policy.reviewCode]??0)+1;exceptions.push({id:record.product.ean,storeId:record.store?.externalId,sourceDate:record.price.validDate,reason:policy.reviewCode});}
 }
 return {version:catalogPolicyVersion,sourceFieldsPreserved:true,counts,byReason,exceptions};
}
