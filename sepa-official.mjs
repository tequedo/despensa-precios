import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, open, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  OFFICIAL_CATALOG, METADATA_URL, INDEX_URL, selectResource,
  replicaEntry, validateEmbedded, inspectArchive, compareManifests, saveAudit,
} from './sepa-provenance.mjs';

export const OFFICIAL_METADATA_URL = 'https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios';
const MAX_ARCHIVE_BYTES = 4 * 1024 ** 3;

// Only callers with a fixed catalog URL or a validated resource/index can reach
// this function. Never follow redirects, accept a proxy override or disable TLS.
async function receive(url, path, { maximum, expected, timeout }) {
  const startedAt = new Date().toISOString();
  const response = await fetch(url, {
    redirect: 'error', signal: AbortSignal.timeout(timeout),
    headers: {
      accept: path.endsWith('.json') ? 'application/json' : 'application/zip, application/octet-stream',
      'accept-encoding': 'identity',
    },
  });
  let file;
  const temporary = `${path}.partial`;
  try {
    if (!response.ok) throw new Error(`Descarga SEPA: HTTP ${response.status} (${new URL(url).hostname})`);
    if (response.url !== url) throw new Error('La respuesta no proviene de la URL solicitada');
    const encoding = response.headers.get('content-encoding');
    if (encoding && encoding !== 'identity') throw new Error('Se rechazó una transformación HTTP del archivo');
    const length = response.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maximum || (expected !== undefined && Number(length) !== expected))) {
      throw new Error('Tamaño HTTP distinto del recurso esperado o fuera de límite');
    }
    if (!response.body) throw new Error('Descarga sin contenido');
    file = await open(temporary, 'wx');
    const hash = createHash('sha256');
    const chunks = path.endsWith('.json') ? [] : null;
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > maximum || (expected !== undefined && bytes > expected)) throw new Error('La descarga supera el tamaño permitido');
      hash.update(chunk);
      await file.writeFile(chunk);
      if (chunks) chunks.push(chunk);
    }
    if (!bytes || (expected !== undefined && bytes !== expected) || (length !== null && bytes !== Number(length))) {
      throw new Error('Descarga vacía, truncada o de tamaño diferente');
    }
    const value = chunks ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
    await file.sync();
    await file.close();
    file = undefined;
    await rename(temporary, path);
    return { value, evidence: {
      url, startedAt, fetchedAt: new Date().toISOString(), bytes,
      sha256: hash.digest('hex'), status: response.status,
      etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified'),
    } };
  } finally {
    if (file) await file.close();
    if (!response.bodyUsed) await response.body?.cancel();
    await rm(temporary, { force: true });
  }
}

const json = (url, path) => receive(url, path, { maximum: 10_000_000, timeout: 30_000 });

export function assertSameResource(before, after) {
  for (const key of ['id', 'revision_id', 'url', 'size', 'last_modified', 'hash']) {
    if ((before[key] ?? '') !== (after[key] ?? '')) throw new Error(`El recurso oficial cambió durante la descarga: ${key}`);
  }
}

export async function prepareOfficial(workDir, options = {}) {
  const auditFile = options.auditFile ?? process.env.PROVENANCE_FILE ?? 'data/sepa-provenance.json';
  const report = {
    schemaVersion: 1, checkedAt: new Date().toISOString(), status: 'failed',
    sourceType: 'official_original', authenticity: 'not_verified',
    originalComparison: { status: 'not_performed', reason: 'No se solicitó comparar una réplica' },
  };
  let bundle;
  try {
    if (process.env.MANUAL_ZIP_URL) throw new Error('Una URL aportada no sustituye la adquisición desde el catálogo oficial');
    const root = resolve(options.originalDir ?? process.env.SEPA_ORIGINAL_DIR ?? 'artifacts/sepa-originals');
    await mkdir(root, { recursive: true });
    bundle = await mkdtemp(join(root, 'acquisition-'));
    report.phase = 'official_metadata_before';
    const before = await json(OFFICIAL_METADATA_URL, join(bundle, 'metadata-before.json'));
    report.metadata = before.evidence;
    const resource = selectResource(before.value, new Date(), options.resourceId);
    report.officialResource = resource;
    if (resource.size > MAX_ARCHIVE_BYTES) throw new Error('El ZIP oficial supera el límite de 4 GiB');

    report.phase = 'official_archive';
    const archivePath = join(bundle, 'original.zip');
    const download = await receive(resource.url, archivePath, { maximum: MAX_ARCHIVE_BYTES, expected: resource.size, timeout: 20 * 60_000 });
    report.download = download.evidence;
    report.downloadedAt = download.evidence.fetchedAt;

    report.phase = 'official_metadata_after';
    const after = await json(OFFICIAL_METADATA_URL, join(bundle, 'metadata-after.json'));
    report.metadataAfter = after.evidence;
    assertSameResource(resource, selectResource(after.value, new Date(), resource.id));

    report.phase = 'official_archive_validation';
    const folder = join(workDir, 'official-payload');
    const original = await inspectArchive(archivePath, folder, 'original', join(bundle, 'original-manifest.json'));
    if (original.archive.sha256 !== download.evidence.sha256 || original.archive.bytes !== resource.size) {
      throw new Error('El ZIP conservado difiere de los bytes descargados');
    }
    Object.assign(report, { archive: original.archive, payload: original.payload, files: original.files, authenticity: 'official_https_download' });

    if (options.compareReplica) {
      report.phase = 'replica_comparison';
      report.originalComparison = { status: 'not_performed', reason: 'Comparación solicitada, todavía sin completar' };
      const metadata = await json(METADATA_URL, join(bundle, 'replica-metadata.json'));
      assertSameResource(resource, selectResource(metadata.value, new Date(), resource.id));
      const index = await json(INDEX_URL, join(bundle, 'replica-index.json'));
      const entry = replicaEntry(index.value, resource);
      report.replica = { ...entry, metadata: metadata.evidence, index: index.evidence };
      const replicaPath = join(workDir, 'replica.tar.zst');
      report.replica.download = (await receive(entry.link, replicaPath, { maximum: MAX_ARCHIVE_BYTES, timeout: 20 * 60_000 })).evidence;
      const replica = await inspectArchive(replicaPath, join(workDir, 'replica-payload'), 'replica', join(bundle, 'replica-manifest.json'));
      validateEmbedded(replica, resource);
      report.originalComparison = { ...compareManifests(original, replica), originalOrigin: 'official_https_download' };
      if (report.originalComparison.status !== 'matched') throw new Error('El contenido de la réplica difiere del original oficial');
    }

    report.phase = 'complete';
    report.status = 'official_original_integrity_checked';
    await saveAudit(join(bundle, 'provenance.json'), report);
    await saveAudit(auditFile, report);
    return { folder, resource, report, bundle, source: {
      name: 'SEPA - Precios Claros', kind: 'official_dataset', official: true,
      verificationUrl: OFFICIAL_CATALOG, resource: resource.url, modified: resource.last_modified,
      officialResource: resource.url, resourceId: resource.id, revisionId: resource.revision_id,
      downloadedAt: report.downloadedAt, archiveSha256: original.archive.sha256,
      contentSha256: original.payload.sha256, integrityStatus: report.status,
      originalComparison: report.originalComparison.status, authenticity: report.authenticity,
    } };
  } catch (error) {
    report.status = 'failed';
    report.error = error.message;
    if (bundle) await saveAudit(join(bundle, 'provenance.json'), report);
    await saveAudit(auditFile, report);
    throw error;
  }
}
