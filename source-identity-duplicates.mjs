import {barcodeIdentity} from './product-identity.mjs';

const evidenceKeys=new Set(['barcode','gtin','barcodeStatus','sourceEanIndicator','sourceIdentityVariants']);
const withoutEvidence=value=>Object.fromEntries(Object.entries(value??{}).filter(([key])=>!evidenceKeys.has(key)));
const evidence=value=>Object.fromEntries(Object.entries(value??{}).filter(([key])=>evidenceKeys.has(key)&&key!=='sourceIdentityVariants'));
const variants=value=>value?.sourceIdentityVariants??[evidence(value)];

function mergeEvidence(left,right){
  const all=[...new Map([...variants(left),...variants(right)].map(value=>[JSON.stringify(value),value])).values()];
  if(!all.some(value=>value.barcodeStatus==='internal'))return null;
  for(const value of all){
    const internal=value.barcodeStatus==='internal';
    if(internal){
      if(value.barcode||value.gtin||(value.sourceEanIndicator!==undefined&&value.sourceEanIndicator!=='0'))return null;
    }else{
      if(!['invalid','restricted','valid_format_and_checksum'].includes(value.barcodeStatus))return null;
      if(value.sourceEanIndicator!==undefined&&value.sourceEanIndicator!=='1')return null;
      if(value.barcodeStatus!=='invalid'&&barcodeIdentity(value.barcode).status!==value.barcodeStatus)return null;
    }
  }
  // The source disagrees about barcode status. Keep the retailer-scoped ID,
  // retain every original declaration, and grant no cross-retailer barcode.
  return {barcodeStatus:'internal',sourceIdentityVariants:all};
}

export function mergeTupleIdentity(left,right){
  const plain=row=>row.map((value,index)=>index===9?withoutEvidence(value):value);
  if(JSON.stringify(plain(left))!==JSON.stringify(plain(right)))return null;
  const merged=mergeEvidence(left[9],right[9]);if(!merged)return null;
  const result=structuredClone(left);
  result[9]={...withoutEvidence(left[9]),barcode:null,...merged};
  return result;
}

export function mergeRecordIdentity(left,right){
  if(JSON.stringify([withoutEvidence(left.product),left.price])!==JSON.stringify([withoutEvidence(right.product),right.price]))return null;
  const merged=mergeEvidence(left.product,right.product);if(!merged)return null;
  return {...left,product:{...withoutEvidence(left.product),...merged}};
}
