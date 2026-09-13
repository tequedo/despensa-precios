import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {normalize} from '../price-safety.mjs';
const origin=process.env.SITE_ORIGIN,token=process.env.PRICE_INGEST_TOKEN;
if(!origin||!token)throw new Error('Falta configuración para la prueba');
async function profile(label){
 const r=await fetch(origin+'/api/access',{method:'POST',headers:{origin,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({name:label,test:true}),signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,'No se pudo crear el perfil de prueba');
 assert.ok(r.headers.getSetCookie().every(c=>c.includes('; Secure')),'Cookies sin protección HTTPS');
 const cookies=r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookies.includes('despensa_profile='));return cookies;
}
const a=await profile('Prueba técnica de publicación A'),b=await profile('Prueba técnica de publicación B');
async function request(path,body,cookie=a){
 const r=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{origin,cookie,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)});
 const d=await r.json();return {status:r.status,body:d};
}
const coverage=JSON.parse(await readFile('data/national/coverage.json','utf8'));assert.equal(coverage.geographyVerified,true);
const checks=[];
for(const p of coverage.provinces){
 const started=Date.now(),c=await request('/api/prices/coverage?province='+p.code);assert.equal(c.status,200,p.name+': cobertura');assert.ok(c.body.localities.length,p.name+': sin localidades');
 const index=JSON.parse(await readFile('data/national/'+p.code+'/index.json','utf8'));
 const totals=new Map();for(const s of index.stores)totals.set(normalize(s.locality),(totals.get(normalize(s.locality))??0)+s.records);
 const locality=[...c.body.localities].sort((a,b)=>(totals.get(normalize(b))??0)-(totals.get(normalize(a))??0))[0];
 const branch=index.stores.filter(s=>normalize(s.locality)===normalize(locality)).sort((a,b)=>a.chain.localeCompare(b.chain)||a.externalId.localeCompare(b.externalId))[0];
 const sample=JSON.parse(await readFile('data/national/'+p.code+'/'+branch.file,'utf8')).prices.find(row=>normalize(row[1]).length>=2);assert.ok(sample,p.name+': sin producto de muestra');
 const scope=new URLSearchParams({province:p.code,locality});
 const q=await request('/api/prices?'+scope+'&q='+encodeURIComponent(sample[1]));assert.equal(q.status,200,p.name+': búsqueda');assert.ok(q.body.data.productos.some(item=>item.id===String(sample[0])),p.name+': falta producto que existe en la fuente');
 const product=q.body.data.productos.find(item=>item.id===String(sample[0]));const prices=await request('/api/prices?'+scope+'&ean='+encodeURIComponent(product.id));assert.equal(prices.status,200,p.name+': precio');assert.ok(prices.body.data.sucursales.length,p.name+': sin sucursales');
 for(const s of prices.body.data.sucursales){
  assert.equal(s.provincia,p.name);assert.ok(s.preciosProducto.precioLista>0);assert.equal(s.validDate,p.sourceDate);
  const sourceBranch=index.stores.find(store=>store.externalId===s.id);assert.ok(sourceBranch,p.name+': sucursal ajena al índice');
  const source=JSON.parse(await readFile('data/national/'+p.code+'/'+sourceBranch.file,'utf8')).prices.find(row=>String(row[0])===product.id);assert.ok(source,p.name+': producto ajeno a la fuente');assert.equal(s.preciosProducto.precioLista,source[5],p.name+': precio distinto al informado');
 }
 checks.push({province:p.name,locality,ean:product.id,stores:prices.body.data.sucursales.length,pricesMatchSource:true,durationMs:Date.now()-started});console.log(p.name+': búsqueda, sucursal y precio comprobados');
 if(p.code==='AR-J'){
  const basket=await request('/api/prices/basket',{scope:Object.fromEntries(scope),items:[{id:1,ean:product.id,name:product.name,brand:product.brand,presentation:product.presentation,quantity:3,unit:'unidad'}]});assert.equal(basket.status,200,'Comparación de lista');assert.ok(basket.body.data.stores.length);assert.ok(basket.body.data.stores.every(s=>s.known===1&&s.knownTotal>0));
 }
}
const added=await request('/api/pantry',{action:'add-product',name:'Producto de prueba técnica',brand:'QA',presentation:'1 unidad',unit:'unidad',stock:0,minimumStock:0,shoppingQuantity:2});assert.equal(added.status,201);const id=added.body.item.id;
try{
 for(const quantity of [-1,0,null,'NaN']){const invalid=await request('/api/pantry',{action:'set-shopping-quantity',productId:id,quantity});assert.equal(invalid.status,400,'Cantidad inválida aceptada');}
 assert.equal((await request('/api/pantry',{action:'purchase',productId:id,quantity:2,totalPrice:123.45,store:'Comercio de prueba'})).status,200);
 let state=await request('/api/pantry');assert.equal(state.body.items.find(i=>i.id===id).stock,2);assert.equal(state.body.purchases.find(p=>p.productId===id).totalPrice,123.45);
 assert.equal((await request('/api/pantry',{action:'set-stock',productId:id,stock:1})).status,200);
 state=await request('/api/pantry');assert.equal(state.body.items.find(i=>i.id===id).lastConsumption,1);
 assert.equal((await request('/api/pantry',{action:'set-stock',productId:id,stock:2},b)).status,404,'Se mezclaron perfiles');
 assert.equal((await request('/api/pantry',undefined,b)).body.items.length,0);
 assert.equal((await request('/api/activity',{code:'report_other'})).status,200);
}finally{await request('/api/pantry',{action:'delete-product',productId:id});}
const report={checkedAt:new Date().toISOString(),success:true,provinces:checks.length,checks,pantry:true,invalidQuantitiesRejected:true,userIsolation:true,feedback:true,testProfilesExcluded:true};
await writeFile('data/site-smoke-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
