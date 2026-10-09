import { mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { OFFICIAL_CATALOG, OFFICIAL_DATASET_ID, inspectArchive, saveAudit } from './sepa-provenance.mjs';
import { downloadOfficialArchive } from './sepa-official.mjs';
import { productFileEvidence } from './sepa-catalog-controls.mjs';
import { argentinaDate } from './price-safety.mjs';

// Rotating resource URLs published by both official catalogs. These are links
// to the dataset itself, independent of the availability of CKAN package_show.
// Catalog IDs/revisions, publication times and sizes must never be invented.
export const DAILY_RESOURCES = Object.freeze([
  ['domingo', 'f8e75128-515a-436e-bf8d-5c63a62f2005'],
  ['lunes', '0a9069a9-06e8-4f98-874d-da5578693290'],
  ['martes', '9dc06241-cc83-44f4-8e25-c9b1636b8bc8'],
  ['miercoles', '1e92cd42-4f94-4071-a165-62c4cb2ce23c'],
  ['jueves', 'd076720f-a7f0-4af8-b1d6-1b99d5a90c14'],
  ['viernes', '91bc072a-4726-44a1-85ec-4a8467aad27e'],
  ['sabado', 'b3c3da5d-213d-41e7-8d74-f23fda0a3c30'],
].map(([day, id]) => Object.freeze({ id, name: day,
  url: `https://datos.produccion.gob.ar/dataset/${OFFICIAL_DATASET_ID}/resource/${id}/download/sepa_${day}.zip` })));

export function dailyResource(now = Date.now()) {
  const day = argentinaDate(now);
  return DAILY_RESOURCES[new Date(day + 'T12:00:00Z').getUTCDay()];
}

export async function prepareDailyArchive(workDir, options = {}) {
  const now = options.now ?? Date.now();
  const auditFile = options.auditFile ?? process.env.PROVENANCE_FILE ?? 'data/sepa-provenance.json';
  const report = { schemaVersion: 1, checkedAt: new Date(now).toISOString(), status: 'failed',
    sourceType: 'official_daily_archive', authenticity: 'not_verified',
    metadataStatus: 'catalog_revision_not_observed', dateBasis: 'product_file_footer',
    catalogReferences: [OFFICIAL_CATALOG, 'https://datos.gob.ar/dataset/precios-claros-base-sepa'],
    originalComparison: { status: 'not_performed', reason: 'Descarga HTTPS del ZIP oficial; no se cotejó una réplica' } };
  let bundle;
  try {
    if (process.env.MANUAL_ZIP_URL) throw new Error('La descarga diaria admite únicamente enlaces publicados por SEPA');
    const resource = dailyResource(now);
    if (options.resourceId && options.resourceId !== resource.id) throw new Error('El recurso solicitado no corresponde al día de Argentina');
    report.officialResource = { ...resource, revision_id: null, last_modified: null,
      identityBasis: 'published_rotating_daily_url' };
    const root = resolve(options.originalDir ?? process.env.SEPA_ORIGINAL_DIR ?? 'artifacts/sepa-originals');
    await mkdir(root, { recursive: true });
    bundle = await mkdtemp(join(root, 'daily-acquisition-'));
    report.phase = 'official_daily_archive';
    const archivePath = join(bundle, 'original.zip');
    const download = await downloadOfficialArchive(resource, archivePath);
    report.download = download.evidence;
    report.downloadedAt = download.evidence.fetchedAt;
    report.phase = 'official_daily_archive_validation';
    const folder = join(workDir, 'daily-official-payload');
    const manifest = await inspectArchive(archivePath, folder, 'original', join(bundle, 'original-manifest.json'));
    if (manifest.archive.sha256 !== download.evidence.sha256 || manifest.archive.bytes !== download.evidence.bytes) {
      throw new Error('El ZIP conservado difiere de los bytes descargados');
    }
    Object.assign(report, { archive: manifest.archive, payload: manifest.payload, files: manifest.files,
      authenticity: 'official_https_download' });
    report.phase = 'official_daily_product_dates';
    report.productFiles = [];
    for (const file of manifest.files.filter(f => /(?:^|\/)productos\.csv$/i.test(f.path))) {
      const evidence = await productFileEvidence(join(folder, file.path), new Date(now).toISOString(), now);
      report.productFiles.push({ path: file.path, ...evidence });
    }
    // Downloading today's weekday filename does not prove today's prices.
    // An old weekly rotation, future footer or undated CSV cannot open the gate.
    const current = report.productFiles.filter(f => f.accepted && f.date === argentinaDate(now));
    if (!current.length) throw new Error('El ZIP diario no contiene fechas internas válidas del día de Argentina');
    report.priceUpdatedAt = current.map(f => f.updatedAt).sort().at(-1);
    report.priceDate = argentinaDate(Date.parse(report.priceUpdatedAt));
    report.phase = 'complete';
    report.status = 'official_archive_content_checked';
    await saveAudit(join(bundle, 'provenance.json'), report);
    await saveAudit(auditFile, report);
    return { folder, resource, report, bundle, source: {
      name: 'SEPA - Precios Claros', kind: 'official_dataset', official: true,
      verificationUrl: OFFICIAL_CATALOG, resource: resource.url, officialResource: resource.url,
      resourceId: resource.id, revisionId: null, modified: report.priceUpdatedAt,
      priceDate: report.priceDate, modifiedBasis: 'product_file_footer', metadataStatus: report.metadataStatus,
      downloadedAt: report.downloadedAt, archiveSha256: manifest.archive.sha256,
      contentSha256: manifest.payload.sha256, integrityStatus: report.status,
      originalComparison: report.originalComparison.status, authenticity: report.authenticity,
    } };
  } catch (error) {
    report.status = 'failed';
    report.error = error.message;
    if (error.http) report.http = error.http;
    if (bundle) await saveAudit(join(bundle, 'provenance.json'), report);
    await saveAudit(auditFile, report);
    throw error;
  }
}
