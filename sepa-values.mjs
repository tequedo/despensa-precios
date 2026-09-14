// SEPA decimal fields contain no currency symbols, grouping, exponents or hex.
// Reject ambiguous values rather than interpreting them with JavaScript Number().
export function sepaAmount(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!/^(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})$/.test(text)) return undefined;
  const number = Number(text.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export const emptySepaLine = value => !String(value).replace(/[\s\u0000\uFEFF]/g, '');
