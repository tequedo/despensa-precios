import { normalize, freshDate, isoDate, argentinaDate, provinceFor } from './price-safety.mjs';

export function scopedPromotionEvidence(item,html,now=Date.now()) {
  if(!freshDate(item.validDate,now)||!item.storeId||!item.province)return null;
  const nodes=[];
  function visit(value){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object'){nodes.push(value);Object.values(value).forEach(visit);}}
  for(const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(match[1]));}catch{}}
  for(const product of nodes){
    if(!['Product'].includes(product['@type'])||String(product.gtin13??product.gtin14??product.gtin8??product.gtin??'')!==String(item.ean))continue;
    const offers=Array.isArray(product.offers)?product.offers:[product.offers];
    for(const offer of offers){
      if(!offer||offer.priceCurrency!=='ARS'||Number(offer.price)!==Number(item.promoPrice)||!(Number(offer.price)>0))continue;
      const from=isoDate(offer.validFrom),to=isoDate(offer.validThrough??offer.priceValidUntil),today=argentinaDate(now);
      if(!from||!to||from>today||to<today)continue;
      // An online offer cannot corroborate a physical branch's shelf promotion.
      if(!String(offer.availability??'').endsWith('/InStoreOnly'))continue;
      const place=offer.availableAtOrFrom;
      const branch=String(place?.branchCode??place?.identifier??'');
      const declaredProvince=provinceFor(place?.address?.addressRegion);
      if(branch!==item.storeId||declaredProvince?.code!==provinceFor(item.province)?.code)continue;
      const conditions=normalize(item.conditions);if(!conditions||!normalize(offer.description??'').includes(conditions))continue;
      return {evidenceVersion:2,storeId:item.storeId,province:item.province,validFrom:from,validTo:to,channel:'sucursal',verifiedPrice:Number(offer.price)};
    }
  }
  return null;
}
