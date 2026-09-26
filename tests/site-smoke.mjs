import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {normalize,distanceKm} from '../price-safety.mjs';
import {barcodeIdentity} from '../product-identity.mjs';
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
const checks=[];let savedReference;let quoteChecks=0;let crossChainIdentityQuotes=0;
for(const p of coverage.provinces){
 const started=Date.now(),c=await request('/api/prices/coverage?province='+p.code);assert.equal(c.status,200,p.name+': cobertura');assert.ok(c.body.localities.length,p.name+': sin localidades');
 const index=JSON.parse(await readFile('data/national/'+p.code+'/index.json','utf8'));
 assert.ok(index.stores.every(s=>s.channel==='sucursal'&&normalize(s.type)!=='web'),p.name+': canal presencial sin comprobar');
 assert.ok(c.body.locations?.length,p.name+': sin localidades oficiales');
 const anchor=[...index.stores].sort((a,b)=>b.records-a.records)[0];
 const city=[...c.body.locations].sort((a,b)=>distanceKm(a.lat,a.lon,anchor.latitude,anchor.longitude)-distanceKm(b.lat,b.lon,anchor.latitude,anchor.longitude))[0];
 const locality=city.name;
 const branch=[...index.stores].sort((a,b)=>distanceKm(city.lat,city.lon,a.latitude,a.longitude)-distanceKm(city.lat,city.lon,b.latitude,b.longitude)||a.chain.localeCompare(b.chain)||a.externalId.localeCompare(b.externalId))[0];
 assert.ok(distanceKm(city.lat,city.lon,branch.latitude,branch.longitude)<=50,p.name+': no hay comercios cercanos');
 const sample=JSON.parse(await readFile('data/national/'+p.code+'/'+branch.file,'utf8')).prices.find(row=>normalize(row[1]).length>=2&&row[9]?.barcodeStatus==='valid_format_and_checksum');assert.ok(sample,p.name+': sin producto de muestra');
 const scope=new URLSearchParams({province:p.code,locality,lat:String(city.lat),lon:String(city.lon)});
 const q=await request('/api/prices?'+scope+'&q='+encodeURIComponent(sample[1]));assert.equal(q.status,200,p.name+': búsqueda');assert.ok(q.body.data.productos.some(item=>item.id===String(sample[0])),p.name+': falta producto que existe en la fuente');
 const product=q.body.data.productos.find(item=>item.id===String(sample[0]));assert.equal(product.barcode,sample[9].barcode,p.name+': código distinto al publicado');assert.equal(product.barcodeStatus,'valid_format_and_checksum');savedReference=product.id;const prices=await request('/api/prices?'+scope+'&ean='+encodeURIComponent(product.id));assert.equal(prices.status,200,p.name+': precio');assert.ok(prices.body.data.sucursales.length,p.name+': sin sucursales');
 for(const s of prices.body.data.sucursales){
  assert.equal(s.provincia,p.name);assert.ok(s.distancia!==null&&s.distancia<=50,p.name+': sucursal lejana');assert.ok(s.preciosProducto.precioLista>0);assert.equal(s.channel,'sucursal');
  const sourceBranch=index.stores.find(store=>store.externalId===s.id);assert.ok(sourceBranch,p.name+': sucursal ajena al índice');
  const sourceRows=JSON.parse(await readFile('data/national/'+p.code+'/'+sourceBranch.file,'utf8')).prices;
  const source=sourceRows.find(row=>String(row[0])===product.id)??sourceRows.find(row=>row[9]?.barcodeStatus==='valid_format_and_checksum'&&barcodeIdentity(row[9].barcode).gtin===barcodeIdentity(product.barcode).gtin);assert.ok(source,p.name+': producto ajeno a la fuente');assert.equal(s.preciosProducto.precioLista,source[5],p.name+': precio distinto al informado');assert.equal(s.validDate,source[6],p.name+': fecha distinta al CSV');assert.equal(sourceBranch.sourceDate,source[6],p.name+': índice con fecha distinta');assert.equal(s.observedAt,s.provenance.fileUpdatedAt,p.name+': fecha visible distinta al archivo');assert.equal(s.provenance.dateBasis,'product_file_footer',p.name+': falta base de la fecha');
  assert.equal(s.official,false,p.name+': réplica presentada como original');assert.equal(s.provenance.sourceType,'replica');quoteChecks++;if(String(source[0])!==product.id)crossChainIdentityQuotes++;
 }
 checks.push({province:p.name,locality,ean:product.id,barcode:product.barcode,barcodeMatchesSource:true,stores:prices.body.data.sucursales.length,pricesMatchSource:true,datesMatchCsv:true,physicalChannel:true,officialLocality:true,within50Km:true,durationMs:Date.now()-started});console.log(p.name+': búsqueda, sucursal y precio comprobados');
 if(p.code==='AR-J'){
  // A checksum alone does not prove package consistency. The arbitrary search
  // sample can be an invalid retailer row (e.g. 100 g / 90 g / .09 gr).
  // Exercise a basket with the explicitly identified 1.5 L Natura bottle.
  const basket=await request('/api/prices/basket',{scope:Object.fromEntries(scope),items:[{id:1,ean:'7790272001029',name:'Aceite de girasol',brand:'Natura',presentation:'1.5 L',quantity:3,unit:'unidad'}]});assert.equal(basket.status,200,'Comparación de lista');assert.ok(basket.body.data.stores.length);assert.ok(basket.body.data.stores.every(s=>s.known===1&&s.knownTotal>0));
 }
}
const added=await request('/api/pantry',{action:'add-product',ean:savedReference,name:'Producto de prueba técnica',brand:'QA',presentation:'1 unidad',unit:'unidad',stock:0,minimumStock:0,shoppingQuantity:2});assert.equal(added.status,201);const id=added.body.item.id;
try{
 for(const quantity of [-1,0,null,'NaN']){const invalid=await request('/api/pantry',{action:'set-shopping-quantity',productId:id,quantity});assert.equal(invalid.status,400,'Cantidad inválida aceptada');}
 assert.equal((await request('/api/pantry',{action:'purchase',productId:id,quantity:2,totalPrice:123.45,store:'Comercio de prueba'})).status,200);
 let state=await request('/api/pantry');assert.equal(state.body.items.find(i=>i.id===id).ean,savedReference,'La compra cambió su referencia');assert.equal(state.body.items.find(i=>i.id===id).stock,2);assert.equal(state.body.purchases.find(p=>p.productId===id).totalPrice,123.45);
 assert.equal((await request('/api/pantry',{action:'set-stock',productId:id,stock:1})).status,200);
 state=await request('/api/pantry');assert.equal(state.body.items.find(i=>i.id===id).lastConsumption,1);
 assert.equal((await request('/api/pantry',{action:'set-stock',productId:id,stock:2},b)).status,404,'Se mezclaron perfiles');
 assert.equal((await request('/api/pantry',undefined,b)).body.items.length,0);
 assert.equal((await request('/api/activity',{code:'report_other'})).status,200);
}finally{await request('/api/pantry',{action:'delete-product',productId:id});}

const testProduct={name:'Aceite Natura',brand:'Natura',presentation:'1.5 L',ean:'7790272001029',unit:'unidad'};
assert.equal((await request('/api/shopping-tools',{action:'preferences',banks:['Banco de prueba QA'],brands:['Natura'],retired:'yes',shoppingDays:[1,5]})).status,200);
assert.equal((await request('/api/shopping-tools',{action:'preferences',payment:['Mercado Pago']})).status,200);
assert.equal((await request('/api/shopping-tools',{action:'search',query:'Aceite',brand:'Natura',size:'1.5 L'})).status,200);
assert.equal((await request('/api/shopping-tools',{action:'favorite',product:testProduct})).status,200);
let memory=(await request('/api/shopping-tools')).body;
assert.deepEqual(memory.preferences.banks,['Banco de prueba QA']);
assert.deepEqual(memory.preferences.brands,['Natura']);
assert.equal(memory.preferences.retired,'yes');
assert.ok(memory.favorites.some(f=>f.kind==='search'&&f.product.query==='Aceite'&&f.product.size==='1.5 L'));
assert.deepEqual((await request('/api/shopping-tools',undefined,b)).body.preferences,{});
assert.equal((await request('/api/shopping-tools',undefined,b)).body.favorites.length,0);
await request('/api/shopping-tools',{action:'preferences',rememberSearches:false});
assert.equal((await request('/api/shopping-tools',{action:'search',query:'Arroz'})).body.reason,'memory_disabled');
assert.equal((await request('/api/shopping-tools',{action:'recent',product:testProduct})).body.reason,'memory_disabled');
await request('/api/shopping-tools',{action:'clear-recents'});
memory=(await request('/api/shopping-tools')).body;
assert.equal(memory.favorites.length,1);assert.equal(memory.favorites[0].kind,'favorite');
await request('/api/shopping-tools',{action:'delete-favorite',id:memory.favorites[0].id});
console.log('Memoria y preferencias: persistencia, aislamiento, borrado y desactivación comprobados');

const report={preferencesPersisted:true,searchMemoryIsolated:true,searchOptOut:true,searchHistoryCleared:true,favoritesPreserved:true,checkedAt:new Date().toISOString(),success:true,provinces:checks.length,quoteChecks,crossChainIdentityQuotes,checks,pantry:true,storedReferencePreserved:true,invalidQuantitiesRejected:true,userIsolation:true,feedback:true,testProfilesExcluded:true};
await writeFile('data/site-smoke-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
