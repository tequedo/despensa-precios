import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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
    git(working,'add','.'); git(working,'commit','-m','Initial reports'); git(working,'push','-u','origin','main');
    git(dir,'clone',remote,peer); identity(peer);
    await writeFile(join(peer,'concurrent.txt'),'Keep concurrent work\n');
    git(peer,'add','.'); git(peer,'commit','-m','Concurrent update'); git(peer,'push');
    await writeFile(join(working,'data/notification-status.json'), '{"recorded":true}\n');
    await writeFile(join(working,'data/price-refresh-smoke-report.json'), '{"success":true,"generation":"new"}\n');
    const script = new URL('../scripts/push-update-diagnostics.sh', import.meta.url).pathname;
    execFileSync('bash',[script],{cwd:working,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    assert.equal(git(working,'status','--porcelain'),'');
    assert.equal(await readFile(join(working,'concurrent.txt'),'utf8'),'Keep concurrent work\n');
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/price-refresh-smoke-report.json')), {success:true,generation:'new'});
    assert.deepEqual(JSON.parse(git(remote,'show','main:data/notification-status.json')), {recorded:true});
    const head = git(working,'rev-parse','HEAD');
    execFileSync('bash',[script],{cwd:working,stdio:'pipe'});
    assert.equal(git(working,'rev-parse','HEAD'),head,'Unchanged reports should not create a commit');
  } finally { await rm(dir,{recursive:true,force:true}); }
});
