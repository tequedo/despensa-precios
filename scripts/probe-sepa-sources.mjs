import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareSource } from '../sepa-source.mjs';

// Acquisition only: no ingestion tokens, price writes, commits or notifications.
const work = await mkdtemp(join(tmpdir(), 'sepa-source-probe-'));
const auditFile = process.env.SEPA_PROBE_FILE ?? 'data/sepa-source-probe.json';
try {
  const acquired = await prepareSource(work, { mode: 'auto', auditFile });
  console.log(JSON.stringify({ acceptedSource: acquired.report.selection.selected,
    sourceModified: acquired.source.modified, status: acquired.report.status,
    appUpdated: false }));
} catch {
  const report = JSON.parse(await readFile(auditFile, 'utf8'));
  console.error(JSON.stringify({ acceptedSource: null, status: 'failed', appUpdated: false,
    attempts: report.selection?.attempts }));
  process.exitCode = 1;
} finally { await rm(work, { recursive: true, force: true }); }
