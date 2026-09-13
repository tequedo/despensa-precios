import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {provinceFor,PROVINCES} from './price-safety.mjs';
const source='https://apis.datos.gob.ar/georef/api/provincias.geojson';
const response=await fetch(source,{signal:AbortSignal.timeout(60000)});
if(!response.ok)throw new Error('No se pudieron validar las provincias con Georef: HTTP '+response.status);
const data=await response.json();
const features=data.features??[];
const geometries=new Map();
for(const f of features){const p=provinceFor(f.properties?.id??f.properties?.nombre);if(p&&['Polygon','MultiPolygon'].includes(f.geometry?.type))geometries.set(p.code,f.geometry);}
if(geometries.size!==24)throw new Error('Georef no devolvió los polígonos de las 24 jurisdicciones');
function inRing(x,y,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function contains(geometry,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return false;const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polygons.some(poly=>inRing(x,y,poly[0])&&!poly.slice(1).some(ring=>inRing(x,y,ring)));}
const root='data/national',coverage=JSON.parse(await readFile(join(root,'coverage.json'),'utf8')),rejected=[];
for(const p of PROVINCES){
 const path=join(root,p.code,'index.json'),index=JSON.parse(await readFile(path,'utf8'));
 index.stores=index.stores.filter(store=>{const valid=contains(geometries.get(p.code),store.longitude,store.latitude);if(!valid)rejected.push({externalId:store.externalId,declaredProvince:p.name,locality:store.locality,latitude:store.latitude,longitude:store.longitude,reason:'coordinates_do_not_confirm_declared_province'});return valid;});
 index.geographyVerified=true;index.geographySource=source;
 await writeFile(path,JSON.stringify(index)+'\n');
 const summary=coverage.provinces.find(entry=>entry.code===p.code);summary.stores=index.stores.length;summary.records=index.stores.reduce((n,s)=>n+s.records,0);
}
coverage.geographyVerified=true;coverage.geographyCheckedAt=new Date().toISOString();coverage.geographySource=source;
await writeFile(join(root,'coverage.json'),JSON.stringify(coverage)+'\n');
await writeFile('data/national-geography-audit.json',JSON.stringify({checkedAt:coverage.geographyCheckedAt,source,rejectedCount:rejected.length,rejected},null,2)+'\n');
console.log(JSON.stringify({validatedProvinces:24,excludedStores:rejected.length,stores:coverage.provinces.reduce((n,p)=>n+p.stores,0),records:coverage.provinces.reduce((n,p)=>n+p.records,0)}));
