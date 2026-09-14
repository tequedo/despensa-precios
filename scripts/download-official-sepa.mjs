import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { prepareOfficial } from '../sepa-official.mjs';

// Acquisition and audit only: never ingests prices or sends notifications.
const { values } = parseArgs({ options: {
  'resource-id': { type: 'string' }, 'compare-replica': { type: 'boolean', default: false },
  'original-dir': { type: 'string', default: 'artifacts/sepa-originals' },
  output: { type: 'string', default: 'data/sepa-official-audit.json' },
} });
const work = await mkdtemp(join(tmpdir(), 'sepa-official-'));
try {
  const { report, bundle } = await prepareOfficial(work, {
    resourceId: values['resource-id'], compareReplica: values['compare-replica'],
    originalDir: resolve(values['original-dir']), auditFile: resolve(values.output),
  });
  console.log(JSON.stringify({ status: report.status, archive: report.archive,
    originalComparison: report.originalComparison, originals: bundle, report: resolve(values.output) }));
} finally {
  await rm(work, { recursive: true, force: true });
}
