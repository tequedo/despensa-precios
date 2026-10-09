const localDay = stamp => new Date(Date.parse(stamp) - 3 * 3600000).toISOString().slice(0, 10);
const age = (stamp, now) => (Date.parse(now) - Date.parse(stamp)) / 3600000;
const isFresh = (stamp, now) => Number.isFinite(age(stamp, now)) && age(stamp, now) >= 0 && localDay(stamp) === localDay(now);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// This report does not authorize or apply a benefit. The app's independent
// basket/user checks remain necessary even for a completely audited candidate.
export function auditBenefit(candidate, generatedAt) {
  const missing = [...(candidate.reasons ?? [])];
  const add = reason => { if (!missing.includes(reason)) missing.push(reason); };
  const today = localDay(generatedAt);
  if (!isFresh(candidate.checkedAt, generatedAt)) add('La fuente no se comprobó hoy o tiene una fecha inválida/futura.');
  if (!validDate(candidate.validFrom) || !validDate(candidate.validTo) || candidate.validFrom > candidate.validTo) add('Vigencia completa no comprobada.');
  else if (today < candidate.validFrom || today > candidate.validTo) add('No vigente en la fecha del informe.');
  if (!candidate.sourceUrl || !candidate.termsHash) add('Procedencia o huella de condiciones faltante.');
  if (!candidate.daysOfWeek?.length) add('Días no comprobados.');
  if (!candidate.paymentRequirement) add('Medio de pago exacto no comprobado.');
  if (candidate.kind === 'installments') add('Cuotas: informar financiación, no restar un descuento al precio.');
  else if (!(candidate.discountPercent > 0 && candidate.discountPercent <= 100)) add('Porcentaje no comprobado.');
  if (candidate.capAmount == null && !/sin tope/i.test(candidate.capRule ?? '')) add('Tope no comprobado.');
  if (candidate.capAmount != null && (!candidate.capPeriod || !candidate.capOwner)) add('Período y titular del tope pendientes.');
  if (!candidate.geographicScope || candidate.branchEligibilityVerified !== true) add('Provincia, localidad, sucursal y canal pendientes de validación.');
  if (typeof candidate.accumulable !== 'boolean') add('Acumulación no comprobada.');
  if (candidate.exclusionsVerified !== true) add('Exclusiones por producto pendientes de validación.');
  if (candidate.status !== 'verified' || candidate.calculationEligible !== true) add(candidate.calculationBlockedReason ?? 'El candidato no está habilitado para cálculo.');
  return {
    id: candidate.id, chain: candidate.chain, provider: candidate.provider, title: candidate.title,
    kind: candidate.kind, discountPercent: candidate.discountPercent ?? null,
    installments: candidate.installments ?? null, paymentRequirement: candidate.paymentRequirement ?? null,
    retiredOnly: candidate.retiredOnly ?? false, daysOfWeek: candidate.daysOfWeek ?? [],
    validFrom: candidate.validFrom ?? null, validTo: candidate.validTo ?? null,
    capAmount: candidate.capAmount ?? null, capPeriod: candidate.capPeriod ?? null, capOwner: candidate.capOwner ?? null, capRule: candidate.capRule ?? null,
    geographicScope: candidate.geographicScope ?? null, channels: candidate.channels ?? [],
    accumulable: candidate.accumulable ?? null, sourceUrl: candidate.sourceUrl ?? null,
    checkedAt: candidate.checkedAt ?? null, termsHash: candidate.termsHash ?? null,
    sourceStatus: candidate.status ?? 'unknown', checkedToday: isFresh(candidate.checkedAt, generatedAt),
    blockedReasons: missing, auditableForCalculation: missing.length === 0, applied: false,
  };
}

export function buildPromotionMatrix({ generatedAt, sources = [], candidates = [], retailerReport = null, retailerVerified = null }) {
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('Fecha del informe inválida');
  const benefits = candidates.map(c => auditBenefit(c, generatedAt));
  const productSources = retailerReport?.sources ?? [];
  return {
    generatedAt, timezone: 'America/Argentina/Buenos_Aires',
    rule: 'Una revisión diaria no garantiza cobertura completa; condiciones incompletas, contradictorias o vencidas nunca se aplican.',
    completeCoverage: false,
    limitations: ['Fuentes públicas seleccionadas, no todas las promociones nacionales.', 'Beneficios personalizados no consultados; no se elude autenticación.', 'La elegibilidad y el tope personal se confirman en la app, no en este informe.'],
    summary: {
      publicSources: sources.length, reachableSources: sources.filter(s => s.reachable).length,
      sourcesCheckedToday: sources.filter(s => isFresh(s.checkedAt, generatedAt)).length,
      candidates: benefits.length, blocked: benefits.filter(b => b.blockedReasons.length).length,
      auditableForCalculation: benefits.filter(b => b.auditableForCalculation).length,
      productPromotions: retailerVerified?.promotions?.length ?? 0,
      productSourcesCheckedToday: productSources.filter(s => isFresh(s.checkedAt, generatedAt)).length,
    },
    sources: sources.map(s => ({
      sourceId: s.sourceId, source: s.source, chain: s.chain ?? null, url: s.url,
      checkedAt: s.checkedAt, checkedToday: isFresh(s.checkedAt, generatedAt), reachable: s.reachable,
      extractedCandidates: s.extractedCandidates ?? 0, failedSourceRecords: s.failedSourceRecords ?? 0,
      extractionStatus: !s.reachable ? 'unavailable' : s.failedSourceRecords ? 'partial' : s.extractedCandidates ? 'candidates_extracted' : 'no_conditions_extracted',
      completeCoverage: false, error: s.error ?? null,
    })),
    benefits,
    productOffers: {
      scope: retailerVerified?.scope ?? null,
      checkedAt: retailerReport?.generatedAt ?? null,
      reportAvailable: Boolean(retailerReport),
      reportCheckedToday: isFresh(retailerReport?.generatedAt, generatedAt),
      completeCoverage: false,
      sources: productSources.map(s => ({ ...s, checkedToday: isFresh(s.checkedAt, generatedAt), completeCoverage: false })),
      promotions: retailerVerified?.promotions ?? [],
      missingReportReason: retailerReport ? null : 'Sin informe de ofertas por producto disponible; no se presume una revisión hoy.',
    },
  };
}
