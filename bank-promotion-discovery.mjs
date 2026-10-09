import { createHash } from 'node:crypto';

const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const normalized = value => plain(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const DAYS = [['DOMINGO', 0], ['LUNES', 1], ['MARTES', 2], ['MIERCOLES', 3], ['JUEVES', 4], ['VIERNES', 5], ['SABADO', 6]];
const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const sha = text => createHash('sha256').update(text).digest('hex');

function date(value) {
  const m = String(value ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? '20' + m[3] : m[3];
  const iso = y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  const parsed = new Date(iso + 'T12:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

function validity(text) {
  const numeric = text.match(/(?:VALID[OA]|VIGENCIA)(?:\s+(?:DESDE|DEL))?(?:\s+EL)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:AL|HASTA(?:\s+EL)?)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (numeric) return { validFrom: date(numeric[1]), validTo: date(numeric[2]) };
  const named = text.match(/(?:ENTRE EL|DESDE EL|DEL)\s+(\d{1,2})\s+DE\s+([A-Z]+)(?:\s+DE\s+(20\d{2}))?\s+(?:Y EL|AL|HASTA EL)\s+(\d{1,2})\s+DE\s+([A-Z]+)\s+DE\s+(20\d{2})/);
  if (!named) return { validFrom: null, validTo: null };
  const fromMonth = MONTHS.indexOf(named[2]) + 1, toMonth = MONTHS.indexOf(named[5]) + 1;
  return { validFrom: date(named[1] + '/' + fromMonth + '/' + (named[3] ?? named[6])), validTo: date(named[4] + '/' + toMonth + '/' + named[6]) };
}

const dayValues = text => /TODOS LOS DIAS/.test(text) ? [0, 1, 2, 3, 4, 5, 6]
  : DAYS.filter(([name]) => new RegExp('\\b' + name + 'S?\\b').test(text)).map(([,n]) => n);
const money = value => Number(value.replace(/\./g, '').replace(',', '.'));
const capValues = text => [...text.matchAll(/(?:TOPE(?:\s+(?:DE|MAXIMO|MENSUAL|SEMANAL|DIARIO|POR CLIENTE)){0,3}|HASTA)\s*:?\s*(?:DE\s*)?\$\s*([\d.]+(?:,\d{1,2})?)/g)].map(m => money(m[1]));

// Discovery preserves a promotion's own legal, never another card's terms.
// Richly parsed candidates remain non-calculable until branch, product and
// personal restrictions are independently verified.
export function discoverBankPromotion({ id, title, terms, provider, chain, sourceUrl, checkedAt }) {
  const original = plain(terms), text = normalized(original), summary = plain(title), header = normalized(summary);
  if (!original) return null;
  const stamp = Date.parse(checkedAt);
  if (!Number.isFinite(stamp)) throw new Error('Fecha de comprobación inválida');
  const today = new Date(stamp - 3 * 3600000).toISOString().slice(0, 10);
  const range = validity(text);
  const reasons = [], conflicts = [];
  const legalPercents = [...text.matchAll(/\b(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:DE\s*)?(?:REINTEGRO|DESCUENTO|AHORRO|BONIFICACION)/g)].map(m => Number(m[1].replace(',', '.')));
  const headerPercent = header.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*%/);
  const headerValue = headerPercent ? Number(headerPercent[1].replace(',', '.')) : null;
  const percentages = [...new Set(legalPercents)];
  if (percentages.length > 1 || headerValue != null && percentages.length && !percentages.includes(headerValue)) conflicts.push('Porcentajes contradictorios entre encabezado y condiciones.');
  const discountPercent = headerValue ?? (percentages.length === 1 ? percentages[0] : null);
  const headerDays = dayValues(header), legalDays = dayValues(text);
  if (headerDays.length && legalDays.length && headerDays.some(d => !legalDays.includes(d))) conflicts.push('Días contradictorios entre encabezado y condiciones.');
  const daysOfWeek = legalDays.length ? legalDays : headerDays;
  const retiredOnly = /JUBILAD|PENSIONAD/.test(header) || /(?:PARA|CLIENTES|BENEFICIARIOS)\s+(?:LOS\s+)?JUBILAD|(?:PARA|CLIENTES|BENEFICIARIOS)\s+(?:LOS\s+)?PENSIONAD/.test(text);
  const issuer = plain(provider) || (/MODO/.test(header) ? 'MODO' : retiredOnly ? 'Jubilados y pensionados' : 'Banco o tarjeta: ver condiciones');
  const installments = text.match(/(\d{1,2})\s*CUOTAS?\s*SIN\s*INTERES/);
  const kind = installments && !discountPercent ? 'installments' : /REINTEGRO/.test(text) ? 'reimbursement' : 'discount';
  const capMatches = [...capValues(text), ...capValues(header)];
  const noCap = /SIN TOPE|SIN LIMITE DE (?:REINTEGRO|DESCUENTO)/.test(text + ' ' + header);
  const caps = [...new Set(capMatches.filter(n => n > 0))];
  if (noCap && caps.length || caps.length > 1) conflicts.push('Topes ambiguos o contradictorios.');
  const capAmount = caps.length === 1 ? caps[0] : null;
  const capPeriod = noCap ? 'not_applicable' : /TOPE[\s\S]{0,120}(?:MENSUAL|POR MES)/.test(text) ? 'month'
    : /TOPE[\s\S]{0,120}(?:SEMANAL|POR SEMANA)/.test(text) ? 'week'
    : /TOPE[\s\S]{0,120}(?:DIARIO|POR DIA)/.test(text) ? 'day'
    : /TOPE[\s\S]{0,120}(?:POR COMPRA|POR TRANSACCION)/.test(text) ? 'purchase' : null;
  const capOwner = /(?:POR|CADA)\s+(?:CLIENTE|PERSONA|TITULAR)/.test(text) ? 'person'
    : /(?:POR|CADA)\s+CUENTA/.test(text) ? 'account'
    : /(?:POR|CADA)\s+TARJETA/.test(text) ? 'card' : null;
  const minimum = text.match(/(?:COMPRA MINIMA|MONTO MINIMO|MINIMO DE COMPRA)\s*(?:DE\s*)?\$\s*([\d.]+(?:,\d{1,2})?)/);
  const payment = original.match(/(?:solo\s+pagando|pagando|utilizando|abonando)\s+(?:con|a trav[eé]s de)[^.]{4,800}/i);
  const paymentRequirement = payment ? plain(payment[0]) : null;
  const nationwide = /TODO EL PAIS|TODAS LAS TIENDAS DE(?:L)? PAIS|TODO EL TERRITORIO (?:NACIONAL|ARGENTINO)/.test(text);
  const restrictedBranches = /(?:LOCALES|SUCURSALES|COMERCIOS)(?: FISIC[OA]S)? ADHERID[OA]S/.test(text);
  const channels = [/(?:PRESENCIAL|TIENDAS|LOCALES|SUCURSALES)/.test(text) ? 'Sucursales físicas' : null,
    /ONLINE|ECOMMERCE|COMERCIO ELECTRONICO/.test(text) ? 'Online' : null].filter(Boolean);
  const exclusions = original.match(/(?:no incluye|no aplica|excluye|excluidos|excepto)[^.]+/gi) ?? [];
  const accumulationSpecified = /NO ACUMULABLE|ACUMULABLE/.test(text);
  const accumulable = accumulationSpecified ? !/NO ACUMULABLE/.test(text) : null;
  if (range.validFrom && range.validTo && range.validTo < range.validFrom) conflicts.push('La vigencia final es anterior a la inicial.');
  if (!range.validFrom || !range.validTo) reasons.push('Vigencia completa no extraída.');
  if (!daysOfWeek.length) reasons.push('Días no comprobados.');
  if (kind !== 'installments' && !(discountPercent > 0 && discountPercent <= 100)) reasons.push('Porcentaje no comprobado.');
  if (!paymentRequirement) reasons.push('Medio de pago exacto no extraído.');
  if (kind !== 'installments' && !noCap && capAmount == null) reasons.push('Tope no comprobado.');
  if (capAmount != null && (!capPeriod || !capOwner)) reasons.push('Período y titular del tope pendientes.');
  reasons.push('Sucursales y alcance pendientes de validación.');
  if (!channels.length) reasons.push('Canal de compra no comprobado.');
  if (!accumulationSpecified) reasons.push('Acumulación no comprobada.');
  reasons.push('Falta validar exclusiones por producto y elegibilidad personal; no se aplica al total.');
  const status = conflicts.length ? 'conflict' : range.validTo && range.validTo < today ? 'expired' : 'incomplete';
  return { id: 'bank-' + chain + '-' + (id || sha(original).slice(0,20)), provider: issuer, chain,
    title: summary || issuer, kind, discountPercent, installments: installments ? Number(installments[1]) : null,
    daysOfWeek, dayLabels: DAYS.filter(([,n]) => daysOfWeek.includes(n)).map(([name]) => name.toLowerCase()),
    ...range, retiredOnly, paymentRequirement, minimumPurchase: minimum ? money(minimum[1]) : null,
    capAmount, capPeriod, capOwner, capRule: noCap ? 'Sin tope' : capAmount != null ? 'Tope $' + capAmount.toLocaleString('es-AR') + '; período ' + ({month:'mensual',week:'semanal',day:'diario',purchase:'por compra'}[capPeriod] ?? 'no comprobado') + '; por ' + ({person:'persona',account:'cuenta',card:'tarjeta'}[capOwner] ?? 'titular no comprobado') : 'Tope no comprobado',
    geographicScope: nationwide ? (restrictedBranches ? 'Argentina; solo sucursales adheridas, pendientes de validar' : 'Argentina; verificar sucursales y formatos') : null,
    branchEligibilityVerified: false, channels, exclusions, exclusionsVerified: false,
    accumulable, sourceUrl, checkedAt, sourceRecordId: id ?? null,
    termsText: original.slice(0,16000), termsHash: sha(original), status, calculationEligible: false,
    calculationBlockedReason: conflicts.length ? conflicts.join(' ') : reasons.join(' '),
    reasons: [...conflicts, ...reasons] };
}
