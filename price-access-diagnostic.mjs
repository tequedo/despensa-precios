import { PROVINCES, argentinaDate, freshDate, isoDate } from './price-safety.mjs';

export const CONTROL_BARCODE = '7790272001029';
export const SITE_ORIGIN = 'https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site';
const isChango = id => /^11\|[25]\|/.test(String(id));
const options = result => result?.status === 200 && Array.isArray(result.body?.data?.options) ? result.body.data.options : [];

export function classifyChango(store, shard, general, filtered, now = Date.now()) {
  const row = shard.prices.find(row => row[9]?.barcode === CONTROL_BARCODE);
  const quotes = options(filtered).filter(q => q.storeId === store.externalId);
  const exact = row ? quotes.filter(q => q.ean === row[0] && q.barcode === CONTROL_BARCODE && q.price === row[5]
    && q.validDate === row[6] && q.validDate === shard.sourceDate && q.channel === 'sucursal') : [];
  const fresh = freshDate(shard.sourceDate, now);
  const staleMessage = filtered.status === 503 && /ya no tiene precios recientes/.test(filtered.body?.error ?? '');
  // The production route may mask the selected-branch error with its generic
  // 503. Attribute expiry only when the successful, unfiltered API response
  // independently confirms the same stale date and zero available stores.
  const staleCoverage = general.status === 200 && general.body?.coverage?.sourceStatus === 'stale'
    && general.body.coverage.lastPriceDate === shard.sourceDate && general.body.coverage.availableStores === 0;
  let reason = 'pending_verification';
  if (!row) reason = 'control_product_missing_from_source';
  else if (!fresh && (quotes.length || filtered.status === 200 && options(filtered).length)) reason = 'unexpected_expired_quote';
  else if (!fresh && (staleMessage || filtered.status === 200 || filtered.status === 503 && staleCoverage)) reason = 'expired_source_excluded';
  else if (fresh && quotes.length && exact.length !== quotes.length) reason = 'quote_differs_from_source';
  else if (exact.length) reason = options(general).some(q => isChango(q.storeId)) ? 'visible' : 'missing_from_unfiltered_results';
  else if (filtered.status === 200) reason = 'missing_matching_quote';
  return {
    storeId: store.externalId, branch: store.branch, locality: store.locality,
    sourceDate: shard.sourceDate, sourceRows: shard.prices.length, controlPresent: Boolean(row),
    sourceWithinAgeLimit: fresh, unfilteredHttpStatus: general.status, filteredHttpStatus: filtered.status,
    filteredQuotes: quotes.length, exactSourceMatches: exact.length, reason,
    currentDayQuoteConfirmed: fresh && exact.length > 0 && row[6] === argentinaDate(now),
  };
}

// No ingestion, preference changes or notification requests. The only write to
// the app is creation of its existing, explicitly flagged technical test profile.
export async function diagnosePriceAccess({ token, readJson, fetchImpl = fetch, now = Date.now(), origin = SITE_ORIGIN }) {
  if (origin !== SITE_ORIGIN || !token) throw new Error('Configuración de diagnóstico inválida');
  const report = { schemaVersion: 1, checkedAt: new Date(now).toISOString(), completed: false,
    freshTestProfile: false, priceRefreshRestored: false, provinces: [], changomas: [] };
  let cookie;
  const request = async (path, init = {}) => {
    const response = await fetchImpl(origin + path, { ...init, redirect: 'error', signal: AbortSignal.timeout(30_000),
      headers: { origin, ...(cookie ? { cookie } : {}), ...init.headers } });
    let body = {}; try { body = await response.json(); } catch { /* invalid API response remains an unsuccessful check */ }
    return { status: response.status, body, response };
  };
  try {
    const access = await request('/api/access', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Prueba técnica de acceso a precios', test: true }) });
    if (access.status !== 200) throw new Error(`No se creó el perfil técnico: HTTP ${access.status}`);
    cookie = access.response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    if (!cookie.includes('despensa_profile=')) throw new Error('Falta la sesión del perfil técnico');
    report.freshTestProfile = true;
    // Four requests at a time keeps the national check bounded.
    for (let start = 0; start < PROVINCES.length; start += 4) {
      const batch = await Promise.all(PROVINCES.slice(start, start + 4).map(async province => {
        const index = await readJson(`data/national/${province.code}/index.json`);
        const result = await request('/api/prices/coverage?province=' + province.code);
        const body = result.body;
        return { code: province.code, name: province.name, catalogueStores: index.stores.length,
          catalogueLocalityLabels: [...new Set(index.stores.map(s => s.locality))].length,
          catalogueSourceDates: [...new Set(index.stores.map(s => s.sourceDate))].sort(),
          catalogueWithinAgeLimit: index.stores.filter(s => freshDate(s.sourceDate, now)).length,
          httpStatus: result.status, appSourceStatus: body.sourceStatus ?? null, appLastPriceDate: body.lastPriceDate ?? null,
          appStores: Number.isInteger(body.stores) ? body.stores : null,
          appCoveredLocalities: Array.isArray(body.locations) ? body.locations.length : null,
          appGeneration: body.updatedAt ?? null, matchesCatalogueGeneration: body.updatedAt === index.generatedAt };
      }));
      report.provinces.push(...batch);
    }
    const index = await readJson('data/national/AR-J/index.json');
    const scope = { province: 'AR-J', locality: 'San Juan', lat: '-31.534016', lon: '-68.524744', best: 'producto' };
    const query = params => request('/api/prices?' + new URLSearchParams({ ...scope, ...params }));
    const general = await query({ ean: CONTROL_BARCODE });
    report.unfiltered = { httpStatus: general.status, quotes: options(general).length,
      sourceStatus: general.body.coverage?.sourceStatus ?? null, lastPriceDate: general.body.coverage?.lastPriceDate ?? null,
      availableStores: general.body.coverage?.availableStores ?? null,
      generation: general.body.coverage?.generatedAt ?? null };
    for (const store of index.stores.filter(s => isChango(s.externalId))) {
      const shard = await readJson(`data/national/AR-J/${store.file}`);
      const row = shard.prices.find(row => row[9]?.barcode === CONTROL_BARCODE);
      const filtered = row ? await query({ ean: row[0], storeIds: store.externalId }) : { status: null, body: {} };
      report.changomas.push(classifyChango(store, shard, general, filtered, now));
    }
    report.completed = report.provinces.length === 24 && report.provinces.every(p => p.httpStatus === 200 && p.matchesCatalogueGeneration)
      && general.status === 200 && report.changomas.length > 0
      && report.changomas.every(s => ['visible', 'missing_from_unfiltered_results', 'expired_source_excluded', 'missing_matching_quote', 'quote_differs_from_source', 'unexpected_expired_quote', 'control_product_missing_from_source'].includes(s.reason));
    report.priceRefreshRestored = report.completed && report.provinces.every(p => p.appStores > 0 && p.appSourceStatus === 'current')
      && report.changomas.every(s => s.reason === 'visible' && s.currentDayQuoteConfirmed);
  } catch {
    // Neither cookies, bearer tokens nor untrusted server bodies enter a public report.
    report.error = 'No se completó el diagnóstico; revisar el estado HTTP de las comprobaciones.';
  }
  return report;
}

export function recordDailyRefresh(history, { diagnostic, acquisition, smoke, acquisitionOutcome, smokeOutcome, now = Date.now(), runUrl }) {
  const day = argentinaDate(now);
  const directDaily = acquisition?.sourceType === 'official_daily_archive';
  const sourceDate = directDaily ? isoDate(acquisition?.priceDate) : isoDate(acquisition?.officialResource?.last_modified);
  const validAcquisition = ['official_original_integrity_checked', 'replica_integrity_checked'].includes(acquisition?.status)
    || acquisition?.status === 'official_archive_content_checked' && directDaily
      && acquisition.dateBasis === 'product_file_footer' && acquisition.authenticity === 'official_https_download';
  const recent = value => Number.isFinite(Date.parse(value)) && now - Date.parse(value) >= 0 && now - Date.parse(value) <= 90 * 60_000;
  const positiveChecks = smoke?.checks?.filter(c => c.pricesDatesCodesAndPhysicalBranchesMatch) ?? [];
  const confirmed = acquisitionOutcome === 'success' && smokeOutcome === 'success'
    && validAcquisition
    && sourceDate === day && recent(acquisition.checkedAt) && recent(smoke?.checkedAt) && smoke?.success === true
    && diagnostic?.priceRefreshRestored === true && recent(diagnostic.checkedAt)
    && positiveChecks.length > 0 && positiveChecks.every(c => c.generation === diagnostic.unfiltered?.generation);
  const current = { day, checkedAt: new Date(now).toISOString(), confirmed, sourceDate,
    sourceType: acquisition?.sourceType ?? null, revisionId: acquisition?.officialResource?.revision_id ?? null,
    appGeneration: diagnostic?.unfiltered?.generation ?? null, runUrl };
  const days = (history?.days ?? []).filter(d => d.day !== day || !confirmed && d.confirmed);
  // A later failed retry must remain visible without erasing a successful daily observation.
  if (confirmed || !days.some(d => d.day === day)) days.push(current);
  days.sort((a, b) => a.day.localeCompare(b.day));
  const previous = new Date(Date.parse(day + 'T00:00:00Z') - 86400_000).toISOString().slice(0, 10);
  const twoConsecutiveDaysConfirmed = days.some(d => d.day === previous && d.confirmed) && days.some(d => d.day === day && d.confirmed);
  return { schemaVersion: 1, checkedAt: current.checkedAt, latestAttempt: current,
    twoConsecutiveDaysConfirmed, step1Complete: confirmed && twoConsecutiveDaysConfirmed, days: days.slice(-14) };
}
