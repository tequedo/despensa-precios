import test from 'node:test';
import assert from 'node:assert/strict';
import {warmCatalogIndexes} from './warm-catalog-index.mjs';
test('prepara la generación exacta, espera su propagación y verifica búsquedas nuevas sin caché de palabra',async()=>{
 let attempts=0,pauses=0;const queries=[];
 const fetcher=async(input,options)=>{const url=new URL(input);if(url.pathname.endsWith('/prepare')){if(!options)return Response.json({regions:[]});const body=JSON.parse(options.body);assert.equal(body.expectedGeneration,'test-generation');if(++attempts===1)return Response.json({generation:'old'},{status:409});return Response.json({ready:true,records:123,generation:'test-generation'});}queries.push(url);assert.equal(url.searchParams.has('snapshot'),false);return Response.json({data:{total:5},coverage:{indexed:true,generatedAt:'test-generation'}},{headers:{'Server-Timing':'catalog;dur=120'}});};
 const report=await warmCatalogIndexes({origin:'https://example.invalid',fetcher,readIndex:async()=>({generatedAt:'test-generation'}),pause:async()=>{pauses++;}});
 assert.equal(report.success,true);assert.equal(pauses,1);assert.equal(queries.length,5);assert.equal(report.regions[0].records,123);
});
test('un catálogo sin índice no se presenta como una optimización exitosa',async()=>{
 const fetcher=async(input,options)=>String(input).includes('/prepare')?Response.json(options?{ready:true,records:10,generation:'test-generation'}:{regions:[]}):Response.json({data:{total:1},coverage:{indexed:false}},{headers:{'Server-Timing':'catalog;dur=15000'}});
 const report=await warmCatalogIndexes({origin:'https://example.invalid',fetcher,readIndex:async()=>({generatedAt:'test-generation'})});assert.equal(report.success,false);assert.equal(report.errors.length,5);
});
test('una cabecera rápida no oculta una respuesta completa lenta',async()=>{
 let now=0;
 const fetcher=async(input,options)=>{
  if(String(input).includes('/prepare'))return Response.json(options?{ready:true,records:10,generation:'test-generation'}:{regions:[]});
  now+=2500;return Response.json({data:{total:1},coverage:{indexed:true}},{headers:{'Server-Timing':'catalog;dur=10'}});
 };
 const report=await warmCatalogIndexes({origin:'https://example.invalid',fetcher,clock:()=>now,readIndex:async()=>({generatedAt:'test-generation'})});
 assert.equal(report.success,false);assert.equal(report.queries.length,0);assert.equal(report.errors.length,5);
 assert.ok(report.errors.every(error=>/respuesta completa/.test(error.error)));
});

for(const coverage of [
 {generatedAt:'2026-11-18T21:22:58.000Z'},
 {},
 {generatedAt:'2026-11-18T23:28:38.126Z',updating:true},
 {generatedAt:'2026-11-18T23:28:38.126Z',preparingIndex:true},
])test('rechaza búsqueda rápida indexada sin generación vigente confirmada '+JSON.stringify(coverage),async()=>{
 const generation='2026-11-18T23:28:38.126Z';let reads=0;
 const fetcher=async(input,options)=>String(input).includes('/prepare')
  ?Response.json(options?{ready:true,records:10,generation}:{regions:[]})
  :Response.json({data:{total:1},coverage:{indexed:true,...coverage}},{headers:{'Server-Timing':'catalog;dur=10'}});
 const report=await warmCatalogIndexes({origin:'https://example.invalid',fetcher,readIndex:async()=>{reads++;return {generatedAt:generation};}});
 assert.equal(report.success,false);assert.equal(report.queries.length,0);assert.equal(reads,1);
 assert.equal(report.errors.length,5);
 assert.ok(report.errors.every(error=>error.expectedGeneration===generation&&/generación exacta/.test(error.error)));
 assert.equal(report.errors[0].generation,coverage.generatedAt??null);
});
test('congela la fuente entre preparación y búsqueda aunque otra carga llegue el mismo día',async()=>{
 const generation='2026-11-18T23:28:38.126Z';let reads=0;
 const fetcher=async(input,options)=>String(input).includes('/prepare')
  ?Response.json(options?{ready:true,records:10,generation}:{regions:[]})
  :Response.json({data:{total:1},coverage:{indexed:true,generatedAt:generation}},{headers:{'Server-Timing':'catalog;dur=10'}});
 const report=await warmCatalogIndexes({origin:'https://example.invalid',fetcher,readIndex:async()=>({generatedAt:++reads===1?generation:'2026-11-18T23:59:00.000Z'})});
 assert.equal(report.success,true);assert.equal(reads,1);assert.equal(report.queries.length,5);
});
