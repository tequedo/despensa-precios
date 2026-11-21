import { provinceFor,normalize,packageEvidence } from './price-safety.mjs';
import { barcodeIdentity, createProductIdMatcher } from './product-identity.mjs';
import {reviewedCatalogEntry} from './catalog-semantics.mjs';

const median = values => { const s = [...values].sort((a,b)=>a-b), middle = Math.floor(s.length / 2); return s.length % 2 ? s[middle] : (s[middle-1]+s[middle])/2; };
const retailer = record => {
  const id = String(record.product.ean);
  const separator = id.startsWith('sepa:') ? id.indexOf(':', 5) : -1;
  return separator > 5 ? id.slice(5, separator) : record.store.chain;
};

function peerReference(record, company, peers, matchesId) {
  const groups = new Map();
  for (const other of peers) {
    if (other.price.validDate !== record.price.validDate) continue;
    const otherCompany = retailer(other);
    if (!otherCompany || otherCompany === company || !matchesId(record.product.ean, other.product)) continue;
    if (!groups.has(otherCompany)) groups.set(otherCompany, []);
    groups.get(otherCompany).push(other.price.listPrice);
  }
  // Independent retailers count once each; a chain with many branches cannot
  // dominate. Compare list prices, not conditional promotions or other SKUs.
  const prices = [...groups.values()].map(median);
  if (prices.length < 2 || Math.max(...prices) > Math.min(...prices) * 2) return null;
  return { count: prices.length, median: median(prices) };
}

function reviewAgainstPeers(record, reference) {
  if (!reference || record.price.listPrice >= reference.median * .35) return null;
  return { id: 'cross_retailer_low_price', status: 'pending_source_confirmation', reason: 'Se apartó un importe muy inferior al del mismo producto en otros comercios. Está pendiente de confirmación.', peerRetailers: reference.count, referenceMedian: reference.median };
}

// INC-059: reported by the user and reproduced in the 2026-09-13 replica.
// This is an unresolved observation, not a replacement price or a finding that
// the official SEPA archive is incorrect. A newer file date alone cannot clear it.
export function priceReview(record) {
  const sourceReview=reviewedCatalogEntry(record.product)?.quoteReview;
  if(sourceReview?.presentations?.some(value=>normalize(value)===normalize(record.product.presentation)))return {id:sourceReview.code,status:'pending_source_confirmation',reason:sourceReview.reason};
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
  if(/\bagua\b/.test(normalize(record.product?.name))){
    const content=packageEvidence(record.product)?.content;
    if(content?.dimension==='volume'&&content.amount>100000){
      return {id:'retail_water_capacity_review',status:'pending_source_confirmation',reason:'La capacidad informada del agua supera los 100 litros por envase minorista. Se apartó el precio hasta confirmar la presentación con la fuente.'};
    }
  }
  return null;
}

export function separateReviewedPrices(input) {
  const records = [], reviewedRecords = [];
  const groups = new Map(), reviews = new WeakMap(), matchesId = createProductIdMatcher(input);
  for (const record of input) {
    const review = priceReview(record);
    if (review) reviews.set(record, review);
    const trusted = record.product.barcodeStatus === 'valid_format_and_checksum';
    if (!trusted && review) continue;
    const gtin = barcodeIdentity(record.product.barcode).gtin;
    if (!gtin) continue;
    let group = groups.get(gtin);
    if (!group) groups.set(gtin, group = { peers: [], targets: [] });
    // Even rows with a source review are peers in the legacy policy.
    if (trusted) group.peers.push(record);
    if (!review) group.targets.push(record);
  }
  for (const {peers,targets} of groups.values()) {
    if (peers.length < 2) continue;
    // Memo identity is exact and only lives while processing one GTIN.
    // The input order need not match the group order across branches.
    const byEan = new Map();
    for (const record of targets) {
      if (peers.length < 3 && record.product.barcodeStatus === 'valid_format_and_checksum') continue;
      const company = retailer(record), {ean} = record.product, date = record.price.validDate;
      let byDate = byEan.get(ean);
      if (!byDate) byEan.set(ean, byDate = new Map());
      let byCompany = byDate.get(date);
      if (!byCompany) byDate.set(date, byCompany = new Map());
      let reference = byCompany.get(company);
      if (reference === undefined) {
        reference = peerReference(record, company, peers, matchesId);
        byCompany.set(company, reference);
      }
      const review = reviewAgainstPeers(record, reference);
      if (review) reviews.set(record, review);
    }
  }
  for (const record of input) {
    const review = reviews.get(record);
    if (review) reviewedRecords.push({record, review});
    else records.push(record);
  }
  return { records, reviewedRecords };
}
