import { createReadStream } from "node:fs";
import { appendFile, mkdtemp, mkdir, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const METADATA = "https://raw.githubusercontent.com/catdevnull/sepa-precios-metadata/master/dataset-info.json";
const manualZipUrl = process.env.MANUAL_ZIP_URL;
const ingestEndpoint = process.env.DESPENSA_INGEST_URL;
const ingestToken = process.env.PRICE_INGEST_TOKEN;
const resendApiKey = process.env.RESEND_API_KEY;
const notifyEmail = process.env.NOTIFY_EMAIL;
const notifyFrom = process.env.NOTIFY_FROM ?? "Despensa Inteligente <onboarding@resend.dev>";
const batchSize = Math.min(Number(process.env.BATCH_SIZE ?? 75), 100);
if (ingestEndpoint && !ingestToken) throw new Error("Falta PRICE_INGEST_TOKEN para cargar los precios en la aplicación");

async function send(records) {
  if (!ingestEndpoint || !records.length) return 0;
  const response = await fetch(ingestEndpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${ingestToken}`, "content-type": "application/json" },
    body: JSON.stringify({ records })
  });
  if (!response.ok) throw new Error(`La aplicación rechazó el lote: ${response.status} ${await response.text()}`);
  return records.length;
}

async function notifyArchive({ filename, status, accepted = 0, ingested = 0, detail = "" }) {
  if (!resendApiKey || !notifyEmail) return false;
  const ok = status === "processed";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
      "idempotency-key": `sepa-${new Date().toISOString().slice(0, 10)}-${filename}-${status}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 200)
    },
    body: JSON.stringify({
      from: notifyFrom,
      to: [notifyEmail],
      subject: `${ok ? "SEPA cargado" : "SEPA con error"}: ${filename}`,
      text: [
        `Archivo: ${filename}`,
        `Estado: ${ok ? "procesado y cargado" : "no pudo procesarse"}`,
        `Registros de San Juan aceptados: ${accepted}`,
        `Registros cargados en la app: ${ingested}`,
        `Fecha y hora: ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/San_Juan" })}`,
        detail ? `Detalle: ${detail}` : ""
      ].filter(Boolean).join("\n")
    })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return true;
}
const outputFile = process.env.OUTPUT_FILE ?? "data/san-juan.ndjson";
const quarantineFile = process.env.QUARANTINE_FILE ?? "data/san-juan-quarantine.ndjson";
const provinceCodes = new Set((process.env.PROVINCE_CODES ?? "AR-J").split(",").map(normalize));
const keywords = JSON.parse(await readFile(new URL("./san-juan-products.json", import.meta.url), "utf8")).map(normalize);
const keywordPatterns = keywords.map(keyword => new RegExp("(?:^|\\b)" + keyword + "(?:\\b|$)"));
const workDir = await mkdtemp(join(tmpdir(), "sepa-san-juan-"));

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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

function validDateOrToday(value) {
  const candidate = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) && !Number.isNaN(new Date(`${candidate}T00:00:00Z`).getTime())
    ? candidate
    : new Date().toISOString().slice(0, 10);
}

function promotionExpired(conditions, validDate) {
  const match = normalize(conditions).match(/hasta(?:\s+el)?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return false;
  const end = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return end < validDate;
}

async function quarantine(kind, reason, details, counters) {
  counters.quarantined++;
  await appendFile(quarantineFile, JSON.stringify({ kind, reason, details, detectedAt: new Date().toISOString() }) + "\n");
}

function parsePipe(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "|" && !quoted) {
      values.push(value);
      value = "";
    } else value += char;
  }
  values.push(value);
  return values;
}

async function rows(file, handler) {
  const input = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let headers;
  for await (const raw of input) {
    const line = raw.replace(/^\uFEFF/, "");
    if (!line || line.startsWith("Última actualización:")) continue;
    const values = parsePipe(line);
    if (!headers) {
      headers = values.map(value => normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
      continue;
    }
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] ?? ""; });
    await handler(row);
  }
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

function productKey(row) {
  const supplied = pick(row, ["productos_ean", "producto_ean"]);
  const digits = String(supplied).replace(/\D/g, "");
  if (digits.length >= 8 && !/^0+$/.test(digits)) return supplied;
  return [
    "sepa",
    pick(row, ["id_comercio", "productos_comercio_cuit"]),
    pick(row, ["id_bandera", "productos_bandera_id"]),
    pick(row, ["id_producto", "productos_id"])
  ].map(String).join(":");
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

async function extract(zip, target) {
  await mkdir(target, { recursive: true });
  try {
    await execFileAsync("unzip", ["-oq", zip, "-d", target], { maxBuffer: 10 * 1024 * 1024 });
  } catch {
    await execFileAsync("7z", ["x", "-y", `-o${target}`, zip], { maxBuffer: 20 * 1024 * 1024 });
  }
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
    });
  }
  if (!branches.size) return;

  for (const file of productFiles) {
    let batch = [];
    await rows(file, async row => {
      counters.read++;
      const branch = branches.get(branchKey(row));
      if (!branch) return;
      const description = pick(row, ["productos_descripcion", "producto_descripcion", "descripcion"]);
      const normalizedDescription = normalize(description);
      if (!keywordPatterns.some(pattern => pattern.test(normalizedDescription))) return;
      const listPrice = number(pick(row, ["productos_precio_lista", "producto_precio_lista", "precio_lista"]));
      if (!listPrice || listPrice < 100 || listPrice > 10000000) {
        counters.rejected++;
        await quarantine("price", "list_price_out_of_range", {
          product: description,
          store: branchKey(branch),
          value: pick(row, ["productos_precio_lista", "producto_precio_lista", "precio_lista"])
        }, counters);
        return;
      }
      let promoPrice = number(pick(row, [
        "productos_precio_promocional",
        "productos_precio_promocional_1",
        "productos_precio_promocional1",
        "productos_precio_unitario_promo1",
        "precio_promocional"
      ]));
      let promoConditions = pick(row, [
        "productos_leyenda_promocion",
        "productos_leyenda_promocion_1",
        "productos_leyenda_promocion1",
        "productos_leyenda_promo1",
        "leyenda_promocion"
      ]);
      const validDate = validDateOrToday(pick(row, ["productos_fecha_actualizacion", "fecha_actualizacion"]));
      if (promoPrice && (promoPrice < 100 || promoPrice > listPrice || promotionExpired(promoConditions, validDate))) {
        counters.promotionsDiscarded++;
        await quarantine("promotion", promotionExpired(promoConditions, validDate) ? "expired_promotion" : "invalid_promotion_price", {
          product: description,
          store: branchKey(branch),
          listPrice,
          promoPrice,
          promoConditions,
          validDate
        }, counters);
        promoPrice = undefined;
        promoConditions = "";
      }
      const ean = productKey(row);
      const record = {
        source: {
          name: "SEPA - Precios Claros",
          kind: "official_dataset",
          official: true,
          verificationUrl: "https://datos.produccion.gob.ar/dataset/sepa-precios",
          resource: sourceInfo.url,
          modified: sourceInfo.modified
        },
        product: {
          ean,
          name: description || ean,
          brand: pick(row, ["productos_marca", "producto_marca", "marca"]),
          presentation: [
            pick(row, ["productos_cantidad_presentacion", "cantidad_presentacion"]),
            pick(row, ["productos_unidad_medida_presentacion", "unidad_medida_presentacion"])
          ].filter(Boolean).join(" "),
          referenceUnit: pick(row, ["productos_unidad_medida_presentacion", "unidad_medida_presentacion"], "unidad")
        },
        store: {
          externalId: branchKey(branch),
          chain: pick(branch, ["_chain", "bandera_descripcion", "comercio_razon_social", "cadena"]),
          branch: pick(branch, ["sucursales_nombre", "sucursal_nombre", "nombre"]),
          address: [pick(branch, ["sucursales_calle", "sucursal_direccion", "direccion"]), pick(branch, ["sucursales_numero"])].filter(Boolean).join(" "),
          locality: pick(branch, ["sucursales_localidad", "sucursal_localidad", "localidad"], "San Juan"),
          province: "San Juan",
          latitude: Number(pick(branch, ["sucursales_latitud", "sucursal_latitud", "latitud"])) || undefined,
          longitude: Number(pick(branch, ["sucursales_longitud", "sucursal_longitud", "longitud"])) || undefined
        },
        price: {
          listPrice,
          promoPrice,
          promoConditions,
          promoKind: promoPrice ? "promotion" : "none",
          channel: "sucursal",
          validDate,
          observedAt: new Date().toISOString()
        }
      };
      await appendFile(outputFile, JSON.stringify(record) + "\n");
      counters.accepted++;
      batch.push(record);
      if (batch.length >= batchSize) {
        counters.ingested += await send(batch);
        batch = [];
      }
    });
    counters.ingested += await send(batch);
  }
}

try {
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, "");
  await mkdir(dirname(quarantineFile), { recursive: true });
  await writeFile(quarantineFile, "");

  let resource;
  let sourceUrl;
  const outerDir = join(workDir, "outer");
  await mkdir(outerDir, { recursive: true });

  if (manualZipUrl) {
    resource = { name: "SEPA diario aportado manualmente", url: manualZipUrl, last_modified: new Date().toISOString() };
    sourceUrl = manualZipUrl;
    const archive = join(workDir, "sepa-manual.zip");
    await execFileAsync("curl", ["--fail", "--location", "--retry", "3", "--output", archive, manualZipUrl], { maxBuffer: 10 * 1024 * 1024 });
    await extract(archive, outerDir);
  } else {
    const metadataResponse = await fetch(METADATA, { headers: { accept: "application/json" } });
    if (!metadataResponse.ok) throw new Error(`Espejo de metadatos SEPA: HTTP ${metadataResponse.status}`);
    const metadata = await metadataResponse.json();
    if (!metadata.success) throw new Error("El espejo no devolvió metadatos SEPA válidos");
    const resources = (metadata.result.resources ?? [])
      .filter(candidate => /\.zip(?:$|\?)/i.test(candidate.url ?? "") && candidate.revision_id && candidate.id)
      .sort((a, b) => String(b.last_modified ?? "").localeCompare(String(a.last_modified ?? "")));
    const today = new Date().toISOString().slice(0, 10);
    resource = resources.find(candidate => String(candidate.last_modified ?? "").slice(0, 10) < today) ?? resources[0];
    if (!resource?.url) throw new Error("No se encontró el archivo diario de SEPA");
    const filename = basename(new URL(resource.url).pathname);
    sourceUrl = `https://f004.backblazeb2.com/file/precios-justos-datasets/${resource.id}-revID-${resource.revision_id}-${filename}-repackaged.tar.zst`;
    const archive = join(workDir, "sepa.tar.zst");
    await execFileAsync("curl", ["--fail", "--location", "--retry", "3", "--output", archive, sourceUrl], { maxBuffer: 10 * 1024 * 1024 });
    await execFileAsync("tar", ["--no-same-owner", "--use-compress-program=unzstd", "-xf", archive, "-C", outerDir], { maxBuffer: 10 * 1024 * 1024 });
  }

  const counters = { read: 0, accepted: 0, ingested: 0, rejected: 0, quarantined: 0, promotionsDiscarded: 0, damagedArchives: 0, notificationErrors: 0 };
  await processFolder(outerDir, { url: sourceUrl, modified: resource.last_modified }, counters);

  const nested = (await filesBelow(outerDir)).filter(file => /\.zip$/i.test(file));
  if (nested[0]) {
    const handle = await open(nested[0], "r");
    const header = Buffer.alloc(32);
    await handle.read(header, 0, header.length, 0);
    await handle.close();
    console.log(JSON.stringify({ nestedFile: basename(nested[0]), nestedSize: (await stat(nested[0])).size, nestedHeaderHex: header.toString("hex") }));
  }
  let index = 0;
  for (const zip of nested) {
    const folder = join(workDir, `retailer-${index++}`);
    const beforeAccepted = counters.accepted;
    const beforeIngested = counters.ingested;
    try {
      await extract(zip, folder);
      await processFolder(folder, { url: sourceUrl, modified: resource.last_modified }, counters);
      await notifyArchive({
        filename: basename(zip),
        status: "processed",
        accepted: counters.accepted - beforeAccepted,
        ingested: counters.ingested - beforeIngested
      }).catch(error => { counters.notificationErrors++; console.warn(`No se notificó ${basename(zip)}: ${error.message}`); });
    } catch (error) {
      counters.damagedArchives++;
      console.warn(`SEPA omitió archivo dañado: ${basename(zip)} (${error.message})`);
      await notifyArchive({ filename: basename(zip), status: "failed", detail: error.message })
        .catch(mailError => { counters.notificationErrors++; console.warn(`No se notificó el error de ${basename(zip)}: ${mailError.message}`); });
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  }

  if (!nested.length) {
    await notifyArchive({
      filename: manualZipUrl ? "sepa-manual.zip" : basename(new URL(resource.url).pathname),
      status: "processed",
      accepted: counters.accepted,
      ingested: counters.ingested
    }).catch(error => { counters.notificationErrors++; console.warn(`No se notificó el archivo SEPA: ${error.message}`); });
  }

  if (!counters.accepted) throw new Error("El archivo oficial SEPA no produjo precios válidos para San Juan");
  console.log(JSON.stringify({
    source: "SEPA - Precios Claros",
    resource: resource.name,
    modified: resource.last_modified ?? resource.metadata_modified,
    scope: "San Juan",
    ...counters,
    outputFile
  }));
} finally {
  await rm(workDir, { recursive: true, force: true });
}
