import { createReadStream } from "node:fs";
import { appendFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { createMeatMatcher, hasExactKilogramBasis, isPlausibleMeatPrice } from "./meat-matcher.mjs";

import { nationalExporter } from "./national-export.mjs";
import { provinceFor, isoDate, freshDate } from "./price-safety.mjs";
import { prepareSource } from "./sepa-source.mjs";
import { sepaProductIdentity } from "./product-identity.mjs";
import { sepaAmount } from "./sepa-values.mjs";
import { readSepaPricing } from "./sepa-pricing.mjs";
import { readSepaRows as rows } from "./sepa-csv.mjs";
import { writeSanJuanSnapshot } from "./san-juan-snapshot.mjs";
import { branchChannel, productFileEvidence } from "./sepa-catalog-controls.mjs";

const ingestEndpoint = process.env.DESPENSA_INGEST_URL;
const ingestToken = process.env.PRICE_INGEST_TOKEN;
const batchSize = Math.min(Math.max(Number(process.env.BATCH_SIZE ?? 75), 1), 100);
const batchDelayMs = Math.max(Number(process.env.BATCH_DELAY_MS ?? 900), 0);
const maxIngestRetries = Math.min(Math.max(Number(process.env.INGEST_RETRIES ?? 5), 0), 6);
let nextIngestAt = 0;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
if (ingestEndpoint && !ingestToken) throw new Error("Falta PRICE_INGEST_TOKEN para cargar los precios en la aplicación");

async function send(records) {
  if (!ingestEndpoint || !records.length) return 0;

  const pause = nextIngestAt - Date.now();
  if (pause > 0) await wait(pause);

  for (let attempt = 0; attempt <= maxIngestRetries; attempt++) {
    const response = await fetch(ingestEndpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${ingestToken}`, "content-type": "application/json" },
      body: JSON.stringify({ records })
    });
    if (response.ok) {
      nextIngestAt = Date.now() + batchDelayMs;
      return records.length;
    }

    const responseBody = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxIngestRetries) {
      throw new Error(`La aplicación rechazó el lote: ${response.status} ${responseBody}`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(30_000, 1_000 * 2 ** attempt);
    console.warn(`Carga temporalmente limitada (HTTP ${response.status}); reintento ${attempt + 1} en ${backoff} ms`);
    await wait(backoff);
  }

  return 0;
}

const outputFile = process.env.OUTPUT_FILE ?? "data/san-juan.ndjson";
const quarantineFile = process.env.QUARANTINE_FILE ?? "data/san-juan-quarantine.ndjson";
const promotionsFile = process.env.PROMOTIONS_FILE ?? "data/san-juan-promotions.json";
const qualityFile = process.env.QUALITY_FILE ?? "data/sepa-import-quality.json";
const national = process.env.NATIONAL_EXPORT === "1";
const provinceCodes = new Set((process.env.PROVINCE_CODES ?? "AR-J").split(",").map(normalize));
const keywords = JSON.parse(await readFile(new URL("./san-juan-products.json", import.meta.url), "utf8")).map(normalize);
const keywordPatterns = keywords.map(keyword => new RegExp("(?:^|\\b)" + keyword + "(?:\\b|$)"));
const meatCatalog = JSON.parse(await readFile(new URL("./data/meat-catalog.json", import.meta.url), "utf8"));
const isMeatProduct = createMeatMatcher(meatCatalog);
const workDir = await mkdtemp(join(tmpdir(), "sepa-precios-"));
const exporter = national ? await nationalExporter(process.env.NATIONAL_OUTPUT_DIR ?? "data/national",join(workDir,"branches")) : null;
const sanJuanRecords = [];

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

const sanJuanLocalities = [
  "san juan", "ciudad de san juan", "rawson", "rivadavia", "chimbas",
  "santa lucia", "pocito", "caucete", "albardon", "angaco", "nueve de julio",
  "9 de julio", "ullum", "zonda", "sarmiento", "jachal", "iglesia",
  "calingasta", "valle fertil", "veinticinco de mayo", "25 de mayo",
  "san martin"
];
const foreignLocalities = [
  "jujuy", "palpala", "perico", "mendoza", "la rioja", "cordoba",
  "san luis", "salta", "catamarca"
];

function geographicValidation(row) {
  const province = normalize(pick(row, ["sucursales_provincia", "sucursal_provincia", "provincia", "provincia_id"]));
  const jurisdiction=provinceFor(province);
  if(national && jurisdiction && jurisdiction.code!=="AR-J") {
    const locality=pick(row,["sucursales_localidad","sucursal_localidad","localidad"]);
    const lat=pick(row,["sucursales_latitud","sucursal_latitud","latitud"]), lon=pick(row,["sucursales_longitud","sucursal_longitud","longitud"]);
    if(!locality) return {accepted:false,reason:"missing_locality"};
    if(Boolean(lat)!==Boolean(lon))return {accepted:false,reason:"incomplete_coordinates"};
    if(lat&&(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Number(lat)<-56||Number(lat)>-21||Number(lon)<-74||Number(lon)>-53))return {accepted:false,reason:"coordinates_outside_argentina"};
    return {accepted:true};
  }
  if (!(provinceCodes.has(province) || province === "san juan" || province === "j")) {
    return { accepted: false, reason: "province_not_san_juan" };
  }
  const locality = normalize(pick(row, ["sucursales_localidad", "sucursal_localidad", "localidad"]));
  if (foreignLocalities.some(name => locality.includes(name))) {
    return { accepted: false, reason: "foreign_locality" };
  }
  const latitudeText = pick(row, ["sucursales_latitud", "sucursal_latitud", "latitud"]);
  const longitudeText = pick(row, ["sucursales_longitud", "sucursal_longitud", "longitud"]);
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const hasLatitude = latitudeText !== "" && Number.isFinite(latitude);
  const hasLongitude = longitudeText !== "" && Number.isFinite(longitude);
  if (hasLatitude !== hasLongitude) return { accepted: false, reason: "incomplete_coordinates" };
  if (hasLatitude && (latitude < -32.85 || latitude > -28.2 || longitude < -70.75 || longitude > -66.65)) {
    return { accepted: false, reason: "coordinates_outside_san_juan" };
  }
  if (!hasLatitude && !sanJuanLocalities.some(name => locality.includes(name))) {
    return { accepted: false, reason: "unverified_locality_without_coordinates" };
  }
  return { accepted: true };
}


async function quarantine(kind, reason, details, counters) {
  counters.quarantined++;
  await appendFile(quarantineFile, JSON.stringify({ kind, reason, details, detectedAt: new Date().toISOString() }) + "\n");
}

async function rowsFromNdjson(file, handler) {
  const input = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of input) if (line.trim()) await handler(JSON.parse(line));
}

function pick(row, names, fallback = "") {
  for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name];
  return fallback;
}

function branchKey(row) {
  return [
    pick(row, ["comercio_cuit", "productos_comercio_cuit", "id_comercio"]),
    pick(row, ["bandera_id", "productos_bandera_id", "id_bandera"]),
    pick(row, ["sucursal_id", "productos_sucursal_id", "id_sucursal"])
  ].map(String).join("|");
}

async function filesBelow(root) {
  const found = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...await filesBelow(path));
    else found.push(path);
  }
  return found;
}

async function processFolder(folder, sourceInfo, counters) {
  const files = await filesBelow(folder);
  const branchFiles = files.filter(file => /sucursales\.csv$/i.test(file));
  const productFiles = files.filter(file => /productos\.csv$/i.test(file));
  const commerceFiles = files.filter(file => /comercio\.csv$/i.test(file));
  if (!branchFiles.length || !productFiles.length) return;

  const chains = new Map();
  for (const file of commerceFiles) {
    await rows(file, row => {
      const key = [pick(row, ["id_comercio"]), pick(row, ["id_bandera"])].join("|");
      chains.set(key, pick(row, ["comercio_bandera_nombre", "comercio_razon_social"], "Comercio"));
    });
  }

  const branches = new Map();
  for (const file of branchFiles) {
    await rows(file, async row => {
      const type = pick(row, ["sucursales_tipo", "sucursal_tipo"]);
      const channel = branchChannel(type);
      if (channel !== 'sucursal') {
        counters.excludedStores.push({ externalId: branchKey(row), type, channel, reason: channel === 'online' ? 'online_delivery_scope_unverified' : 'unknown_store_type' });
        await quarantine("store_channel", counters.excludedStores.at(-1).reason, counters.excludedStores.at(-1), counters);
        return;
      }
      row._channel = channel;
      const validation = geographicValidation(row);
      if (validation.accepted) {
        const key = [pick(row, ["id_comercio"]), pick(row, ["id_bandera"])].join("|");
        row._chain = chains.get(key) ?? "Comercio";
        branches.set(branchKey(row), row);
      } else if (normalize(pick(row, ["sucursales_provincia", "sucursal_provincia", "provincia", "provincia_id"])).includes("san juan")) {
        await quarantine("store", validation.reason, {
          externalId: branchKey(row),
          locality: pick(row, ["sucursales_localidad", "sucursal_localidad", "localidad"]),
          latitude: pick(row, ["sucursales_latitud", "sucursal_latitud", "latitud"]),
          longitude: pick(row, ["sucursales_longitud", "sucursal_longitud", "longitud"])
        }, counters);
      }
    }, { allowBranchContinuations: true, onRepair: repair => {
      counters.csvRepairs.push({ file: relative(folder, file).replaceAll('\\', '/'), ...repair });
    } });
  }
  if (!branches.size) return;

  for (const file of productFiles) {
    const evidence = await productFileEvidence(file, sourceInfo.modified);
    const productFile = relative(folder, file).replaceAll('\\', '/');
    counters.productFiles.push({ file: productFile, ...evidence });
    if (!evidence.accepted) {
      await quarantine("file_date", evidence.reason, { file: productFile, ...evidence }, counters);
      continue;
    }
    const datedSource = { ...sourceInfo, productFile, fileUpdatedAt: evidence.updatedAt, priceDate: evidence.date, dateBasis: evidence.dateBasis };
    await rows(file, async row => {
      counters.read++;
      const branch = branches.get(branchKey(row));
      if (!branch) return;
      const description = pick(row, ["productos_descripcion", "producto_descripcion", "descripcion"]);
      const brand = pick(row, ["productos_marca", "producto_marca", "marca"]);
      const normalizedDescription = normalize(description);
      const meatProduct = isMeatProduct(description, brand);
      if (!keywordPatterns.some(pattern => pattern.test(normalizedDescription)) && !meatProduct) return;
      const presentationQuantity = pick(row, ["productos_cantidad_presentacion", "cantidad_presentacion"]);
      const presentationUnit = pick(row, ["productos_unidad_medida_presentacion", "unidad_medida_presentacion"]);
      const referenceUnit = pick(row, ["productos_unidad_medida_referencia", "producto_unidad_medida_referencia", "unidad_medida_referencia"]);
      const presentation = [presentationQuantity, presentationUnit].filter(Boolean).join(" ");
      if (meatProduct && !hasExactKilogramBasis(presentation, referenceUnit)) {
        counters.rejected++;
        await quarantine("meat", "meat_unit_not_exact_1kg", { product: description, brand, presentation, referenceUnit, store: branchKey(branch) }, counters);
        return;
      }
      const listPrice = sepaAmount(pick(row, ["productos_precio_lista", "producto_precio_lista", "precio_lista"]));
      if (!listPrice || listPrice < 100 || listPrice > 10000000) {
        counters.rejected++;
        await quarantine("price", "list_price_out_of_range", {
          product: description,
          store: branchKey(branch),
          value: pick(row, ["productos_precio_lista", "producto_precio_lista", "precio_lista"])
        }, counters);
        return;
      }
      if (meatProduct && !isPlausibleMeatPrice(listPrice)) {
        counters.rejected++;
        await quarantine("meat", "meat_price_out_of_range", { product: description, brand, presentation, referenceUnit, listPrice, store: branchKey(branch) }, counters);
        return;
      }
      const validDate=evidence.date;
      const productUpdatedAt=isoDate(pick(row,["productos_fecha_actualizacion","fecha_actualizacion"]));
      if(!validDate||!freshDate(validDate)|| (productUpdatedAt && (productUpdatedAt>validDate || !freshDate(productUpdatedAt)))){
        counters.rejected++;return;
      }
      const pricing = readSepaPricing(row, listPrice, validDate);
      for (const issue of pricing.issues) {
        if (issue.kind === 'promotion') counters.promotionsDiscarded++;
        await quarantine(issue.kind, issue.reason, { ...issue, product:description, store:branchKey(branch), listPrice, validDate }, counters);
      }
      const primaryPromotion = pricing.promotions.find(offer => offer.slot === 'promo1');
      const { slot: primarySlot, ...legacyPromotion } = primaryPromotion ?? {};
      const identity = sepaProductIdentity(row);
      if (!identity.accepted) {
        counters.rejected++;
        await quarantine("product", identity.reason, { product: description, store: branchKey(branch) }, counters);
        return;
      }
      if (identity.barcodeStatus === 'invalid') {
        await quarantine("product_identity", "invalid_declared_gtin_kept_as_scoped_id", { product: description, sourceProductId: identity.sourceProductId, store: branchKey(branch) }, counters);
      }
      counters.productIdentity ??= { valid_format_and_checksum: 0, restricted: 0, internal: 0, invalid: 0 };
      counters.productIdentity[identity.barcodeStatus]++;
      const { accepted, ...productIdentity } = identity;
      const ean = identity.ean;
      const record = {
        source: datedSource,
        product: {
          ...productIdentity,
          name: description || ean,
          brand,
          presentation,
          referenceUnit: referenceUnit || presentationUnit || "unidad"
        },
        store: {
          externalId: branchKey(branch),
          type: pick(branch, ["sucursales_tipo", "sucursal_tipo"]),
          channel: branch._channel,
          chain: pick(branch, ["_chain", "bandera_descripcion", "comercio_razon_social", "cadena"]),
          branch: pick(branch, ["sucursales_nombre", "sucursal_nombre", "nombre"]),
          address: [pick(branch, ["sucursales_calle", "sucursal_direccion", "direccion"]), pick(branch, ["sucursales_numero"])].filter(Boolean).join(" "),
          locality: pick(branch, ["sucursales_localidad", "sucursal_localidad", "localidad"]),
          province: provinceFor(pick(branch,["sucursales_provincia","sucursal_provincia","provincia","provincia_id"]))?.name ?? "San Juan",
          latitude: Number(pick(branch, ["sucursales_latitud", "sucursal_latitud", "latitud"])) || undefined,
          longitude: Number(pick(branch, ["sucursales_longitud", "sucursal_longitud", "longitud"])) || undefined
        },
        price: {
          listPrice,
          ...legacyPromotion,
          promotions: pricing.promotions,
          referencePrice: pricing.referencePrice,
          channel: branch._channel,
          validDate,
          productUpdatedAt,
          observedAt: evidence.updatedAt
        }
      };
      if(exporter)await exporter.add(record);
      counters.accepted++;
      if(record.store.province !== "San Juan")return;
      sanJuanRecords.push(record);
    });
  }
}

try {
  // Complete archive validation before touching outputs or sending any prices.
  const prepared = await prepareSource(workDir);
  const { resource } = prepared;
  await mkdir(dirname(outputFile), { recursive: true });
  await mkdir(dirname(quarantineFile), { recursive: true });
  await writeFile(quarantineFile, "");

  const counters = { read: 0, accepted: 0, ingested: 0, rejected: 0, quarantined: 0, promotionsDiscarded: 0, damagedArchives: 0, excludedStores: [], productFiles: [], csvRepairs: [] };
  await processFolder(prepared.folder, prepared.source, counters);
  await mkdir(dirname(qualityFile), { recursive: true });
  await writeFile(qualityFile, JSON.stringify({ checkedAt: new Date().toISOString(), sourceModified: prepared.source.modified, sourceType: prepared.report.sourceType, excludedStores: counters.excludedStores, productFiles: counters.productFiles, csvRepairs: counters.csvRepairs }, null, 2) + '\n');

  if (!counters.accepted) throw new Error("El recurso SEPA no produjo precios válidos para el alcance solicitado");
  if (counters.damagedArchives) throw new Error(`La actualización quedó incompleta: ${counters.damagedArchives} archivo(s) ZIP con contenido no pudieron procesarse`);
  const coverage = exporter ? await exporter.finish() : null;
  const snapshot = await writeSanJuanSnapshot(outputFile,sanJuanRecords,coverage?.find(p=>p.code==='AR-J')?.records);
  counters.sanJuanRecords = snapshot.rows.length;
  counters.sanJuanSha256 = snapshot.sha256;
  for(let start=0;start<snapshot.rows.length;start+=batchSize)counters.ingested += await send(snapshot.rows.slice(start,start+batchSize));
  const promotionRows = [];
  await rowsFromNdjson(outputFile, record => {
    const chain = normalize(record.store?.chain);
    for (const promotion of record.price?.promotions ?? []) {
      promotionRows.push({...record, price:{...record.price, ...promotion}});
    }
  });
  const uniquePromotions = new Map();
  for (const record of promotionRows) {
    const key = [record.store.externalId, record.product.ean, record.price.slot, record.price.promoPrice ?? "", normalize(record.price.promoConditions)].join("|");
    uniquePromotions.set(key, record);
  }
  const promotions = [...uniquePromotions.values()].map(record => ({
    chain: record.store.chain, branch: record.store.branch, locality: record.store.locality, province:record.store.province,storeId:record.store.externalId,
    ean: record.product.ean, product: record.product.name, brand: record.product.brand,
    listPrice: record.price.listPrice, promoPrice: record.price.promoPrice,
    conditions: record.price.promoConditions, promotionSlot: record.price.slot, promoKind: record.price.promoKind,
    buyQuantity: record.price.buyQuantity, payQuantity: record.price.payQuantity,
    discountPercent: record.price.discountPercent, requiredBenefit: record.price.requiredBenefit,
    discountCap: record.price.discountCap, validDate: record.price.validDate,
    observedAt: record.price.observedAt, source: record.source.verificationUrl
  }));
  await mkdir(dirname(promotionsFile), { recursive: true });
  await writeFile(promotionsFile, JSON.stringify({
    generatedAt: new Date().toISOString(), scope: "San Juan",
    source: "SEPA - Precios Claros",
    sourceType: prepared.report.sourceType,
    originalComparison: prepared.report.originalComparison.status,
    verificationUrl: "https://datos.produccion.gob.ar/dataset/sepa-precios",
    chains: [...new Set(promotions.map(item => item.chain))].sort(), promotions
  }, null, 2) + "\n");
  console.log(JSON.stringify({
    source: "SEPA - Precios Claros",
    resource: resource.name,
    modified: resource.last_modified ?? resource.metadata_modified,
    scope: "San Juan",
    ...counters,
    outputFile,
    promotionsFile,
    promotionCandidates: promotions.length
  }));
} finally {
  await rm(workDir, { recursive: true, force: true });
}
