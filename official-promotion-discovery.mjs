import { createHash } from 'node:crypto';
import { discoverBankPromotion } from './bank-promotion-discovery.mjs';

const plain = value => String(value ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const stampDay = value => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000 - 3 * 3600000).toISOString().slice(0, 10) : null;
};

// This is the public document used by Cencosud's own DiscountFinancing component.
// Website/store restrictions are retained; a shared document never means all chains participate.
export function cencosudCandidates(records, source, checkedAt) {
  if (!Array.isArray(records)) throw new Error('Documento público de Cencosud inválido');
  const today = new Date(Date.parse(checkedAt) - 3 * 3600000).toISOString().slice(0, 10);
  let expiredRecords = 0, excludedRecords = 0;
  const candidates = [];
  for (const record of records) {
    const websites = record.websites ?? [], stores = record.stores ?? [];
    if (!Array.isArray(websites) || !Array.isArray(stores) ||
      (websites.length && !websites.some(site => source.accounts.includes(site))) ||
      (!websites.length && stores.length)) { excludedRecords++; continue; }
    const from = stampDay(record.dateStart), to = stampDay(record.dateEnd);
    if (to && to < today) { expiredRecords++; continue; }
    const terms = plain(record.legals);
    if (!terms) continue;
    const provider = (record.banks ?? []).map(bank => plain(bank.name)).filter(Boolean).join(' / ');
    const id = createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0, 24);
    const candidate = discoverBankPromotion({ id, title: plain([record.discountText, record.info, record.installmentsText].filter(Boolean).join(' · ')), terms, provider, chain: source.chain, sourceUrl: source.url, checkedAt });
    if (!candidate) continue;
    // Structured dates are preserved separately, never substituted for incomplete legal dates.
    const conflicts = [];
    if (from && candidate.validFrom && candidate.validFrom < from || to && candidate.validTo && candidate.validTo > to) conflicts.push('La vigencia legal excede la habilitación del registro oficial.');
    const days = Array.isArray(record.days) ? [...new Set(record.days.map(Number))].filter(n => Number.isInteger(n) && n >= 0 && n <= 6) : [];
    if (days.length && candidate.daysOfWeek.some(n => !days.includes(n))) conflicts.push('Días contradictorios entre el registro y el legal.');
    candidates.push({ ...candidate, sourceActiveFrom: from, sourceActiveTo: to, sourceWebsites: [...new Set(websites)], sourceStores: stores.map(s => ({ id: String(s.refId ?? ''), name: plain(s.name) })), sourceExcludedStores: record.excludedStores ?? [], sourceCollections: record.collections ?? [], status: conflicts.length ? 'conflict' : candidate.status, reasons: [...conflicts, ...candidate.reasons], calculationEligible: false });
  }
  return { candidates, expiredRecords, excludedRecords };
}

// Only separate legal/card containers become candidates. Never parse an entire
// multi-promotion page as one offer or borrow terms from an adjacent card.
export function separateLegalCards(html) {
  const clean = String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const start = /<(article|details|div|section)\b[^>]*(?:class|data-testid)=["'][^"']*(?:legal-card|promotion-card|promo-card|benefit-card)[^"']*["'][^>]*>/gi;
  const cards = [];
  let match;
  while ((match = start.exec(clean))) {
    const tag = match[1];
    const tags = new RegExp('<' + tag + '\\b[^>]*>|<\\/' + tag + '\\s*>', 'gi');
    tags.lastIndex = start.lastIndex;
    let depth = 1, next;
    while ((next = tags.exec(clean))) {
      depth += next[0].startsWith('</') ? -1 : 1;
      if (!depth) break;
    }
    if (depth) continue;
    const block = clean.slice(match.index, tags.lastIndex);
    const title = plain(block.match(/<(?:h[1-6])\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1]);
    const terms = plain(block);
    if (terms.length >= 100 && /\d+\s*%|\d+\s*cuotas?|[23]\s*[x×]\s*[12]/i.test(terms)) cards.push({ title, terms });
    start.lastIndex = tags.lastIndex;
  }
  return cards;
}

export function publicPageCandidates(html, source, checkedAt) {
  return separateLegalCards(html).map(card => discoverBankPromotion({ ...card, chain: source.chain ?? source.name, provider: source.provider, sourceUrl: source.url, checkedAt })).filter(Boolean);
}

export function cotoCandidates(payload, source, checkedAt) {
  if (String(payload?.codigoError) !== '0' || !Array.isArray(payload.result?.promocionesSucursalesFisicas) || !Array.isArray(payload.result?.promocionesDigitales)) throw new Error('Respuesta pública multicanal de Coto inválida');
  const candidates = [];
  for (const [key, channel] of [['promocionesSucursalesFisicas','Sucursales físicas'], ['promocionesDigitales','Online']]) {
    for (const record of payload.result[key]) {
      const title = plain([record.textoDescuento,record.descripcion,record.diasVigencia].filter(Boolean).join(' · '));
      const terms = plain([title,record.observacion].filter(Boolean).join('. '));
      const candidate = discoverBankPromotion({ id: `${channel}-${record.id}`, title, terms, chain: 'Coto', sourceUrl: source.url, checkedAt });
      if (!candidate) continue;
      const reason = 'El resumen oficial no contiene el legal completo; falta contrastar vigencia, sucursales y exclusiones.';
      candidates.push({ ...candidate, channels: [channel], status: 'incomplete', calculationEligible: false, sourceRecordId: record.id, legalUrl: record.urlTerminos ?? null, reasons: [reason,...candidate.reasons], calculationBlockedReason: reason });
    }
  }
  return candidates;
}
