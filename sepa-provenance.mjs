import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
export const METADATA_URL = 'https://raw.githubusercontent.com/catdevnull/sepa-precios-metadata/main/dataset-info.json';
export const INDEX_URL = 'https://raw.githubusercontent.com/catdevnull/sepa-precios-metadata/main/index.json';
export const OFFICIAL_CATALOG = 'https://datos.produccion.gob.ar/dataset/sepa-precios';
export const OFFICIAL_DATASET_ID = '6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5';
const hash = text => createHash('sha256').update(text).digest('hex');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)?$/.test(value)) throw new Error('Fecha SEPA ausente o inválida');
  const date = new Date(/[Z]|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error('Fecha SEPA inválida');
  return date.toISOString();
}

export function validateResource(resource, now = new Date()) {
  if (!uuid.test(resource?.id) || !uuid.test(resource?.revision_id)) throw new Error('Identidad del recurso SEPA inválida');
  const url = new URL(resource.url);
  const prefix = `/dataset/${OFFICIAL_DATASET_ID}/resource/${resource.id}/download/`;
  if (url.origin !== 'https://datos.produccion.gob.ar' || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix) || !/^sepa_[a-z]+\.zip$/.test(url.pathname.slice(prefix.length))) throw new Error('URL de origen SEPA no reconocida');
  if (!Number.isSafeInteger(resource.size) || resource.size <= 0) throw new Error('Tamaño original SEPA inválido');
  const modified = timestamp(resource.last_modified);
  if (+new Date(modified) > +now || +now - +new Date(modified) > 72 * 3600_000) throw new Error('Recurso SEPA futuro o con más de 72 horas');
  return { ...resource, last_modified: modified };
}

export function selectResource(metadata, now = new Date(), resourceId) {
  if (!metadata?.success || metadata.result?.id !== OFFICIAL_DATASET_ID) throw new Error('Metadatos de otro conjunto de datos');
  const resources = (metadata.result.resources ?? []).filter(r => /\.zip$/.test(r.url ?? '')).sort((a, b) => String(b.last_modified).localeCompare(String(a.last_modified)));
  const resource = resourceId ? resources.find(r => r.id === resourceId) : resources[0];
  return validateResource(resource, now);
}

export function replicaEntry(index, resource) {
  const id = `${resource.id}-revID-${resource.revision_id}`;
  const filename = `${id}-${new URL(resource.url).pathname.split('/').at(-1)}-repackaged.tar.zst`;
  const expected = `https://f004.backblazeb2.com/file/precios-justos-datasets/${filename}`;
  const matches = Object.values(index).flat().filter(entry => entry.id === id && entry.link);
  if (matches.length !== 1 || matches[0].link !== expected || matches[0].name !== filename) throw new Error('La réplica no coincide con el recurso y revisión seleccionados');
  const entry = matches[0];
  timestamp(entry.firstSeenAt);
  if (+new Date(entry.firstSeenAt) < +new Date(resource.last_modified) || +new Date(entry.firstSeenAt) > Date.now()) throw new Error('Fecha de archivo de réplica incoherente');
  if (entry.warnings?.trim()) throw new Error(`La réplica declara advertencias: ${entry.warnings}`);
  return entry;
}

export function validateEmbedded(manifest, resource) {
  const data = manifest.embeddedMetadata?.value;
  if (!data?.success || data.result?.id !== OFFICIAL_DATASET_ID) throw new Error('Metadatos internos SEPA ausentes o de otro conjunto');
  const matches = data.result.resources.filter(r => r.id === resource.id);
  if (matches.length !== 1) throw new Error('Recurso duplicado o ausente dentro de la réplica');
  for (const key of ['id', 'revision_id', 'url', 'size']) if (matches[0][key] !== resource[key]) throw new Error(`Metadatos internos distintos: ${key}`);
  if (timestamp(matches[0].last_modified) !== timestamp(resource.last_modified)) throw new Error('Fecha interna distinta de la seleccionada');
}

export function compareManifests(original, replica) {
  const expected = new Map(original.files.map(file => [file.path, file]));
  const actual = new Map(replica.files.map(file => [file.path, file]));
  if (expected.size !== original.files.length || actual.size !== replica.files.length) throw new Error('Manifiesto con rutas duplicadas');
  const missing = [], added = [], changed = [];
  for (const [name, file] of expected) {
    if (!actual.has(name)) missing.push(name);
    else if (actual.get(name).bytes !== file.bytes || actual.get(name).sha256 !== file.sha256) changed.push(name);
  }
  for (const name of actual.keys()) if (!expected.has(name)) added.push(name);
  return { status: missing.length || added.length || changed.length ? 'mismatch' : 'matched', missing, added, changed,
    comparedFiles: expected.size, originalArchiveSha256: original.archive.sha256, replicaArchiveSha256: replica.archive.sha256 };
}

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!response.ok) throw new Error(`Metadatos SEPA: HTTP ${response.status}`);
  const text = await response.text();
  if (Buffer.byteLength(text) > 10_000_000) throw new Error('Metadatos demasiado grandes');
  return { value: JSON.parse(text), evidence: { url, sha256: hash(text), fetchedAt: new Date().toISOString(), etag: response.headers.get('etag') } };
}

export async function inspectArchive(archive, folder, role, manifestFile) {
  await exec('python3', [new URL('./scripts/sepa_archive.py', import.meta.url).pathname, '--archive', archive, '--output', folder, '--role', role, '--manifest', manifestFile], { maxBuffer: 1024 * 1024 });
  return JSON.parse(await readFile(manifestFile, 'utf8'));
}

export async function saveAudit(path, report) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
  await rename(temporary, path);
}

export async function prepareReplica(workDir, options = {}) {
  const auditFile = options.auditFile ?? process.env.PROVENANCE_FILE ?? 'data/sepa-provenance.json';
  const report = { schemaVersion: 1, checkedAt: new Date().toISOString(), status: 'failed', sourceType: 'replica', originalComparison: { status: 'not_performed', reason: 'No se obtuvo un original por un canal oficial independiente' } };
  try {
    if (process.env.MANUAL_ZIP_URL) throw new Error('MANUAL_ZIP_URL ya no admite atribuir origen oficial ni fecha de hoy a un ZIP sin evidencia. Usar el cotejo de archivos separado.');
    const metadata = options.metadata ?? await getJson(METADATA_URL);
    const index = options.index ?? await getJson(INDEX_URL);
    const resource = selectResource(metadata.value, new Date(), options.resourceId);
    const entry = replicaEntry(index.value, resource);
    Object.assign(report, { officialResource: resource, replica: entry, metadata: metadata.evidence, index: index.evidence });
    const archive = options.archive ?? join(workDir, 'sepa.tar.zst');
    if (!options.archive) await exec('curl', ['--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--connect-timeout', '20', '--max-time', '600', '--output', archive, entry.link], { maxBuffer: 1024 * 1024 });
    report.downloadedAt = options.archive ? options.downloadedAt ?? null : new Date().toISOString();
    const folder = join(workDir, 'payload');
    const manifest = await inspectArchive(archive, folder, 'replica', join(workDir, 'replica-manifest.json'));
    validateEmbedded(manifest, resource);
    Object.assign(report, { archive: manifest.archive, payload: manifest.payload, files: manifest.files, embeddedMetadataSha256: manifest.embeddedMetadata.sha256 });
    if (options.originalArchive) {
      const original = await inspectArchive(options.originalArchive, join(workDir, 'original'), 'original', join(workDir, 'original-manifest.json'));
      if (original.archive.bytes !== resource.size) throw new Error('El tamaño del ZIP aportado difiere del original declarado');
      report.originalComparison = { ...compareManifests(original, manifest), originalOrigin: 'provided_file_not_independently_authenticated' };
      if (report.originalComparison.status === 'mismatch') throw new Error('La réplica y el ZIP aportado tienen contenido diferente');
    }
    report.status = 'replica_integrity_checked';
    report.authenticity = 'not_independently_verified';
    if (process.env.REQUIRE_ORIGINAL_AUTHENTICITY === '1') throw new Error('La procedencia del original requiere evidencia oficial independiente; se conserva la generación anterior');
    await saveAudit(auditFile, report);
    return { folder, resource, report, source: {
      name: 'SEPA - Precios Claros', kind: 'dataset_replica', official: false,
      verificationUrl: OFFICIAL_CATALOG, resource: entry.link, modified: resource.last_modified,
      officialResource: resource.url, resourceId: resource.id, revisionId: resource.revision_id,
      downloadedAt: report.downloadedAt, archiveSha256: manifest.archive.sha256,
      contentSha256: manifest.payload.sha256, integrityStatus: report.status,
      originalComparison: report.originalComparison.status, authenticity: report.authenticity,
    } };
  } catch (error) {
    report.status = 'failed'; report.error = error.message;
    await saveAudit(auditFile, report);
    throw error;
  }
}
