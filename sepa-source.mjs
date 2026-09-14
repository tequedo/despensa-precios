import { prepareReplica, saveAudit } from './sepa-provenance.mjs';
import { prepareOfficial } from './sepa-official.mjs';

export async function prepareSource(workDir) {
  const mode = process.env.SEPA_SOURCE ?? 'replica';
  if (mode === 'official') return prepareOfficial(workDir);
  if (mode === 'replica') return prepareReplica(workDir);
  const error = new Error('SEPA_SOURCE debe ser official o replica; no se cambió de fuente automáticamente');
  await saveAudit(process.env.PROVENANCE_FILE ?? 'data/sepa-provenance.json', {
    schemaVersion: 1, checkedAt: new Date().toISOString(), status: 'failed',
    sourceType: 'invalid_configuration', error: error.message,
  });
  throw error;
}
