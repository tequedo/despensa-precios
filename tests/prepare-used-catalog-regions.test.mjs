import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareUsedRegions} from '../scripts/prepare-used-catalog-regions.mjs';

const generation='2026-11-01T23:31:35.652Z';
const region={province:'AR-J',storeIds:['11|2|1081']};
const index={province:{code:'AR-J'},geographyVerified:true,generatedAt:generation,stores:[{externalId:'11|2|1081',sourceDate:'2026-11-01'}]};
function harness(regions=[region],replies=[{status:200,body:{ready:true,generation}}]){
 let now=Date.parse('2026-11-02T00:45:00Z'),position=0;const calls=[];
 return {calls,options:{origin:'https://example.com',clock:()=>now,pause:async ms=>{now+=ms;},loadIndex:async()=>index,fetcher:async(url,init)=>{
  calls.push({url:String(url),init});
  if(!init.method)return {status:200,json:async()=>({regions})};
  const reply=replies[Math.min(position++,replies.length-1)];
  if(reply.error)throw reply.error;
  now+=reply.elapsed??0;
  return {status:reply.status,json:async()=>reply.body};
 }}};
}
test('prepares a registered region with frozen generation; cached is not a cold measurement',async()=>{
 const h=harness([region],[{status:200,body:{ready:true,cached:true,generation}}]);
 const r=await prepareUsedRegions(h.options);
 assert.equal(r.success,true);assert.equal(r.regions[0].status,'ready');
 assert.equal(r.regions[0].attempts[0].cached,true);
 assert.deepEqual(JSON.parse(h.calls[1].init.body),{...region,expectedGeneration:generation});
 assert.equal(h.calls[1].init.redirect,'error');
});
test('202 and propagation 409 wait for confirmation of the same generation',async()=>{
 const h=harness([region],[{status:409,body:{generation:'2026-10-31T12:00:00Z'}},{status:202,body:{generation}},{status:200,body:{ready:true,generation}}]);
 const r=await prepareUsedRegions(h.options);
 assert.equal(r.success,true);assert.equal(r.regions[0].attempts.length,3);
});
test('rejects a contradictory ready and stops on a newer source without chasing it',async()=>{
 for(const reply of [{status:200,body:{ready:true,generation:'2026-10-31T12:00:00Z'}},{status:409,body:{generation:'2026-11-02T12:00:00Z'}}]){
  const h=harness([region],[reply]);const r=await prepareUsedRegions(h.options);
  assert.equal(r.success,false);assert.equal(h.calls.length,2);
  assert.ok(['invalid_response','generation_changed'].includes(r.regions[0].status));
 }
});
test('validates source geography and branch IDs before POST; no unsafe paths',async()=>{
 const h=harness([{province:'../etc',storeIds:['x']},{...region,storeIds:['missing']},region]);
 h.options.loadIndex=async()=>({...index,geographyVerified:false});
 const r=await prepareUsedRegions(h.options);
 assert.equal(r.success,false);assert.equal(h.calls.length,1);
 assert.equal(r.regions[0].status,'invalid_scope');
});
test('deduplicates regions and reports changed scope and deferred limit explicitly',async()=>{
 const h=harness([region,region,{...region,storeIds:['missing']}, {...region,storeIds:['other']}]);
 const r=await prepareUsedRegions({...h.options,maxRegions:2});
 assert.deepEqual(r.regions.map(row=>row.status),['ready','duplicate','source_scope_changed','deferred_limit']);
 assert.equal(h.calls.length,2);assert.equal(r.success,false);
});
test('bounded preparation leaves other regions deferred, never clears production cache',async()=>{
 const h=harness([region,{...region,province:'AR-C'}],[{status:202,body:{generation}}]);
 const r=await prepareUsedRegions({...h.options,totalBudgetMs:1000,intervalMs:1000});
 assert.deepEqual(r.regions.map(row=>row.status),['timeout','deferred_budget']);
 assert.ok(h.calls.every(call=>!call.init.method||call.init.method==='POST'));
});
test('rate limit stops the batch and is not reported as ready',async()=>{
 const h=harness([region,{...region,province:'AR-C'}],[{status:429,body:{error:'limit'}}]);
 const r=await prepareUsedRegions(h.options);
 assert.equal(r.success,false);assert.equal(r.regions[0].httpStatus,429);assert.equal(h.calls.length,2);
 assert.equal(r.regions[1].status,'deferred_rate_limit');
});
test('network failure is recorded without stopping preparation of other scopes',async()=>{
 const h=harness([region,{...region,storeIds:['missing']}],[{error:new Error('network')}]);
 const r=await prepareUsedRegions(h.options);
 assert.deepEqual(r.regions.map(row=>row.status),['failed','source_scope_changed']);assert.equal(r.success,false);
});
test('untrusted redirects and malformed registry fail without a POST',async()=>{
 const h=harness();h.options.fetcher=async()=>({status:200,json:async()=>({regions:{}})});
 assert.equal((await prepareUsedRegions(h.options)).success,false);
 await assert.rejects(()=>prepareUsedRegions({...h.options,origin:'http://example.com'}),/HTTPS/);
});
test('expired source branches are never announced as prepared',async()=>{
 const h=harness();h.options.loadIndex=async()=>({...index,stores:[{externalId:'11|2|1081',sourceDate:'2026-10-25'}]});
 const r=await prepareUsedRegions(h.options);
 assert.equal(r.regions[0].status,'stale_source');assert.equal(r.success,false);assert.equal(h.calls.length,1);
});
