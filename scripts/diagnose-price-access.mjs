import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { diagnosePriceAccess, recordDailyRefresh } from '../price-access-diagnostic.mjs';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const optionalJson = async path => { try { return await readJson(path); } catch { return null; } };
await mkdir('data', { recursive: true });
const diagnostic = await diagnosePriceAccess({ token: process.env.PRICE_INGEST_TOKEN, readJson });
await writeFile('data/price-access-report.json', JSON.stringify(diagnostic, null, 2) + '\n');
const acquisition = ['success', 'failure'].includes(process.env.ACQUISITION_OUTCOME)
  ? await optionalJson('data/sepa-provenance.json') : null;
const attempt = { checkedAt: new Date().toISOString(), outcome: process.env.ACQUISITION_OUTCOME ?? 'not_run',
  status: acquisition?.status ?? 'not_run', sourceType: acquisition?.sourceType ?? null,
  sourceModified: acquisition?.priceUpdatedAt ?? acquisition?.officialResource?.last_modified ?? null,
  priceDate: acquisition?.priceDate ?? null, dateBasis: acquisition?.dateBasis ?? null,
  selection: acquisition?.selection ?? null, error: acquisition?.error ?? null };
await writeFile('data/sepa-update-attempt.json', JSON.stringify(attempt, null, 2) + '\n');
const history = recordDailyRefresh(await optionalJson('data/price-refresh-history.json'), {
  diagnostic, acquisition, smoke: await optionalJson('data/price-refresh-smoke-report.json'),
  acquisitionOutcome: process.env.ACQUISITION_OUTCOME, smokeOutcome: process.env.SMOKE_OUTCOME,
  runUrl: process.env.NOTIFICATION_RUN_URL,
});
await writeFile('data/price-refresh-history.json', JSON.stringify(history, null, 2) + '\n');
console.log(JSON.stringify({ diagnosticCompleted: diagnostic.completed, freshTestProfile: diagnostic.freshTestProfile,
  priceRefreshRestored: diagnostic.priceRefreshRestored, twoConsecutiveDaysConfirmed: history.twoConsecutiveDaysConfirmed,
  step1Complete: history.step1Complete, consecutiveDaysConfirmed: history.consecutiveDaysConfirmed,
  stabilizationGoalDays: history.stabilizationGoalDays, stabilizationComplete: history.stabilizationComplete,
  officialChannelRestored: history.officialChannelRestored, changomas: diagnostic.changomas }));
if (!diagnostic.completed) process.exitCode = 1;
