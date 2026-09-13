import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin=process.env.SITE_ORIGIN,token=process.env.PRICE_INGEST_TOKEN;
const profile=await fetch(origin+'/api/access',{method:'POST',headers:{origin,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({name:'Prueba técnica de reconocimiento',test:true})});
assert.equal(profile.status,200,'Perfil de prueba');
const cookie=profile.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function check(path,body){
 const headers={origin,cookie};if(!(body instanceof FormData))headers['content-type']='application/json';
 const r=await fetch(origin+path,{method:'POST',headers,body:body instanceof FormData?body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
 const data=await r.json();assert.equal(r.status,200,path+': '+(data.error??'sin respuesta'));return data;
}
const text=await check('/api/assistant-list',{text:'Agregá dos paquetes de arroz Gallo de un kilo.'});
assert.ok(text.items.some(i=>i.name==='Arroz'&&i.quantity===2),'Interpretación de cantidades');
const picture=await readFile('tests/fixtures/leche-prueba.png');
const photo=await check('/api/assistant-list',{imageData:'data:image/png;base64,'+picture.toString('base64')});
assert.ok(photo.items.some(i=>i.name.toLowerCase().includes('leche')&&i.quantity===2),'Recuento de envases de prueba');
const form=new FormData();form.set('audio',new Blob([await readFile('voice-qa.wav')],{type:'audio/wav'}),'lista.wav');
const voice=await check('/api/assistant-list/transcribe',form);
console.log('Resultado de audio sintético:',JSON.stringify({text:voice.text,items:voice.items,degraded:voice.degraded}));assert.ok(voice.text?.trim(),'Transcripción vacía');assert.ok(voice.items.some(i=>i.name==='Arroz'&&i.quantity===2),'Cantidad dictada');assert.notEqual(voice.degraded,true);
const report={checkedAt:new Date().toISOString(),success:true,text:true,photo:true,voice:true,syntheticFixtures:true,testProfileExcluded:true};
await writeFile('data/recognition-smoke-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
