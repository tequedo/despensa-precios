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
const batchSize = Math.min(Number(process.env.BATCH_SIZE ?? 75), 100);
if (ingestEndpoint && !ingestToken) throw new Error("Falta PRICE_INGEST_TOKEN para cargar los precios en la aplicación");

async function send(records) {
  if (!ingestEndpoint || !records.length) return;
  const response = await fetch(ingestEndpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${ingestToken}`, "content-type": "application/json" },
    body: JSON.stringify({ records })
  });
  if (!response.ok) throw new Error(`La aplicación rechazó el lote: ${response.status} ${await response.text()}`);
}
const outputFile = process.env.OUTPUT_FILE ?? "data/san-juan.ndjson";
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

function isSanJuan(row) {
  const province = normalize(pick(row, ["sucursales_provincia", "sucursal_provincia", "provincia", "provincia_id"]));
  if (!(provinceCodes.has(province) || province === "san juan" || province === "j")) return false;
  const latitude = Number(pick(row, ["sucursales_latitud", "sucursal_latitud", "latitud"]));
  const longitude = Number(pick(row, ["sucursales_longitud", "sucursal_longitud", "longitud"]));
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return latitude >= -33.5 && latitude <= -28 && longitude >= -71 && longitude <= -66;
  }
  const locality = normalize(pick(row, ["sucursales_localidad", "sucursal_localidad", "localidad"]));
  return !locality.includes("jujuy") && !locality.includes("palpala") && !locality.includes("perico");
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
    await rows(file, row => {
      if (isSanJuan(row)) {
        const key = [pick(row, ["id_comercio"]), pick(row, ["id_bandera"])].join("|");
        row._chain = chains.get(key) ?? "Comercio";
        branches.set(branchKey(row), row);
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
      if (!listPrice || listPrice < 100) {
        counters.rejected++;
        return;
      }
      const promoPrice = number(pick(row, [
        "productos_precio_promocional",
        "productos_precio_promocional_1",
        "productos_precio_promocional1",
        "productos_precio_unitario_promo1",
        "precio_promocional"
      ]));
      const promoConditions = pick(row, [
        "productos_leyenda_promocion",
        "productos_leyenda_promocion_1",
        "productos_leyenda_promocion1",
        "productos_leyenda_promo1",
        "leyenda_promocion"
      ]);
      const ean = pick(row, ["productos_ean", "producto_ean", "id_producto"]);
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
          externalId: pick(branch, ["sucursal_id", "id_sucursal"]),
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
          validDate: pick(row, ["productos_fecha_actualizacion", "fecha_actualizacion"], new Date().toISOString().slice(0, 10)).slice(0, 10),
          observedAt: new Date().toISOString()
        }
      };
      await appendFile(outputFile, JSON.stringify(record) + "\n");
      counters.accepted++;
    });
    await send(batch);
    counters.ingested += batch.length;
  }
}

try {
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, "");

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
    await execFileAsync("tar", ["--use-compress-program=unzstd", "-xf", archive, "-C", outerDir], { maxBuffer: 10 * 1024 * 1024 });
  }

  const counters = { read: 0, accepted: 0, ingested: 0, rejected: 0, damagedArchives: 0 };
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
    try {
      await extract(zip, folder);
      await processFolder(folder, { url: sourceUrl, modified: resource.last_modified }, counters);
    } catch (error) {
      counters.damagedArchives++;
      console.warn(`SEPA omitió archivo dañado: ${basename(zip)} (${error.message})`);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
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
