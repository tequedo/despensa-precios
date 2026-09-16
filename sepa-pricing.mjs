import { sepaAmount } from './sepa-values.mjs';
import { isoDate } from './price-safety.mjs';

const text = value => String(value ?? '').trim();
const normalized = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const pick = (row, keys) => keys.map(key => text(row[key])).find(Boolean) ?? '';
const emptyPrice = value => !value || /^0+(?:[.,]0+)?$/.test(value);

// These are candidate rules, not evidence that a customer qualifies for an offer.
export function promotionDetails(promoPrice, conditions) {
  const value = normalized(conditions);
  const nxm = value.match(/\b(\d+)\s*(?:x|por)\s*(\d+)\b/);
  const percentages = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)];
  const percent = percentages.length === 1 ? Number(percentages[0][1].replace(',', '.')) : undefined;
  const secondUnit = /(?:segunda|2da|2\.?a)\s+unidad/.test(value);
  const cap = value.match(/tope(?:\s+de)?\s*\$?\s*([\d.]+(?:,\d+)?)/);
  const requiredBenefit = /(tarjeta|banco|billetera|mercado pago|modo|cuenta|jubilad|anses|club|socio|membres)/.test(value) ? text(conditions) : '';
  const common = { requiredBenefit, ...(cap ? {discountCap: sepaAmount(cap[1].replace(/\./g, ''))} : {}) };
  if ((nxm && percentages.length) || (secondUnit && /\bal\s+\d+(?:[.,]\d+)?\s*%/.test(value) && !/(descuento|off|dto|dcto)/.test(value))) return {promoKind:'none', ...common};
  if (nxm && Number(nxm[1]) > Number(nxm[2]) && Number(nxm[2]) >= 1 && Number(nxm[1]) <= 100)
    return {promoKind:'nxm', buyQuantity:Number(nxm[1]), payQuantity:Number(nxm[2]), ...common};
  if (percent > 0 && percent <= 100) return {promoKind:secondUnit ? 'second_unit' : 'percent', discountPercent:percent, ...common};
  // Do not reinterpret incomplete multi-buy rules or several percentages as a flat price.
  if (secondUnit || percentages.length || nxm) return {promoKind:'none', ...common};
  return {promoKind:promoPrice ? 'special_price' : 'none', ...common};
}

export function readSepaPricing(row, listPrice, validDate) {
  const promotions = [], issues = [];
  for (const slot of [1, 2]) {
    const rawPrice = pick(row, [`productos_precio_unitario_promo${slot}`, `productos_precio_promocional_${slot}`, `productos_precio_promocional${slot}`, ...(slot === 1 ? ['productos_precio_promocional', 'precio_promocional'] : [])]);
    const promoConditions = pick(row, [`productos_leyenda_promo${slot}`, `productos_leyenda_promocion_${slot}`, `productos_leyenda_promocion${slot}`, ...(slot === 1 ? ['productos_leyenda_promocion', 'leyenda_promocion'] : [])]);
    if (emptyPrice(rawPrice) && !promoConditions) continue;
    const promoPrice = sepaAmount(rawPrice);
    const end = normalized(promoConditions).match(/hasta(?:\s+el)?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const expiry = end ? isoDate(`${end[3]}-${end[2].padStart(2,'0')}-${end[1].padStart(2,'0')}`) : null;
    const reason = end && !expiry ? 'invalid_promotion_date' : expiry && expiry < validDate ? 'expired_promotion'
      : !emptyPrice(rawPrice) && (!promoPrice || promoPrice < 100 || promoPrice > listPrice) ? 'invalid_promotion_price' : null;
    if (reason) { issues.push({kind:'promotion', reason, slot:`promo${slot}`, rawPrice, promoConditions}); continue; }
    promotions.push({slot:`promo${slot}`, ...(promoPrice ? {promoPrice} : {}), promoConditions, ...promotionDetails(promoPrice, promoConditions)});
  }
  const rawReferencePrice = pick(row, ['productos_precio_referencia', 'productos_precio_unitario_referencia', 'precio_referencia']);
  const rawReferenceQuantity = pick(row, ['productos_cantidad_referencia', 'cantidad_referencia']);
  const unit = pick(row, ['productos_unidad_medida_referencia', 'producto_unidad_medida_referencia', 'unidad_medida_referencia']);
  let referencePrice;
  if (!emptyPrice(rawReferencePrice)) {
    const price = sepaAmount(rawReferencePrice), quantity = sepaAmount(rawReferenceQuantity);
    if (price && price <= 10000000 && quantity && unit) referencePrice = {price, quantity, unit};
    else issues.push({kind:'reference_price', reason:'incomplete_or_invalid_reference_price', rawPrice:rawReferencePrice, rawQuantity:rawReferenceQuantity, unit});
  }
  return {promotions, referencePrice, issues};
}
