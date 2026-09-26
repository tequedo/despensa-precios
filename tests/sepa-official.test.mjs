import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { prepareOfficial, OFFICIAL_METADATA_URL, connectionFailure } from '../sepa-official.mjs';
import { OFFICIAL_DATASET_ID, METADATA_URL, INDEX_URL } from '../sepa-provenance.mjs';

const reply = (url, bytes, options = {}) => {
  const response = new Response(bytes, options);
  Object.defineProperty(response, 'url', { value: url });
  return response;
};

test('IPv4 retry is limited to connection failures, never HTTP rejections or TLS validation errors', () => {
  assert.equal(connectionFailure(new TypeError('fetch failed', { cause:{code:'UND_ERR_CONNECT_TIMEOUT'} })), true);
  assert.equal(connectionFailure(new Error('HTTP 403')), false);
  assert.equal(connectionFailure(new TypeError('fetch failed', { cause:{code:'CERT_HAS_EXPIRED'} })), false);
  assert.equal(connectionFailure(new DOMException('Timeout', 'TimeoutError')), false);
});

async function fixture(t, change = {}) {
  const root = await mkdtemp(join(tmpdir(), 'official-sepa-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync('python3', ['-c', `
import sys, zipfile
from pathlib import Path
root=Path(sys.argv[1])
with zipfile.ZipFile(root/'source.zip','w') as z:
    for name in ['comercio.csv','sucursales.csv','productos.csv']:
        z.writestr('merchant/'+name, 'id|name\\n1|example\\n')
`, root]);
  const zip = await readFile(join(root, 'source.zip'));
  const resource = {
    id: 'f8e75128-515a-436e-bf8d-5c63a62f2005', revision_id: '72adcce2-b0ff-4af7-9594-adf43f1b259b',
    size: zip.length, last_modified: new Date(Date.now() - 24 * 3600_000).toISOString(), hash: '',
  };
  resource.url = `https://datos.produccion.gob.ar/dataset/${OFFICIAL_DATASET_ID}/resource/${resource.id}/download/sepa_domingo.zip`;
  const metadata = { success: true, result: { id: OFFICIAL_DATASET_ID, resources: [resource] } };
  const entryId = `${resource.id}-revID-${resource.revision_id}`;
  const name = `${entryId}-sepa_domingo.zip-repackaged.tar.zst`;
  const entry = { id: entryId, name, link: `https://f004.backblazeb2.com/file/precios-justos-datasets/${name}`, firstSeenAt: new Date(Date.now() - 3600_000).toISOString(), warnings: '' };
  await writeFile(join(root, 'metadata.json'), JSON.stringify(metadata));
  execFileSync('python3', ['-c', `
import sys, tarfile, io, subprocess
from pathlib import Path
root=Path(sys.argv[1])
with tarfile.open(root/'replica.tar','w') as tar:
    files={'merchant/'+name: b'id|name\\n1|example\\n' for name in ['comercio.csv','sucursales.csv','productos.csv']}
    if sys.argv[2]=='changed': files['merchant/productos.csv']=b'id|name\\n1|altered\\n'
    files['dataset-info.json']=(root/'metadata.json').read_bytes()
    for name,data in files.items():
        item=tarfile.TarInfo(name);item.size=len(data);tar.addfile(item,io.BytesIO(data))
subprocess.run(['zstd','-q',str(root/'replica.tar')],check=True)
`, root, change.replicaMismatch ? 'changed' : 'same']);
  const replica = await readFile(join(root, 'replica.tar.zst'));
  const requests = [];
  let metadataCalls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push(url);
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['accept-encoding'], 'identity');
    if (url === OFFICIAL_METADATA_URL) {
      metadataCalls++;
      if (change.connection && metadataCalls === 1) throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
      if (change.denied) return reply(url, 'Forbidden', { status: 403 });
      if (change.timeout) throw new DOMException('Timed out', 'TimeoutError');
      const copy = structuredClone(metadata);
      if (change.metadata) Object.assign(copy.result.resources[0], change.metadata);
      if (metadataCalls === 2 && change.revisionRace) copy.result.resources[0].revision_id = '11d22be1-1cf9-4284-a6bc-9d3727db52b5';
      return reply(url, JSON.stringify(copy));
    }
    if (url === resource.url) {
      const bytes = change.truncated ? zip.subarray(0, zip.length - 10) : change.corrupt ? Buffer.alloc(zip.length, 65) : zip;
      if (change.streamFailure) {
        const body = new ReadableStream({ start(c) { c.enqueue(zip.subarray(0, 10)); }, pull(c) { c.error(new Error('connection interrupted')); } });
        return reply(url, body);
      }
      return reply(change.wrongResponseOrigin ? 'https://example.com/untrusted.zip' : url, bytes,
        change.wrongLength ? { headers: { 'content-length': String(zip.length + 1) } } : {});
    }
    if (url === METADATA_URL) return reply(url, JSON.stringify(metadata));
    if (url === INDEX_URL) return reply(url, JSON.stringify({ day: [entry] }));
    if (url === entry.link) return reply(url, replica);
    throw new Error(`Unexpected request: ${url}`);
  });
  const work = join(root, 'work');
  await mkdir(work);
  const options = { originalDir: join(root, 'retained'), auditFile: join(root, 'audit.json') };
  return { root, zip, resource, requests, work, options };
}

test('connection fallback validates IPv4 bytes and continues the same official acquisition', async t => {
  const f = await fixture(t, { connection: true });
  const bin = join(f.root, 'bin'); await mkdir(bin);
  const program = join(bin, 'curl');
  await writeFile(program, `#!/usr/bin/env python3
import sys
from pathlib import Path
args=sys.argv[1:]
assert '--ipv4' in args and '--location' not in args and '--insecure' not in args
root=Path(__file__).resolve().parent.parent
body=(root/'metadata.json').read_bytes()
Path(args[args.index('--output')+1]).write_bytes(body)
Path(args[args.index('--dump-header')+1]).write_text('HTTP/1.1 200 OK\\r\\nContent-Length: '+str(len(body))+'\\r\\n\\r\\n')
print('200\\n'+args[-1])
`);
  await chmod(program, 0o755);
  const oldPath = process.env.PATH; process.env.PATH = `${bin}:${oldPath}`;
  t.after(() => { process.env.PATH = oldPath; });
  const result = await prepareOfficial(f.work, f.options);
  assert.equal(result.report.metadata.transport, 'curl_ipv4');
  assert.equal(result.report.metadata.previousConnectionError, 'UND_ERR_CONNECT_TIMEOUT');
  assert.equal(result.source.official, true);
  assert.deepEqual(await readFile(join(result.bundle, 'original.zip')), f.zip);
});

test('direct acquisition retains exact ZIP and both catalogs, validates payload and identifies source', async t => {
  const f = await fixture(t);
  const result = await prepareOfficial(f.work, f.options);
  assert.equal(result.source.official, true);
  assert.equal(result.source.name, 'SEPA - Precios Claros');
  assert.equal(result.report.authenticity, 'official_https_download');
  assert.equal(result.report.originalComparison.status, 'not_performed');
  assert.equal(result.report.payload.csvGroups, 1);
  assert.deepEqual(await readFile(join(result.bundle, 'original.zip')), f.zip);
  assert.equal(result.report.archive.sha256, createHash('sha256').update(f.zip).digest('hex'));
  assert.deepEqual(f.requests, [OFFICIAL_METADATA_URL, f.resource.url, OFFICIAL_METADATA_URL]);
  await rm(f.work, { recursive: true });
  assert.deepEqual(await readFile(join(result.bundle, 'original.zip')), f.zip, 'original survives temporary extraction cleanup');
  for (const name of ['metadata-before.json', 'metadata-after.json', 'original-manifest.json', 'provenance.json']) {
    JSON.parse(await readFile(join(result.bundle, name), 'utf8'));
  }
});

for (const [name, change, pattern] of [
  ['403', { denied: true }, /HTTP 403/],
  ['timeout', { timeout: true }, /Timed out/],
  ['changed revision', { revisionRace: true }, /cambió durante/],
  ['truncation', { truncated: true }, /truncada/],
  ['broken ZIP of correct length', { corrupt: true }, /zip|Zip/i],
  ['HTTP size mismatch', { wrongLength: true }, /Tamaño HTTP/],
  ['stream interruption', { streamFailure: true }, /connection interrupted/],
  ['foreign response origin', { wrongResponseOrigin: true }, /URL solicitada/],
  ['untrusted catalog URL', { metadata: { url: 'https://example.com/fake.zip' } }, /URL de origen/],
  ['stale source', { metadata: { last_modified: '2020-01-01T00:00:00Z' } }, /72 horas/],
]) {
  test(`rejects ${name}, records failure and never silently switches to a replica`, async t => {
    const f = await fixture(t, change);
    await assert.rejects(prepareOfficial(f.work, f.options), pattern);
    const report = JSON.parse(await readFile(f.options.auditFile, 'utf8'));
    assert.equal(report.status, 'failed');
    assert.equal(report.originalComparison.status, 'not_performed');
    assert.ok(!f.requests.includes(METADATA_URL));
    const [bundle] = await readdir(f.options.originalDir);
    assert.ok(!(await readdir(join(f.options.originalDir, bundle))).some(p => p.endsWith('.partial')));
  });
}

test('compares every inner file of an official acquisition against its corresponding replica', async t => {
  const f = await fixture(t);
  const { report } = await prepareOfficial(f.work, { ...f.options, compareReplica: true });
  assert.equal(report.originalComparison.status, 'matched');
  assert.equal(report.originalComparison.originalOrigin, 'official_https_download');
  assert.equal(report.originalComparison.comparedFiles, 3);
  assert.notEqual(report.originalComparison.originalArchiveSha256, report.originalComparison.replicaArchiveSha256);
});

test('a different replica fails the audit while retaining the official original and mismatch evidence', async t => {
  const f = await fixture(t, { replicaMismatch: true });
  await assert.rejects(prepareOfficial(f.work, { ...f.options, compareReplica: true }), /difiere del original/);
  const report = JSON.parse(await readFile(f.options.auditFile, 'utf8'));
  assert.equal(report.status, 'failed');
  assert.equal(report.authenticity, 'official_https_download');
  assert.deepEqual(report.originalComparison.changed, ['merchant/productos.csv']);
  const [bundle] = await readdir(f.options.originalDir);
  assert.deepEqual(await readFile(join(f.options.originalDir, bundle, 'original.zip')), f.zip);
});

test('actual importer retains prices and promotions and sends nothing after official HTTP 403', async t => {
  const root = await mkdtemp(join(tmpdir(), 'official-import-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const preload = join(root, 'mock-network.mjs');
  await writeFile(preload, `globalThis.fetch = async url => {
    if (url !== ${JSON.stringify(OFFICIAL_METADATA_URL)}) throw new Error('Unexpected network request');
    return new Response('Forbidden', {status:403});
  };`);
  const prices = join(root, 'prices.ndjson'), promotions = join(root, 'promotions.json'), audit = join(root, 'audit.json');
  await writeFile(prices, 'previous prices\n');
  await writeFile(promotions, 'previous promotions\n');
  const result = spawnSync(process.execPath, ['--import', preload, new URL('../update-san-juan.mjs', import.meta.url).pathname], {
    env: { ...process.env, SEPA_SOURCE: 'official', SEPA_ORIGINAL_DIR: join(root, 'originals'),
      OUTPUT_FILE: prices, PROMOTIONS_FILE: promotions, PROVENANCE_FILE: audit,
      NATIONAL_EXPORT: '0', MANUAL_ZIP_URL: '', PRICE_INGEST_TOKEN: 'test-only-no-network',
      DESPENSA_INGEST_URL: 'https://example.com/must-not-ingest' },
    encoding: 'utf8', timeout: 10_000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HTTP 403/);
  assert.equal(await readFile(prices, 'utf8'), 'previous prices\n');
  assert.equal(await readFile(promotions, 'utf8'), 'previous promotions\n');
  assert.equal(JSON.parse(await readFile(audit, 'utf8')).phase, 'official_metadata_before');
});
