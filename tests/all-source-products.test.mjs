import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {OFFICIAL_METADATA_URL} from '../sepa-official.mjs';
import {OFFICIAL_DATASET_ID} from '../sepa-provenance.mjs';
import {argentinaDate} from '../price-safety.mjs';
import {includeCatalogProduct} from '../catalog-policy/lib/catalog-policy.mjs';

test('el importador real conserva productos fuera de las categorías anteriores y mantiene los controles de calidad',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'all-source-products-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const observed=new Date(Date.now()-3600000).toISOString(),date=argentinaDate(Date.parse(observed));
 assert.equal(includeCatalogProduct({name:'CLAVIJA HEXAGONAL ZVX',brand:'ZVX'},false),false);
 const footer='Ultima actualizacion: '+observed+'\n';
 const files={
  'merchant/comercio.csv':'id_comercio|id_bandera|comercio_razon_social|comercio_bandera_nombre\n99|1|Fixture|Fixture\n'+footer,
  'merchant/sucursales.csv':'id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|sucursales_localidad|sucursales_provincia\n99|1|1|Fixture|Supermercado|Calle|1|-31.534016|-68.524744|San Juan|AR-J\n'+footer,
  'merchant/productos.csv':'id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_marca|productos_precio_lista|productos_unidad_medida_referencia\n'+
   '99|1|1|10000|0|ARROZ BLANCO|1|kg|Fixture|1500.00|kg\n'+
   '99|1|1|10001|0|CLAVIJA HEXAGONAL ZVX|1|unidad|ZVX|2500.00|unidad\n'+
   '99|1|1|10002|0|ARTICULO ZVX 2 L|1|kg|ZVX|3500.00|kg\n'+
   '99|1|1|10003|0|CLAVIJA HEXAGONAL INVALIDA|1|unidad|ZVX|0.00|unidad\n'+footer,
 };
 await writeFile(join(dir,'files.json'),JSON.stringify(files));
 execFileSync('python3',['-c','import json,sys,zipfile\nfrom pathlib import Path\np=Path(sys.argv[1])\nwith zipfile.ZipFile(p/"source.zip","w") as z:\n for name,data in json.loads((p/"files.json").read_text()).items(): z.writestr(name,data)\n',dir]);
 const zip=await readFile(join(dir,'source.zip'));
 const resource={id:'f8e75128-515a-436e-bf8d-5c63a62f2005',revision_id:'72adcce2-b0ff-4af7-9594-adf43f1b259b',size:zip.length,last_modified:new Date().toISOString(),hash:''};
 resource.url=`https://datos.produccion.gob.ar/dataset/${OFFICIAL_DATASET_ID}/resource/${resource.id}/download/sepa_jueves.zip`;
 const metadata={success:true,result:{id:OFFICIAL_DATASET_ID,resources:[resource]}};
 const preload=join(dir,'network.mjs');
 await writeFile(preload,`globalThis.fetch=async url=>{let r;if(url===${JSON.stringify(OFFICIAL_METADATA_URL)})r=new Response(${JSON.stringify(JSON.stringify(metadata))});else if(url===${JSON.stringify(resource.url)})r=new Response(Buffer.from(${JSON.stringify(zip.toString('base64'))},'base64'));else throw new Error('Unexpected network destination');Object.defineProperty(r,'url',{value:url});return r;};`);
 const paths={OUTPUT_FILE:join(dir,'sj.ndjson'),PROMOTIONS_FILE:join(dir,'promotions.json'),QUARANTINE_FILE:join(dir,'quarantine.ndjson'),QUALITY_FILE:join(dir,'quality.json'),PROVENANCE_FILE:join(dir,'provenance.json'),NATIONAL_OUTPUT_DIR:join(dir,'national'),SEPA_ORIGINAL_DIR:join(dir,'originals')};
 const run=spawnSync(process.execPath,['--import',preload,new URL('../update-san-juan.mjs',import.meta.url).pathname],{env:{...process.env,...paths,SEPA_SOURCE:'official',NATIONAL_EXPORT:'1',PROVINCE_CODES:'AR-J',DESPENSA_INGEST_URL:'',PRICE_INGEST_TOKEN:''},encoding:'utf8',timeout:30000});
 assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 const index=JSON.parse(await readFile(join(dir,'national/AR-J/index.json'),'utf8'));
 assert.equal(index.stores.length,1);assert.equal(index.stores[0].records,3);
 const shard=JSON.parse(await readFile(join(dir,'national/AR-J',index.stores[0].file),'utf8'));
 const unknown=shard.prices.find(row=>row[0]==='sepa:99:1:10001');
 assert.equal(unknown[1],'CLAVIJA HEXAGONAL ZVX');assert.equal(unknown[3],'1 unidad');assert.equal(unknown[5],2500);assert.equal(unknown[6],date);
 const pending=shard.prices.find(row=>row[0]==='sepa:99:1:10002');
 assert.equal(pending[3],'1 kg');assert.equal(pending[5],3500);assert.equal(pending[11].catalogPolicy.quoteEligible,false);
 assert.equal(shard.prices.some(row=>row[0]==='sepa:99:1:10003'),false);
 const snapshot=(await readFile(paths.OUTPUT_FILE,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(snapshot.length,3);
 assert.equal(snapshot.find(row=>row.product.ean==='sepa:99:1:10001').price.listPrice,2500);
 const quality=JSON.parse(await readFile(paths.QUALITY_FILE,'utf8'));assert.equal(quality.catalogScope,'all_valid_physical_source_products');assert.equal(quality.filteredByCatalogPolicy,0);
 assert.match(await readFile(paths.QUARANTINE_FILE,'utf8'),/list_price_out_of_range/);
});
