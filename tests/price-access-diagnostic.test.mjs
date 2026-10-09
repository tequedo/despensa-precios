import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChango, diagnosePriceAccess, recordDailyRefresh, CONTROL_BARCODE, SITE_ORIGIN } from '../price-access-diagnostic.mjs';
import { argentinaDate } from '../price-safety.mjs';

const now = Date.parse('2026-10-02T23:30:00Z');
const store = { externalId: '11|2|1081', branch: 'ChangoMás Rawson', locality: 'Rawson', file: 'branch.json' };
const row = date => [CONTROL_BARCODE, 'Aceite Natura 1.5 L', 'Natura', '1.5 L', '', 5000, date, null, null, { barcode: CONTROL_BARCODE }];
const shard = date => ({ sourceDate: date, store, prices: [row(date)] });
const quote = date => ({ storeId: store.externalId, ean: CONTROL_BARCODE, barcode: CONTROL_BARCODE, price: 5000, validDate: date, channel: 'sucursal' });
const result = quotes => ({ status: 200, body: { data: { options: quotes } } });

test('attributes an expired ChangoMás catalogue to source freshness, including the actual stale-branch HTTP 503', () => {
  const report = classifyChango(store, shard('2026-09-22'), result([]), {
    status: 503, body: { error: 'Una sucursal elegida ya no tiene precios recientes en este radio. Volvé a elegirla.' },
  }, now);
  assert.equal(report.reason, 'expired_source_excluded');
  assert.equal(report.controlPresent, true);
  assert.equal(report.currentDayQuoteConfirmed, false);
  assert.equal(report.filteredHttpStatus, 503);
});

test('distinguishes a missing chain in unfiltered results from expiry and rejects mismatched prices', () => {
  const filtered = result([quote('2026-10-02')]);
  assert.equal(classifyChango(store, shard('2026-10-02'), result([]), filtered, now).reason, 'missing_from_unfiltered_results');
  assert.equal(classifyChango(store, shard('2026-10-02'), filtered, filtered, now).reason, 'visible');
  filtered.body.data.options[0].price = 4000;
  const wrong = classifyChango(store, shard('2026-10-02'), filtered, filtered, now);
  assert.equal(wrong.reason, 'quote_differs_from_source');
  assert.equal(wrong.currentDayQuoteConfirmed, false);
  const expired = result([quote('2026-09-22')]);
  assert.equal(classifyChango(store, shard('2026-09-22'), expired, expired, now).reason, 'unexpected_expired_quote');
});

test('a generic selected-branch 503 requires independent stale-date evidence, rather than being assumed an expiry', () => {
  const general = result([]), filtered = { status: 503, body: { error: 'Los precios no están disponibles. Probá más tarde.' } };
  assert.equal(classifyChango(store, shard('2026-09-22'), general, filtered, now).reason, 'pending_verification');
  general.body.coverage = { sourceStatus: 'stale', lastPriceDate: '2026-09-22', availableStores: 0 };
  assert.equal(classifyChango(store, shard('2026-09-22'), general, filtered, now).reason, 'expired_source_excluded');
  general.body.coverage.lastPriceDate = '2026-09-21';
  assert.equal(classifyChango(store, shard('2026-09-22'), general, filtered, now).reason, 'pending_verification');
});

test('a complete national diagnosis of stale sources is never reported as restored prices', async () => {
  const calls = [];
  const readJson = async path => path.endsWith('/index.json')
    ? { generatedAt: '2026-09-25T13:36:48Z', stores: [{ ...store, sourceDate: '2026-09-22' }] }
    : shard('2026-09-22');
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method ?? 'GET' });
    assert.equal(init.redirect, 'error');
    if (url.endsWith('/api/access')) {
      assert.equal(JSON.parse(init.body).test, true);
      assert.equal(init.headers.authorization, 'Bearer test-secret');
      return new Response('{}', { headers: { 'set-cookie': 'despensa_profile=test-cookie; HttpOnly; Secure' } });
    }
    assert.equal(init.headers.cookie, 'despensa_profile=test-cookie');
    assert.equal(init.headers.authorization, undefined);
    if (url.includes('/coverage?')) return Response.json({ sourceStatus: 'stale', lastPriceDate: '2026-09-22', stores: 0, locations: [], updatedAt: '2026-09-25T13:36:48Z' });
    if (url.includes('storeIds=')) return Response.json({ error: 'Una sucursal elegida ya no tiene precios recientes en este radio.' }, { status: 503 });
    return Response.json({ data: { options: [] }, coverage: { sourceStatus: 'stale', lastPriceDate: '2026-09-22', generatedAt: '2026-09-25T13:36:48Z' } });
  };
  const report = await diagnosePriceAccess({ token: 'test-secret', readJson, fetchImpl, now });
  assert.equal(report.completed, true);
  assert.equal(report.freshTestProfile, true);
  assert.equal(report.priceRefreshRestored, false);
  assert.equal(report.provinces.length, 24);
  assert.ok(report.provinces.every(p => p.appStores === 0));
  assert.equal(report.changomas[0].reason, 'expired_source_excluded');
  assert.equal(calls.filter(c => c.method === 'POST').length, 1);
  assert.ok(calls.every(c => c.url.startsWith(SITE_ORIGIN + '/api/')));
  assert.ok(!JSON.stringify(report).includes('test-secret'));
  assert.ok(!JSON.stringify(report).includes('test-cookie'));
});

test('access failure is recorded without exposing credentials or making authenticated price requests', async () => {
  let requests = 0;
  const report = await diagnosePriceAccess({ token: 'hidden-token', now, readJson: async () => { throw Error('unexpected'); },
    fetchImpl: async () => { requests++; return Response.json({ error: 'hidden-token' }, { status: 401 }); } });
  assert.equal(report.completed, false);
  assert.equal(report.freshTestProfile, false);
  assert.equal(requests, 1);
  assert.ok(!JSON.stringify(report).includes('hidden-token'));
});

function confirmedAttempt(time) {
  const stamp = new Date(time).toISOString(), day = argentinaDate(time);
  return { now: time, acquisitionOutcome: 'success', smokeOutcome: 'success',
    acquisition: { status: 'official_original_integrity_checked', sourceType: 'official_original', checkedAt: stamp,
      officialResource: { last_modified: day + 'T16:20:00Z', revision_id: day } },
    smoke: { success: true, checkedAt: stamp, checks: [{ pricesDatesCodesAndPhysicalBranchesMatch: true, generation: stamp }] },
    diagnostic: { checkedAt: stamp, priceRefreshRestored: true, unfiltered: { generation: stamp } },
    runUrl: 'https://github.com/tequedo/despensa-precios/actions/runs/1' };
}

test('two runs on one day do not count as two daily updates; consecutive dates do', () => {
  let history = recordDailyRefresh(null, confirmedAttempt(now));
  history = recordDailyRefresh(history, confirmedAttempt(now + 60_000));
  assert.equal(history.days.length, 1);
  assert.equal(history.step1Complete, false);
  history = recordDailyRefresh(history, confirmedAttempt(now + 86400_000));
  assert.equal(history.twoConsecutiveDaysConfirmed, true);
  assert.equal(history.step1Complete, true);
});

test('seven-day stabilization is separate from initial recovery and never counts retries or gaps', () => {
  let history = null;
  for (let i = 0; i < 7; i++) {
    const attempt = confirmedAttempt(now + i * 86400_000);
    attempt.acquisition.sourceType = 'replica';
    attempt.acquisition.status = 'replica_integrity_checked';
    history = recordDailyRefresh(history, attempt);
    history = recordDailyRefresh(history, { ...attempt, now: attempt.now + 60_000 });
    assert.equal(history.consecutiveDaysConfirmed, i + 1);
    assert.equal(history.stabilizationComplete, i === 6);
    assert.equal(history.officialChannelRestored, false);
  }
  assert.equal(history.days.length, 7);
  const failed = confirmedAttempt(now + 6 * 86400_000 + 120_000);
  failed.acquisitionOutcome = 'failure';
  history = recordDailyRefresh(history, failed);
  assert.equal(history.sevenConsecutiveDaysConfirmed, true);
  assert.equal(history.stabilizationComplete, false);
  history = recordDailyRefresh(history, confirmedAttempt(now + 8 * 86400_000));
  assert.equal(history.consecutiveDaysConfirmed, 1);
  assert.equal(history.stabilizationComplete, false);
});
test('a supplied ZIP match is not an independently authenticated official comparison', () => {
  const attempt = confirmedAttempt(now);
  attempt.acquisition.originalComparison = { status: 'matched', originalOrigin: 'provided_file_not_independently_authenticated' };
  assert.equal(recordDailyRefresh(null, attempt).latestAttempt.independentlyComparedWithOfficial, false);
  attempt.acquisition.originalComparison.originalOrigin = 'official_https_download';
  assert.equal(recordDailyRefresh(null, attempt).latestAttempt.independentlyComparedWithOfficial, true);
});
test('a direct daily archive requires an official origin and actual internal day before confirming recovery', () => {
  const attempt = confirmedAttempt(now);
  attempt.acquisition = { ...attempt.acquisition, status: 'official_archive_content_checked',
    sourceType: 'official_daily_archive', priceDate: '2026-10-02',
    dateBasis: 'product_file_footer', authenticity: 'official_https_download',
    officialResource: { last_modified: null, revision_id: null } };
  assert.equal(recordDailyRefresh(null, attempt).latestAttempt.confirmed, true);
  attempt.acquisition.priceDate = '2026-10-01';
  assert.equal(recordDailyRefresh(null, attempt).latestAttempt.confirmed, false);
  attempt.acquisition.priceDate = '2026-10-02'; attempt.acquisition.authenticity = 'not_verified';
  assert.equal(recordDailyRefresh(null, attempt).latestAttempt.confirmed, false);
});

test('stale data, skipped smoke, cache mismatch and failed later retries never masquerade as a successful daily refresh', () => {
  for (const modify of [
    a => { a.acquisition.officialResource.last_modified = '2026-09-22T16:20:00Z'; },
    a => { a.smokeOutcome = 'skipped'; },
    a => { a.diagnostic.priceRefreshRestored = false; },
    a => { a.diagnostic.unfiltered.generation = '2026-09-25T00:00:00Z'; },
    a => { a.acquisition.checkedAt = '2026-09-25T00:00:00Z'; },
  ]) {
    const a = confirmedAttempt(now); modify(a);
    assert.equal(recordDailyRefresh(null, a).latestAttempt.confirmed, false);
  }
  let history = recordDailyRefresh(null, confirmedAttempt(now));
  history = recordDailyRefresh(history, confirmedAttempt(now + 86400_000));
  const failed = confirmedAttempt(now + 86400_000 + 60_000); failed.acquisitionOutcome = 'failure';
  history = recordDailyRefresh(history, failed);
  assert.equal(history.days.at(-1).confirmed, true);
  assert.equal(history.latestAttempt.confirmed, false);
  assert.equal(history.step1Complete, false);
  const gap = recordDailyRefresh(recordDailyRefresh(null, confirmedAttempt(now)), confirmedAttempt(now + 2 * 86400_000));
  assert.equal(gap.step1Complete, false);
});
