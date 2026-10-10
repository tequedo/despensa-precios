import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('publishing diagnostics commits the app-read report and rebases concurrent work without discarding it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-publish-diagnostics-'));
  const remote = join(dir, 'remote.git'), working = join(dir, 'working'), peer = join(dir, 'peer');
  const git = (cwd, ...args) => execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
  const identity = cwd => { git(cwd,'config','user.name','Diagnostics test'); git(cwd,'config','user.email','diagnostics@example.invalid'); };
  try {
    git(dir, 'init', '--bare', '--initial-branch=main', remote);
    git(dir, 'clone', remote, working); identity(working);
    await mkdir(join(working,'data'));
    for (const file of ['notification-status.json','price-refresh-smoke-report.json']) await writeFile(join(working,'data',file), '{}\n');
    await writeFile(join(working,'data/sepa-provenance.json'), '{"status":"last_accepted"}\n');
    git(working,'add','.'); git(working,'commit','-m','Initial reports'); git(working,'push','-u','origin','main');
    git(dir,'clone',remote,peer); identity(peer);
    await writeFile(join(peer,'concurrent.txt'),'Keep concurrent work\n');
    git(peer,'add','.'); git(peer,'commit','-m','Concurrent update'); git(peer,'push');
    await writeFile(join(working,'data/notification-status.json'), '{"recorded":true}\n');
    await writeFile(join(working,'data/price-refresh-smoke-report.json'), '{"success":true,"generation":"new"}\n');
    await writeFile(join(working,'data/sepa-provenance.json'), '{"status":"failed"}\n');
    await writeFile(join(working,'data/price-access-report.json'), '{"completed":true,"priceRefreshRestored":false}\n');
    await writeFile(join(working,'data/price-refresh-history.json'), '{"step1Complete":false}\n');
    await writeFile(join(working,'data/sepa-update-attempt.json'), '{"outcome":"failure"}\n');
    git(working,'config','--unset','user.name'); git(working,'config','--unset','user.email');
    const script = new URL('../scripts/push-update-diagnostics.sh', import.meta.url).pathname;
    execFileSync('bash',[script],{cwd:working,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    assert.equal(git(working,'status','--porcelain'),'M data/sepa-provenance.json');
    assert.equal(await readFile(join(working,'concurrent.txt'),'utf8'),'Keep concurrent work\n');
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/price-refresh-smoke-report.json')), {success:true,generation:'new'});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/notification-status.json')), {recorded:true});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/price-access-report.json')), {completed:true,priceRefreshRestored:false});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/price-refresh-history.json')), {step1Complete:false});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/sepa-update-attempt.json')), {outcome:'failure'});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/sepa-provenance.json')), {status:'last_accepted'});
    assert.deepEqual(JSON.parse(await readFile(join(working,'data/sepa-provenance.json'),'utf8')), {status:'failed'});
    const head = git(working,'rev-parse','HEAD');
    execFileSync('bash',[script],{cwd:working,stdio:'pipe'});
    assert.equal(git(working,'rev-parse','HEAD'),head,'Unchanged reports should not create a commit');
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('a conflicting generated-data publication preserves both snapshots and aborts the rebase cleanly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sepa-conflicting-publication-'));
  const remote = join(dir, 'remote.git'), working = join(dir, 'working'), peer = join(dir, 'peer');
  const git = (cwd, ...args) => execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
  const identity = cwd => { git(cwd,'config','user.name','Publication test'); git(cwd,'config','user.email','publication@example.invalid'); };
  try {
    git(dir, 'init', '--bare', '--initial-branch=main', remote);
    git(dir, 'clone', remote, working); identity(working);
    await mkdir(join(working,'data'));
    await writeFile(join(working,'data/wallet-benefit-sources.json'), '{"generation":"initial"}\n');
    await writeFile(join(working,'data/sepa-provenance.json'), '{"status":"accepted"}\n');
    git(working,'add','.'); git(working,'commit','-m','Initial snapshot'); git(working,'push','-u','origin','main');
    git(dir,'clone',remote,peer); identity(peer);
    await writeFile(join(working,'data/wallet-benefit-sources.json'), '{"generation":"price-job"}\n');
    await writeFile(join(working,'data/prices.json'), '{"current":true}\n');
    git(working,'add','.'); git(working,'commit','-m','Price snapshot');
    const localHead = git(working,'rev-parse','HEAD');
    await writeFile(join(working,'data/sepa-provenance.json'), '{"status":"diagnostic-after-acquisition"}\n');
    await writeFile(join(peer,'data/wallet-benefit-sources.json'), '{"generation":"benefit-job"}\n');
    git(peer,'add','.'); git(peer,'commit','-m','Concurrent benefits'); git(peer,'push');
    const remoteHead = git(peer,'rev-parse','HEAD');
    const script = new URL('../scripts/push-generated-data.sh', import.meta.url).pathname;
    const result = spawnSync('bash',[script],{cwd:working,encoding:'utf8'});
    assert.equal(result.status,1,'A conflict must be reported as failure');
    assert.equal(git(working,'rev-parse','HEAD'),localHead,'The local acquisition commit is retained');
    assert.equal(git(remote,'rev-parse','main'),remoteHead,'The concurrent publication is retained');
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/wallet-benefit-sources.json')), {generation:'benefit-job'});
    assert.deepEqual(JSON.parse(await readFile(join(working,'data/wallet-benefit-sources.json'),'utf8')), {generation:'price-job'});
    assert.deepEqual(JSON.parse(await readFile(join(working,'data/prices.json'),'utf8')), {current:true});
    assert.deepEqual(JSON.parse(await readFile(join(working,'data/sepa-provenance.json'),'utf8')), {status:'diagnostic-after-acquisition'});
    assert.equal(git(working,'diff','--name-only','--diff-filter=U'),'','No unresolved index entries remain');
    assert.throws(() => git(working,'rev-parse','--verify','REBASE_HEAD'),'No active rebase remains');
  } finally { await rm(dir,{recursive:true,force:true}); }
});
