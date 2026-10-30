import { normalize, packageEvidence, compatiblePackages } from './price-safety.mjs';
// A valid checksum is a format check, not proof of assignment or package identity.
// GS1 restricted-circulation prefixes must never become cross-retailer keys.
const barcodeResults=new Map(),barcodeOrder=[];let barcodeCursor=0;
export function barcodeIdentity(value) {
 const text=String(value??'').trim();let result=barcodeResults.get(text);
 if(result===undefined){result=inspectBarcode(text);if(text.length<=14){if(barcodeOrder.length<8192)barcodeOrder.push(text);else{barcodeResults.delete(barcodeOrder[barcodeCursor]);barcodeOrder[barcodeCursor]=text;barcodeCursor=(barcodeCursor+1)%8192;}barcodeResults.set(text,result);}}
 return {...result};
}
function inspectBarcode(value) {
  const barcode = String(value ?? '').trim();
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(barcode) || /^0+$/.test(barcode)) return { status: 'invalid' };
  const body = barcode.slice(0, -1);
  const sum = [...body].reverse().reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 1 : 3), 0);
  if ((10 - sum % 10) % 10 !== Number(barcode.at(-1))) return { status: 'invalid' };
  const base = barcode.length === 14 ? barcode.slice(1) : barcode.padStart(13, '0');
  const restricted = barcode.length === 8 ? /^[02]/.test(barcode)
    : /^(?:02|04|05|2|98|99|000)/.test(base) || (barcode.length === 14 && barcode[0] === '9');
  if (restricted) return { barcode, status: 'restricted' };
  return { barcode, gtin: barcode.padStart(14, '0'), status: 'valid_format_and_checksum' };
}

export function productFromTuple(row) {
  const product = { ean:String(row[0]), name:String(row[1]), brand:String(row[2]), presentation:String(row[3]), referenceUnit:String(row[4]) };
  const policy=row[11]?.catalogPolicy;
  // Re-evaluate only the documented CMQ/LTR parser defect in this old policy.
  // Raw contents must now be internally consistent. Other versions/reasons,
  // including source price and semantic reviews, retain their quarantine.
  const revalidatedUnit=policy?.version==='2026-10-28.abecedario.1'
    &&policy.reviewCode==='package_conflict'
    &&/(?:\d+(?:[.,]\d+)?|[.,]\d+)\s*(?:cmq|ltr)(?![a-z])/i.test(product.presentation)
    &&Boolean(packageEvidence(product));
  // Import metadata can only quarantine a row. It can never override raw
  // identity/package checks or grant permission to use a rejected price.
  if(policy?.quoteEligible===false&&!revalidatedUnit&&typeof policy.reviewCode==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(policy.reviewCode))product.catalogReview={code:policy.reviewCode,status:'pending_source_confirmation'};
  const evidence = row[9];
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return product;
  const identity = barcodeIdentity(evidence.barcode);
  if (evidence.barcodeStatus === identity.status && identity.barcode) return { ...product, barcode:identity.barcode, barcodeStatus:identity.status, ...(identity.gtin ? {gtin:identity.gtin} : {}) };
  return { ...product, barcodeStatus:['internal','invalid'].includes(evidence.barcodeStatus) ? evidence.barcodeStatus : 'unverified' };
}

const trustedGtin = product => product.barcodeStatus === 'valid_format_and_checksum' ? barcodeIdentity(product.barcode).gtin : undefined;
// A general name/brand/size query is not permission to substitute another SKU.
// Explicit cuts sold by weight have a separate comparison contract.
export function hasAmbiguousProducts(records, matchesId = createProductIdMatcher(records)) {
  const first = records[0]?.product;
  return Boolean(first && records.some(({product}) => !matchesId(first.ean, product) || !matchesId(product.ean, first)));
}
// Discovery/review only. A reported barcode can identify contradictory source
// rows without authorizing their prices or bypassing createProductIdMatcher.
export function reportsProductCode(product, requested) {
  if (String(requested) === product.ean) return true;
  const expected = barcodeIdentity(requested).gtin, actual = trustedGtin(product);
  return Boolean(expected && actual && expected === actual);
}
// Resolve legacy scoped IDs only from current explicit barcode evidence. Never
// infer a barcode by stripping "sepa:" or equate two internal retailer IDs.
export function createProductIdMatcher(records) {
  const aliases = new Map(), exemplars = new Map(), blocked = new Set();
  for (const {product} of records) {
    const gtin = trustedGtin(product);
    if (!gtin) continue;
    const prior = aliases.get(product.ean);
    aliases.set(product.ean, prior === undefined || prior === gtin ? gtin : null);
    const evidence = packageEvidence(product), brand = normalize(product.brand);
    if (!evidence || !brand) blocked.add(gtin);
    const other = exemplars.get(gtin);
    if (other && (other.brand !== brand || !compatiblePackages(other.evidence,evidence))) blocked.add(gtin);
    else if (!other) exemplars.set(gtin,{brand,evidence});
  }
  return (requested, product) => {
    if (String(requested) === product.ean) return true;
    const actual = trustedGtin(product);
    if (!actual || blocked.has(actual)) return false;
    const expected = aliases.has(requested) ? aliases.get(requested) : barcodeIdentity(requested).gtin;
    return Boolean(expected && actual === expected);
  };
}
