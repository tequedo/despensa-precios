import { createWriteStream, createReadStream } from "node:fs";
import { appendFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";

const CKAN = "https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios";
const requestHeaders = {
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
  accept: "application/json,text/plain,*/*",
  "accept-language": "es-AR,es;q=0.9,en;q=0.8",
  referer: "https://datos.produccion.gob.ar/dataset/sepa-precios"
};
const endpoint = process.env.DESPENSA_INGEST_URL;
const token = process.env.PRICE_INGEST_TOKEN;
const outputFile = process.env.OUTPUT_FILE;
const provinceCodes = new Set((process.env.PROVINCE_CODES ?? "").split(",").map(v => v.trim()).filter(Boolean));
const batchSize = Math.min(Number(process.env.BATCH_SIZE ?? 75), 100);
const keywords = JSON.parse(await readFile(new URL("./san-juan-products.json", import.meta.url), "utf8"));
if ((!endpoint || !token) && !outputFile) throw new Error("Configurá el destino HTTP o OUTPUT_FILE");
if (outputFile) { await mkdir(join(outputFile, ".."), { recursive: true }); await writeFile(outputFile, ""); }

const provinceNames = {"AR-A":"Salta","AR-B":"Buenos Aires","AR-C":"Ciudad Autónoma de Buenos Aires","AR-D":"San Luis","AR-E":"Entre Ríos","AR-F":"La Rioja","AR-G":"Santiago del Estero","AR-H":"Chaco","AR-J":"San Juan","AR-K":"Catamarca","AR-L":"La Pampa","AR-M":"Mendoza","AR-N":"Misiones","AR-P":"Formosa","AR-Q":"Neuquén","AR-R":"Río Negro","AR-S":"Santa Fe","AR-T":"Tucumán","AR-U":"Chubut","AR-V":"Tierra del Fuego","AR-W":"Corrientes","AR-X":"Córdoba","AR-Y":"Jujuy","AR-Z":"Santa Cruz"};
const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
function parse(line) { const out=[]; let value="",quoted=false; for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=!quoted;else if(c==='|'&&!quoted){out.push(value);value="";}else value+=c;}out.push(value);return out; }
async function* rows(file) { const rl=createInterface({input:createReadStream(file),crlfDelay:Infinity});let header;for await(const line of rl){if(!line||line.startsWith("Última actualización:"))continue;const values=parse(line);if(!header){header=values;continue;}yield Object.fromEntries(header.map((h,i)=>[h,values[i]??""]));} }
async function files(root){const found=[];for(const entry of await readdir(root,{withFileTypes:true})){const path=join(root,entry.name);if(entry.isDirectory())found.push(...await files(path));else found.push(path);}return found;}
function field(row,...names){for(const name of names)if(row[name]!==undefined)return row[name];return "";}
function promotion(text){const value=norm(text);let match=value.match(/(\d+)\s*x\s*(\d+)/);if(match)return{promoKind:"nxm",buyQuantity:Number(match[1]),payQuantity:Number(match[2])};match=value.match(/(\d+(?:[.,]\d+)?)\s*%/);if(match)return{promoKind:"percent",discountPercent:Number(match[1].replace(",","."))};return{promoKind:"none"};}
async function send(records){
  if(!records.length)return;
  if(outputFile)await appendFile(outputFile,records.map(record=>JSON.stringify(record)).join("\n")+"\n");
  if(endpoint&&token){const response=await fetch(endpoint,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({records})});if(!response.ok)throw new Error(`La aplicación rechazó el lote: ${response.status} ${await response.text()}`);}
}

const work=await mkdtemp(join(tmpdir(),"despensa-sepa-"));let read=0,accepted=0,rejected=0;
try{
  const metadataResponse=await fetch(CKAN,{headers:requestHeaders});if(!metadataResponse.ok)throw new Error(`CKAN respondió ${metadataResponse.status}`);const metadata=await metadataResponse.json();
  const resource=metadata.result.resources.filter(item=>/sepa_(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\.zip/i.test(item.name??item.url)).sort((a,b)=>new Date(b.last_modified??0)-new Date(a.last_modified??0))[0];
  if(!resource?.url)throw new Error("No se encontró el archivo diario de SEPA");
  const archive=join(work,"sepa.zip"),response=await fetch(resource.url,{headers:{...requestHeaders,accept:"application/zip,application/octet-stream,*/*"}});if(!response.ok)throw new Error(`Descarga SEPA respondió ${response.status}`);await pipeline(Readable.fromWeb(response.body),createWriteStream(archive));
  const outer=join(work,"outer");let run=spawnSync("unzip",["-q",archive,"-d",outer]);if(run.status!==0)throw new Error("No se pudo abrir el ZIP oficial");
  const nested=(await files(outer)).filter(file=>file.toLowerCase().endsWith(".zip"));
  for(const zip of nested){
    const dir=join(work,"chains",basename(zip,".zip"));run=spawnSync("unzip",["-q",zip,"-d",dir]);if(run.status!==0)continue;
    const all=await files(dir),branchFile=all.find(file=>/sucursales\.csv$/i.test(file)),productFile=all.find(file=>/productos\.csv$/i.test(file));if(!branchFile||!productFile)continue;
    const byId=new Map();for await(const branch of rows(branchFile)){const code=field(branch,"sucursales_provincia","provincia");if(provinceCodes.size&&!provinceCodes.has(code))continue;byId.set(field(branch,"id_sucursal","sucursales_id"),branch);}if(!byId.size)continue;
    let batch=[];
    for await(const product of rows(productFile)){
      read++;const branch=byId.get(field(product,"id_sucursal","productos_sucursal_id"));if(!branch)continue;
      const description=field(product,"productos_descripcion","descripcion"),brand=field(product,"productos_marca","marca"),search=norm(`${description} ${brand}`);if(keywords.length&&!keywords.some(keyword=>search.includes(norm(keyword))))continue;
      const price=Number(field(product,"productos_precio_lista","precio_lista"));if(!Number.isFinite(price)||price<=0||price>10000000){rejected++;continue;}
      const observedAt=new Date(field(product,"productos_fecha_actualizacion","fecha_actualizacion")||resource.last_modified||new Date().toISOString());if(Number.isNaN(observedAt.getTime())){rejected++;continue;}
      const promoConditions=field(product,"productos_leyenda_promocion","productos_leyenda_promocion_1"),code=field(branch,"sucursales_provincia","provincia");
      batch.push({source:{name:"SEPA - Precios Claros",kind:"official_dataset",official:true,verificationUrl:"https://www.argentina.gob.ar/economia/industria-y-comercio/defensadelconsumidor/precios-sepa"},product:{ean:field(product,"id_producto","productos_id"),name:description,brand,presentation:`${field(product,"productos_cantidad_presentacion","cantidad_presentacion")} ${field(product,"productos_unidad_medida_presentacion","unidad_medida_presentacion")}`.trim(),referenceUnit:field(product,"productos_unidad_medida_referencia","unidad_medida_referencia")||"unidad"},store:{externalId:field(branch,"id_sucursal","sucursales_id"),chain:field(branch,"bandera_descripcion","comercio_bandera_nombre","razon_social"),branch:field(branch,"sucursales_nombre","nombre"),address:field(branch,"sucursales_direccion","direccion"),locality:field(branch,"sucursales_localidad","localidad"),province:provinceNames[code]??code,latitude:Number(field(branch,"sucursales_latitud","latitud"))||undefined,longitude:Number(field(branch,"sucursales_longitud","longitud"))||undefined},price:{listPrice:price,promoPrice:Number(field(product,"productos_precio_promocional","productos_precio_promocional_1"))||undefined,promoConditions,...promotion(promoConditions),channel:"sucursal",validDate:observedAt.toISOString().slice(0,10),observedAt:observedAt.toISOString()}});
      if(batch.length>=batchSize){await send(batch);accepted+=batch.length;batch=[];}
    }
    await send(batch);accepted+=batch.length;
  }
  if(!accepted)throw new Error("El archivo oficial no produjo precios válidos para la canasta configurada");
  console.log(JSON.stringify({resource:resource.name,modified:resource.last_modified,scope:provinceCodes.size?[...provinceCodes]:"Argentina",read,accepted,rejected,outputFile:outputFile??null}));
}finally{await rm(work,{recursive:true,force:true});}
