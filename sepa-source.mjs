import { prepareReplica, saveAudit } from './sepa-provenance.mjs';
import { prepareOfficial } from './sepa-official.mjs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Explicit single-source modes never silently change origin. The daily workflow
// opts into auto: our official downloader first, the disclosed replica second.
export async function prepareSource(workDir, options = {}, providers = {}) {
  const mode = options.mode ?? process.env.SEPA_SOURCE ?? 'replica';
  const auditFile = options.auditFile ?? process.env.PROVENANCE_FILE ?? 'data/sepa-provenance.json';
  const official = providers.official ?? prepareOfficial;
  const replica = providers.replica ?? prepareReplica;
  if (mode === 'official') return official(workDir, { ...options, auditFile });
  if (mode === 'replica') return replica(workDir, { ...options, auditFile });
  if (mode === 'auto') {
    const attempts = [];
    for (const [name, prepare] of [['official', official], ['replica', replica]]) {
      const attemptFile = join(dirname(auditFile), `sepa-attempt-${name}.json`);
      const startedAt = new Date().toISOString();
      let result;
      try {
        result = await prepare(workDir, { ...options, auditFile: attemptFile });
      } catch (error) {
        let evidence;
        try { evidence = JSON.parse(await readFile(attemptFile, 'utf8')); } catch { /* provider failed before audit */ }
        attempts.push({ source: name, startedAt, status: 'failed', error: error.message,
          phase: evidence?.phase, sourceModified: evidence?.officialResource?.last_modified });
        continue;
      }
      // Keep the accepted provider's source identity, timestamps and integrity
      // exactly as validated. Checking today never means prices are from today.
      attempts.push({ source: name, startedAt, status: result.report.status,
        sourceModified: result.resource.last_modified });
      result.report.selection = { mode, selected: name, attempts };
      await saveAudit(auditFile, result.report);
      return result;
    }
    const error = new Error(`No se obtuvo un archivo SEPA válido. ${attempts.map(a => `${a.source}: ${a.error}`).join('; ')}`);
    await saveAudit(auditFile, { schemaVersion: 1, checkedAt: new Date().toISOString(),
      status: 'failed', sourceType: 'none_accepted', selection: { mode, selected: null, attempts }, error: error.message });
    throw error;
  }
  const error = new Error('SEPA_SOURCE debe ser official, replica o auto; no se cambió de fuente automáticamente');
  await saveAudit(auditFile, {
    schemaVersion: 1, checkedAt: new Date().toISOString(), status: 'failed',
    sourceType: 'invalid_configuration', error: error.message,
  });
  throw error;
}
