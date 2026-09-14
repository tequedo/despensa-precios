import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { prepareReplica } from '../sepa-provenance.mjs';

// Read-only audit: this entry point never invokes ingestion or notifications.
const { values } = parseArgs({ options: {
  replica: { type: 'string' }, original: { type: 'string' },
  'resource-id': { type: 'string' }, output: { type: 'string', default: 'data/sepa-provenance-audit.json' },
} });
const work = await mkdtemp(join(tmpdir(), 'sepa-audit-'));
try {
  const { report } = await prepareReplica(work, {
    archive: values.replica ? resolve(values.replica) : undefined,
    originalArchive: values.original ? resolve(values.original) : undefined,
    resourceId: values['resource-id'], auditFile: resolve(values.output),
    downloadedAt: values.replica ? null : undefined,
  });
  console.log(JSON.stringify({ status: report.status, archive: report.archive, payload: report.payload, originalComparison: report.originalComparison, report: resolve(values.output) }));
} finally {
  await rm(work, { recursive: true, force: true });
}
