import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { requestProcessNotification } from '../notify-process-request.mjs';

async function scriptFixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), 'notification-flow-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(join(cwd, 'data/national'), { recursive: true });
  const json = (path, value) => writeFile(join(cwd, path), JSON.stringify(value));
  await writeFile(join(cwd, 'data/san-juan.ndjson'), '{}\n{}\n');
  await json('data/national/coverage.json', { geographyVerified: true, provinces: [{ stores: 1, records: 2 }] });
  await json('data/retailer-promotions-verified.json', { promotions: [{}] });
  await json('data/retailer-promotion-sources.json', { sources: [{ reachable: true }] });
  await json('data/wallet-benefits-verified.json', { benefits: [{ calculationEligible: true }] });
  await json('data/wallet-benefit-sources.json', { sources: [{ reachable: true }] });
  const loader = join(cwd, 'mock.mjs');
  await writeFile(loader, `import {appendFile} from 'node:fs/promises';
globalThis.fetch = async (url, options) => {
 if (!String(url).startsWith('https://notify.example.invalid/')) throw new Error('Unexpected network request');
 const body = options.body ? JSON.parse(options.body) : {};
 await appendFile('requests.jsonl',JSON.stringify(body)+'\\n');
 const result = process.env.TEST_RESPONSE ? JSON.parse(process.env.TEST_RESPONSE) : {kind:body.kind,status:body.status,recorded:true,notified:false};
 return Response.json(result,{status:Number(process.env.TEST_HTTP_STATUS||200)});
};`);
  const run = (name, env = {}) => spawnSync(process.execPath, ['--import', loader, new URL('../' + name, import.meta.url).pathname], {
    cwd, encoding: 'utf8', env: { ...process.env, NOTIFICATION_ENDPOINT: 'https://notify.example.invalid/process',
      ACCESS_EVENTS_URL: 'https://notify.example.invalid/access', PRICE_INGEST_TOKEN: 'mock-only',
      NOTIFICATION_RUN_ID: 'run:1', GITHUB_STEP_SUMMARY: join(cwd, 'summary.md'), ...env },
  });
  const requests = async () => (await readFile(join(cwd, 'requests.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  return { cwd, run, requests };
}

test('completed workflow records all three categories for the daily digest', async t => {
  const f = await scriptFixture(t), result = f.run('notify-completed.mjs');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await f.requests()).map(r => [r.kind,r.status]), [['sepa','success'],['promotions','success'],['benefits','success']]);
  const report = JSON.parse(await readFile(join(f.cwd,'data/notification-status.json')));
  assert.equal(report.priceCount, 2); assert.equal(report.notificationStatus,'recorded_for_daily_summary');
  assert.equal(report.processes.length, 3); assert.equal(report.notified, false);
});

test('standalone wallet results do not depend on price files', async t => {
  const f = await scriptFixture(t);
  await rm(join(f.cwd,'data/national'), { recursive:true });
  const result = f.run('notify-completed.mjs', {NOTIFICATION_KINDS:'benefits'});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await f.requests()).map(r => r.kind), ['benefits']);
});

test('failure notifier preserves the supplied category and run attempt', async t => {
  const f = await scriptFixture(t), result = f.run('notify-failed.mjs', {NOTIFICATION_KIND:'benefits'});
  assert.equal(result.status, 0, result.stderr);
  const [request] = await f.requests();
  assert.equal(request.kind,'benefits'); assert.equal(request.status,'failed'); assert.equal(request.runId,'run:1');
});

test('transient process registration errors retry the same event; auth errors do not', async () => {
  const input={endpoint:'https://notify.example.invalid/process',token:'mock',kind:'benefits',status:'failed',runId:'run:1'};
  const calls=[];
  const receipt=await requestProcessNotification(input,{delay:async()=>{},fetchImpl:async (_,options)=>{
    calls.push(JSON.parse(options.body));
    return calls.length<3?new Response('',{status:503}):Response.json({kind:'benefits',status:'failed',recorded:true,notified:false});
  }});
  assert.equal(calls.length,3); assert.deepEqual(calls[0],calls[2]); assert.equal(receipt.notificationStatus,'pending_retry');
  let authCalls=0;
  await assert.rejects(requestProcessNotification(input,{delay:async()=>{},fetchImpl:async()=>{authCalls++;return new Response('',{status:401});}}));
  assert.equal(authCalls,1);
});

test('polling reports daily sends even when no immediate alerts were pending', async t => {
  const f = await scriptFixture(t);
  const empty={found:0,sent:0,failed:0,errors:[]};
  const result=f.run('notify-access.mjs',{TEST_RESPONSE:JSON.stringify({ok:true,found:0,sent:0,immediate:{access:empty,usage:empty,processes:empty},digests:{found:1,sent:1,failed:0,results:[{date:'2026-09-14',sent:true}]},errors:[]})});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).digests.sent,1);
  assert.match(await readFile(join(f.cwd,'summary.md'),'utf8'),/2026-09-14: resumen enviado/);
});

test('partial polling failures remain visible and fail the workflow', async t => {
  const f=await scriptFixture(t);
  const result=f.run('notify-access.mjs',{TEST_HTTP_STATUS:'503',TEST_RESPONSE:JSON.stringify({ok:false,found:1,sent:0,immediate:{processes:{found:1,sent:0,failed:1}},digests:{found:1,sent:1,failed:0,results:[]},errors:['pending']})});
  assert.notEqual(result.status,0);
  assert.equal(JSON.parse(result.stdout).digests.sent,1);
  assert.equal(JSON.parse(result.stdout).ok,false);
});

test('both workflows notify failures after the entire producer job has finished', async () => {
  for(const [file,job,kind] of [['update-prices.yml','actualizar','sepa'],['update-wallet-benefits.yml','verificar','benefits']]) {
    const yaml=await readFile(new URL('../.github/workflows/'+file,import.meta.url),'utf8');
    const final=yaml.split('\n  avisar-fallo:')[1];
    assert.ok(final,'Missing final notification job');
    assert.ok(final.includes('needs: '+job));
    assert.ok(final.includes('always()') && final.includes('needs.'+job+".result == 'failure'"));
    assert.ok(final.includes('NOTIFICATION_KIND: '+kind));
    assert.ok(final.includes('${{ github.run_id }}:${{ github.run_attempt }}'));
  }
});
