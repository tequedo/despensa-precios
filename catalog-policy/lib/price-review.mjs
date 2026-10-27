import { provinceFor,normalize,packageEvidence } from './price-safety.mjs';
import { barcodeIdentity, createProductIdMatcher } from './product-identity.mjs';

const median = values => { const s = [...values].sort((a,b)=>a-b), middle = Math.floor(s.length / 2); return s.length % 2 ? s[middle] : (s[middle-1]+s[middle])/2; };
const retailer = record => /^sepa:([^:]+):/.exec(record.product.ean)?.[1] ?? record.store.chain;

function peerReview(record, peers, matchesId) {
  const groups = new Map();
  for (const other of peers) {
    const company = retailer(other);
    if (!company || company === retailer(record) || other.price.validDate !== record.price.validDate || !matchesId(record.product.ean, other.product)) continue;
    if (!groups.has(company)) groups.set(company, []);
    groups.get(company).push(other.price.listPrice);
  }
  // Independent retailers count once each; a chain with many branches cannot
  // dominate. Compare list prices, not conditional promotions or other SKUs.
  const prices = [...groups.values()].map(median);
  if (prices.length < 2 || Math.max(...prices) > Math.min(...prices) * 2) return null;
  const reference = median(prices);
  if (record.price.listPrice >= reference * .35) return null;
  return { id: 'cross_retailer_low_price', status: 'pending_source_confirmation', reason: 'Se apartó un importe muy inferior al del mismo producto en otros comercios. Está pendiente de confirmación.', peerRetailers: prices.length, referenceMedian: reference };
}

// INC-059: reported by the user and reproduced in the 2026-09-13 replica.
// This is an unresolved observation, not a replacement price or a finding that
// the official SEPA archive is incorrect. A newer file date alone cannot clear it.
export function priceReview(record) {
  if(record.product?.catalogReview?.status==='pending_source_confirmation')return {id:record.product.catalogReview.code,status:'pending_source_confirmation',reason:'El control de importación apartó este registro por datos de producto o presentación pendientes de confirmar.'};
  if (provinceFor(record.store?.province)?.code === 'AR-J'
    && /^sepa:11:(2|5):7790742357502$/.test(record.product?.ean ?? '')
    && record.price?.listPrice === 724) {
    return {
      id: 'INC-059', status: 'pending_source_confirmation',
      reason: 'Hay un precio de leche de $724 en revisión. Está excluido de los cálculos.',
      reportedAt: '2026-09-15',
    };
  }
  const content=packageEvidence(record.product)?.content;
  if(/\bagua\b/.test(normalize(record.product?.name))&&content?.dimension==='volume'&&content.amount>100000){
    return {id:'retail_water_capacity_review',status:'pending_source_confirmation',reason:'La capacidad informada del agua supera los 100 litros por envase minorista. Se apartó el precio hasta confirmar la presentación con la fuente.'};
  }
  return null;
}

export function separateReviewedPrices(input) {
  const records = [], reviewedRecords = [];
  const groups = new Map(), matchesId = createProductIdMatcher(input);
  for (const record of input) {
    const key = record.product.barcodeStatus === 'valid_format_and_checksum' ? barcodeIdentity(record.product.barcode).gtin : undefined;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  for (const record of input) {
    const peers = groups.get(barcodeIdentity(record.product.barcode).gtin) ?? [];
    const review = priceReview(record) || peerReview(record, peers, matchesId);
    if (review) reviewedRecords.push({ record, review });
    else records.push(record);
  }
  return { records, reviewedRecords };
}
