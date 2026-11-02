import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {freshDate} from '../price-safety.mjs';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const safeProvince=value=>/^AR-[A-Z]$/.test(value);
const safeStore=value=>typeof value==='string'&&/^[-a-zA-Z0-9|:._]{1,100}$/.test(value);

// Uses only the existing public preparation endpoint and its generation guard.
// A ready response means the server verified its complete index, not UI timing.
export async function prepareUsedRegions({origin,loadIndex,fetcher=fetch,clock=Date.now,pause=wait,
  totalBudgetMs=600000,regionBudgetMs=150000,maxRegions=20,intervalMs=15000}={}){
 const site=new URL(origin);
 if(site.protocol!=='https:'||site.username||site.password||site.pathname!=='/'||site.search||site.hash)throw new Error('Origen HTTPS inválido');
 const started=clock(),report={checkedAt:new Date(started).toISOString(),success:false,regions:[],limit:maxRegions,totalBudgetMs};
 const remaining=()=>totalBudgetMs-(clock()-started);
 const read=async(path,init={},budget=30000)=>{
  const before=clock();
  const response=await fetcher(new URL(path,site),{...init,redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(budget,remaining())))});
  if(![200,202,409].includes(response.status))throw Object.assign(new Error('HTTP '+response.status),{status:response.status});
  const body=await response.json();
  return {status:response.status,body,durationMs:clock()-before};
 };
 try{
  const registry=await read('/api/public-prices/prepare');
  if(registry.status!==200||!Array.isArray(registry.body.regions))throw new Error('Registro de zonas inválido');
  const unique=new Set(),indexes=new Map();let admitted=0,halted=null;
  for(const region of registry.body.regions){
   const row={province:region?.province,storeIds:region?.storeIds,status:'invalid_scope',attempts:[]};
   report.regions.push(row);
   if(!safeProvince(region?.province)||!Array.isArray(region?.storeIds)||!region.storeIds.length||region.storeIds.length>12||!region.storeIds.every(safeStore))continue;
   row.storeIds=[...new Set(region.storeIds)].sort();
   const key=JSON.stringify([row.province,row.storeIds]);
   if(unique.has(key)){row.status='duplicate';continue;}unique.add(key);
   if(halted){row.status=halted;continue;}
   if(admitted>=maxRegions){row.status='deferred_limit';continue;}
   if(remaining()<=0){row.status='deferred_budget';continue;}admitted++;
   const regionStarted=clock();
   try{
    if(!indexes.has(row.province))indexes.set(row.province,await loadIndex(row.province));
    const index=indexes.get(row.province);
    if(index.geographyVerified!==true||index.province?.code!==row.province||!Number.isFinite(Date.parse(index.generatedAt))||!Array.isArray(index.stores))throw new Error('Índice provincial inválido');
    row.generation=index.generatedAt;
    const known=new Set(index.stores.map(store=>store.externalId));
    if(!row.storeIds.every(id=>known.has(id))){row.status='source_scope_changed';continue;}
    if(index.stores.some(store=>row.storeIds.includes(store.externalId)&&!freshDate(store.sourceDate,clock()))){row.status='stale_source';continue;}
    row.status='timeout';
    while(remaining()>0&&clock()-regionStarted<regionBudgetMs){
     const budget=Math.min(90000,remaining(),regionBudgetMs-(clock()-regionStarted));
     const result=await read('/api/public-prices/prepare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({province:row.province,storeIds:row.storeIds,expectedGeneration:row.generation})},budget);
     row.attempts.push({status:result.status,generation:result.body.generation??null,durationMs:result.durationMs,cached:result.body.cached===true});
     if(result.status===200&&result.body.ready===true&&result.body.generation===row.generation){row.status='ready';break;}
     if(typeof result.body.generation==='string'&&result.body.generation>row.generation){row.status='generation_changed';break;}
     if(![202,409].includes(result.status)){row.status='invalid_response';break;}
     const delay=Math.min(intervalMs,remaining(),regionBudgetMs-(clock()-regionStarted));
     if(delay>0)await pause(delay);
    }
   }catch(error){row.status='failed';row.error=error.name==='TimeoutError'?'Tiempo de espera agotado':error.message;if(error.status)row.httpStatus=error.status;}
   finally{row.durationMs=clock()-regionStarted;}
   // Respect the public read budget even when every index is already cached.
   if(remaining()>0)await pause(Math.min(1000,remaining()));
   if(row.httpStatus===429)halted='deferred_rate_limit';
   if(row.httpStatus===401||row.httpStatus===403)halted='deferred_access';
  }
  report.success=report.regions.every(row=>['ready','duplicate'].includes(row.status));
 }catch(error){report.error=error.message;}
 report.durationMs=clock()-started;
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await prepareUsedRegions({origin:process.env.SITE_ORIGIN,
  loadIndex:async code=>JSON.parse(await readFile(`data/national/${code}/index.json`,'utf8'))});
 await writeFile('data/catalog-preparation-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
 if(!report.success)process.exitCode=1;
}

