import { readFile, writeFile } from 'node:fs/promises';
import { scopedPromotionEvidence } from './promotion-evidence.mjs';
const file=process.env.PARTNER_PROMOTIONS_FILE??'data/partner-promotions-verified.json';
const payload=JSON.parse(await readFile(file,'utf8'));
const allowed=['vea.com.ar','masonline.com.ar','laanonima.com.ar','carrefour.com.ar','supermercadosdia.com.ar','hiperlibertad.com.ar','coto.com.ar','jumbo.com.ar','disco.com.ar','atomoconviene.com'];
const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&allowed.some(host=>u.hostname===host||u.hostname.endsWith('.'+host));}catch{return false;}};
// Cache by source and bound each run: a repeated catalogue URL is fetched once.
// Unchecked items retain their original evidence time and expire in the app.
const pages=new Map();
const urls=[...new Set((payload.promotions??[]).map(o=>o.retailerSource).filter(validUrl))].slice(0,64);
for(let start=0;start<urls.length;start+=4) await Promise.all(urls.slice(start,start+4).map(async url=>{
 try {
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{accept:'text/html,application/xhtml+xml'}});
  if(!response.ok||!validUrl(response.url))throw new Error('Fuente no disponible');
  const html=await response.text();if(html.length>2000000)throw new Error('Fuente demasiado extensa');
  pages.set(url,{html});
 }catch(error){pages.set(url,{error:error.message});}
}));
const checked=[];
for(const offer of (payload.promotions??[])) {
 try {
  if(!validUrl(offer.retailerSource))throw new Error('Fuente oficial pendiente');
  const page=pages.get(offer.retailerSource);
  if(!page?.html)throw new Error(page?.error??'Fuente pendiente de revisar: límite de esta ejecución');
  const evidence=scopedPromotionEvidence(offer,page.html);
  if(!evidence)throw new Error('No se revalidaron producto, sucursal, canal, precio y vigencia');
  const {blockedReason,...previous}=offer;
  checked.push({...previous,...evidence,status:'verified',corroboratedAt:new Date().toISOString()});
 }catch(error){checked.push({...offer,status:'incomplete',blockedReason:error.message});}
}
await writeFile(file,JSON.stringify({...payload,generatedAt:new Date().toISOString(),promotions:checked},null,2)+'\n');
console.log(JSON.stringify({verified:checked.filter(o=>o.status==='verified').length,pending:checked.filter(o=>o.status!=='verified').length}));
