// A valid checksum is a format check, not proof of assignment or package identity.
// GS1 restricted-circulation prefixes must never become cross-retailer keys.
export function barcodeIdentity(value) {
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

const pick = (row, names) => names.map(name => row[name]).find(value => value !== undefined && value !== '') ?? '';
export function sepaProductIdentity(row) {
  const parts = [pick(row, ['id_comercio', 'productos_comercio_cuit']), pick(row, ['id_bandera', 'productos_bandera_id']), pick(row, ['id_producto', 'productos_id'])].map(value => String(value).trim());
  if (parts.some(value => !/^[a-zA-Z0-9._-]{1,64}$/.test(value))) return { accepted: false, reason: 'missing_or_invalid_product_identifier' };
  const flag = String(pick(row, ['productos_ean', 'producto_ean'])).trim();
  if (flag !== '0' && flag !== '1') return { accepted: false, reason: 'invalid_ean_indicator' };
  const ean = ['sepa', ...parts].join(':'); // Existing product, stock and price references stay stable.
  if (flag === '0') return { accepted: true, ean, sourceProductId: parts[2], barcodeStatus: 'internal' };
  const identity = barcodeIdentity(parts[2]);
  return { accepted: true, ean, sourceProductId: parts[2], barcodeStatus: identity.status, ...(identity.barcode ? { barcode: identity.barcode } : {}), ...(identity.gtin ? { gtin: identity.gtin } : {}) };
}
