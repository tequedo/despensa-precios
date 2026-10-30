import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function warmCatalogIndexes({origin,fetcher=fetch,readIndex=async province=>JSON.parse(await fs.readFile('data/national/'+province+'/index.json','utf8')),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),clock=Date.now}={}){
 const url=origin??process.env.SITE_ORIGIN??'https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site';
 const report={checkedAt:new Date().toISOString(),regions:[],queries:[],errors:[]};
 let registry=[];try{const response=await fetcher(url+'/api/public-prices/prepare',{signal:AbortSignal.timeout(20000)});if(response.ok)registry=(await response.json()).regions??[];}catch{}
 // The public Georef locality point used by the app's San Juan picker.
 const pilot={province:'AR-J',locality:'San Juan',lat:-31.534016,lon:-68.524744,radiusKm:50};
 const targets=[pilot,...registry],seen=new Set();
 for(const scope of targets){
  const id=JSON.stringify([scope.province,[...(scope.storeIds??[])].sort()]);if(seen.has(id))continue;seen.add(id);
  try{
   const expected=await readIndex(scope.province);let prepared;
   for(let attempt=0;attempt<25;attempt++){
    const response=await fetcher(url+'/api/public-prices/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...scope,expectedGeneration:expected.generatedAt}),signal:AbortSignal.timeout(90000)});
    const result=await response.json().catch(()=>({error:'Respuesta del servidor no disponible'}));
    if(response.ok&&result.ready&&result.generation===expected.generatedAt){prepared=result;break;}
    if(response.status!==202&&response.status!==409&&response.status!==404)throw new Error(result.error??'No se preparó el índice');
    await pause(15000);
   }
   if(!prepared)throw new Error('La nueva generación no quedó preparada dentro del plazo');
   report.regions.push({province:scope.province,storeIds:scope.storeIds??null,records:prepared.records,generation:prepared.generation,cached:prepared.cached??false});
  }catch(error){report.errors.push({province:scope.province,error:error.message});}
 }
 for(const query of ['Coca cola','arroz','aceite','leche','sal']){
  try{
   const params=new URLSearchParams({...pilot,q:query,priced:'1',guided:'1'}),start=clock();
   const response=await fetcher(url+'/api/public-prices?'+params,{signal:AbortSignal.timeout(30000)}),body=await response.json();
   if(!response.ok||!body.data?.total)throw new Error(body.error??'La consulta no devolvió productos');
   if(!body.coverage?.indexed)throw new Error('La consulta nueva no usó el índice preparado');
   const serverMs=Number(/catalog;dur=([0-9.]+)/.exec(response.headers.get('server-timing')??'')?.[1]);
   if(!Number.isFinite(serverMs)||serverMs>2000)throw new Error('La búsqueda nueva superó 2 segundos en el servidor');
   const elapsedMs=clock()-start;
   if(elapsedMs>2000)throw new Error('La respuesta completa de una búsqueda nueva superó 2 segundos');
   report.queries.push({query,http:response.status,elapsedMs,serverTiming:response.headers.get('server-timing'),cache:response.headers.get('x-catalog-cache'),indexed:Boolean(body.coverage?.indexed),products:body.data.total,generation:body.coverage?.generatedAt});
  }catch(error){report.errors.push({query,error:error.message});}
 }
 report.success=report.errors.length===0;return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await warmCatalogIndexes();await fs.writeFile('data/catalog-index-warm-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.success)process.exitCode=1;
}
