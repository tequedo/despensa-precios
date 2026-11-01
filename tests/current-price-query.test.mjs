import test from 'node:test';
import assert from 'node:assert/strict';
import {createCurrentPriceQuery} from './current-price-query.mjs';

const origin='https://example.invalid', generation='2026-11-01T00:23:27.129Z';
const scope={province:'AR-J',locality:'San Juan',lat:'-31.534016',lon:'-68.524744'};
const ready=()=>Response.json({ready:true,generation});
const prices=coverage=>Response.json({coverage:{generatedAt:generation,...coverage},data:{options:[{storeId:'11|2|1081',price:5000}]}});
const create=(fetcher,options={})=>createCurrentPriceQuery({origin,fetcher,pause:async()=>{},...options});

test('prepares the expected generation before reading and reuses it only for the same region',async()=>{
 const calls=[];const query=create(async(url,init)=>{calls.push({url,init});return init.method==='POST'?ready():prices();});
 await query(scope,{ean:'control',storeIds:'B, A,A'},generation);
 await query(scope,{ean:'other',storeIds:'A,B'},generation);
 assert.equal(calls.filter(c=>c.init.method==='POST').length,1);
 const post=calls[0];assert.deepEqual(JSON.parse(post.init.body),{...scope,storeIds:['A','B'],expectedGeneration:generation});
 assert.equal(post.init.redirect,'error');assert.equal(new URL(calls[1].url).searchParams.get('storeIds'),'A,B');
 await query(scope,{ean:'control',storeIds:'C'},generation);
 assert.equal(calls.filter(c=>c.init.method==='POST').length,2);
});

test('waits for actual 409 propagation and 202 preparation without accepting a stale ready result',async()=>{
 const states=[Response.json({generation:'2026-10-31T20:36:49.643Z'},{status:409}),Response.json({preparing:true,generation},{status:202}),ready()];
 let get=0;const query=create(async(url,init)=>init.method==='POST'?states.shift():(get++,prices()));
 await query(scope,{ean:'control'},generation);assert.equal(states.length,0);assert.equal(get,1);
 let reads=0;const wrong=create(async(url,init)=>init.method==='POST'?Response.json({ready:true,generation:'2026-10-31T20:36:49.643Z'}):(reads++,prices()));
 await assert.rejects(wrong(scope,{},generation),e=>e.kind==='generation_mismatch');assert.equal(reads,0);
});

test('stale or updating GETs are never accepted and trigger preparation again',async()=>{
 let post=0,get=0;const query=create(async(url,init)=>{if(init.method==='POST'){post++;return ready();}get++;return get===1?prices({generatedAt:'2026-10-31T20:36:49.643Z',updating:true}):get===2?prices({updating:true}):prices();});
 const result=await query(scope,{},generation);assert.equal(result.coverage.updating,undefined);assert.equal(get,3);assert.equal(post,3);
 const pending=create(async(url,init)=>init.method==='POST'?ready():prices({preparingIndex:true}),{maxAttempts:2});
 await assert.rejects(pending(scope,{},generation),e=>e.kind==='generation_mismatch');
});

test('a new publication cannot silently replace the frozen generation and its source shards',async()=>{
 for(const phase of ['post','get']){
  const query=create(async(url,init)=>init.method==='POST'?(phase==='post'?Response.json({generation:'2026-11-02T00:00:00.000Z'},{status:409}):ready()):prices({latestGeneratedAt:'2026-11-02T00:00:00.000Z',updating:true}));
  await assert.rejects(query(scope,{},generation),e=>e.kind==='generation_changed');
 }
});

test('auth, rate limits and server errors fail explicitly without being retried or caching success',async()=>{
 for(const [status,kind]of [[400,'http'],[401,'auth'],[403,'auth'],[429,'rate_limit'],[503,'server']]){
  let calls=0;const query=create(async()=>{calls++;return Response.json({error:'unavailable'},{status});});
  await assert.rejects(query(scope,{},generation),e=>e.kind===kind&&e.status===status);assert.equal(calls,1);
  await assert.rejects(query(scope,{},generation));assert.equal(calls,2);
 }
 let calls=0;const query=create(async(url,init)=>{calls++;return init.method==='POST'?ready():Response.json({}, {status:503});});
 await assert.rejects(query(scope,{},generation),e=>e.kind==='server');assert.equal(calls,2);
});

test('preparation respects attempt and elapsed-time budgets and preserves authenticated GET headers',async()=>{
 let count=0;const pending=create(async()=>{count++;return Response.json({preparing:true},{status:202});},{maxAttempts:3});
 await assert.rejects(pending(scope,{},generation),e=>e.kind==='timeout');assert.equal(count,3);
 let time=0;count=0;const timed=create(async()=>{count++;time+=200000;return Response.json({preparing:true},{status:202});},{clock:()=>time,pause:async ms=>{time+=ms;}});
 await assert.rejects(timed(scope,{},generation),e=>e.kind==='timeout');assert.equal(count,2);
 let seen;const auth=create(async(url,init)=>{if(init.method==='POST'){assert.equal(init.headers.authorization,undefined);return ready();}seen=init;return prices();},{headers:()=>({cookie:'test-cookie',authorization:'Bearer test-only'})});
 await auth(scope,{},generation);assert.equal(seen.headers.authorization,'Bearer test-only');assert.equal(seen.redirect,'error');
});
