import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const origin = process.env.SITE_ORIGIN, token = process.env.PRICE_INGEST_TOKEN;
if (!origin || !token) throw new Error('Falta configuración para verificar las promociones publicadas');
const root = 'https://raw.githubusercontent.com/tequedo/despensa-precios/main/data/';
async function json(url, headers = {}) {
  const response = await fetch(url, {headers, redirect:'error', signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,'Fuente o app no disponible');
  return response.json();
}
const readFeeds=()=>Promise.all(['wallet-benefit-sources.json','retailer-promotion-sources.json','wallet-benefits-verified.json','retailer-promotions-verified.json','partner-promotions-verified.json'].map(path=>json(root+path)));
let walletSources,retailerSources,wallet,retailer,partner;
const response=await fetch(origin+'/api/access',{method:'POST',headers:{origin,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({name:'Control técnico de promociones',test:true}),redirect:'error',signal:AbortSignal.timeout(30000)});
assert.equal(response.status,200,'No se pudo abrir el perfil técnico aislado');
const cookie=response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
assert.ok(cookie.includes('despensa_profile='));
let inbox;
for(let attempt=0;attempt<13;attempt++) {
  [walletSources,retailerSources,wallet,retailer,partner]=await readFeeds();
  const expected=[...retailerSources.sources,...walletSources.sources];
  const payload=await json(origin+'/api/promotions?province=AR-J',{origin,cookie,authorization:`Bearer ${token}`});
  inbox=payload.data;
  const synchronized=inbox&&inbox.unavailableFeeds===0&&inbox.checks.length===expected.length&&expected.every(source=>inbox.checks.some(check=>check.name===(source.retailer??source.source??source.sourceId)&&check.checkedAt===source.checkedAt));
  if(synchronized)break;
  if(attempt===12)throw new Error('La app no leyó los informes publicados después de renovar la caché');
  await new Promise(resolve=>setTimeout(resolve,15000));
}
assert.equal(inbox.completeCoverage,false,'No debe anunciar cobertura nacional completa');
const knownBenefits=new Set(wallet.benefits.map(benefit=>`benefit|${benefit.id}|${benefit.validFrom}|${benefit.validTo}`));
const proofs=[...retailer.promotions,...partner.promotions];
const knownProducts=new Set(proofs.map(offer=>['product',offer.storeId,offer.ean,offer.promotionSlot??'promo1',offer.validFrom,offer.validTo].join('|')));
for(const entry of inbox.entries) {
  assert.ok(entry.type==='benefit'?knownBenefits.has(entry.id):entry.type==='product'&&knownProducts.has(entry.id),'La campanita incorporó un candidato ajeno al archivo verificado');
  assert.ok(entry.sourceUrl?.startsWith('https://'));
  assert.ok(entry.validFrom<=entry.date&&entry.date<=entry.validTo);
  assert.ok(entry.conditions&&entry.note,'La notificación debe explicar las condiciones y cómo se aplica');
  if(entry.type==='benefit')assert.match(entry.note,/No está descontado automáticamente/);
}
const report={checkedAt:new Date().toISOString(),success:true,province:'AR-J',sourceChecks:inbox.checks.length,verifiedNotifications:inbox.entries.length,pendingCandidates:inbox.pendingCandidates,feedsReadByApp:true,unverifiedCandidatesExcluded:true};
await writeFile('promotion-app-check.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
