import { createReadStream } from "node:fs";
import { appendFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CKAN = "https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios";
const outputFile = process.env.OUTPUT_FILE ?? "data/san-juan.ndjson";
const provinceCodes = new Set((process.env.PROVINCE_CODES ?? "AR-J").split(",").map(normalize));
const keywords = JSON.parse(await readFile(new URL("./san-juan-products.json", import.meta.url), "utf8")).map(normalize);
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
  const province = normalize(pick(row, ["sucursal_provincia", "provincia", "provincia_id"]));
  return provinceCodes.has(province) || province === "san juan" || province === "j";
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
  await execFileAsync("unzip", ["-oq", zip, "-d", target], { maxBuffer: 10 * 1024 * 1024 });
}

async function processFolder(folder, sourceInfo, counters) {
  const files = await filesBelow(folder);
  const branchFiles = files.filter(file => /sucursales\.csv$/i.test(file));
  const productFiles = files.filter(file => /productos\.csv$/i.test(file));
  if (!branchFiles.length || !productFiles.length) return;

  const branches = new Map();
  for (const file of branchFiles) {
    await rows(file, row => {
      if (isSanJuan(row)) branches.set(branchKey(row), row);
    });
  }
  if (!branches.size) return;

  for (const file of productFiles) {
    await rows(file, async row => {
      counters.read++;
      const branch = branches.get(branchKey(row));
      if (!branch) return;
      const description = pick(row, ["productos_descripcion", "producto_descripcion", "descripcion"]);
      const normalizedDescription = normalize(description);
      if (!keywords.some(keyword => normalizedDescription.includes(keyword))) return;
      const listPrice = number(pick(row, ["productos_precio_lista", "producto_precio_lista", "precio_lista"]));
      if (!listPrice) {
        counters.rejected++;
        return;
      }
      const promoPrice = number(pick(row, [
        "productos_precio_promocional",
        "productos_precio_promocional_1",
        "productos_precio_promocional1",
        "precio_promocional"
      ]));
      const promoConditions = pick(row, [
        "productos_leyenda_promocion",
        "productos_leyenda_promocion_1",
        "productos_leyenda_promocion1",
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
          chain: pick(branch, ["bandera_descripcion", "comercio_razon_social", "cadena"]),
          branch: pick(branch, ["sucursal_nombre", "nombre"]),
          address: pick(branch, ["sucursal_direccion", "direccion"]),
          locality: pick(branch, ["sucursal_localidad", "localidad"], "San Juan"),
          province: "San Juan",
          latitude: number(pick(branch, ["sucursal_latitud", "latitud"])),
          longitude: number(pick(branch, ["sucursal_longitud", "longitud"]))
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
  }
}

try {
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, "");

  const metadataResponse = await fetch(CKAN, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } });
  if (!metadataResponse.ok) throw new Error(`SEPA CKAN: HTTP ${metadataResponse.status}`);
  const metadata = await metadataResponse.json();
  if (!metadata.success) throw new Error("SEPA CKAN no devolvió metadatos válidos");

  const resources = (metadata.result.resources ?? [])
    .filter(resource => /\.zip(?:$|\?)/i.test(resource.url ?? "") && /sepa|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo/i.test(`${resource.name ?? ""} ${resource.url ?? ""}`))
    .sort((a, b) => String(b.last_modified ?? b.metadata_modified ?? "").localeCompare(String(a.last_modified ?? a.metadata_modified ?? "")));
  const resource = resources[0];
  if (!resource?.url) throw new Error("No se encontró el ZIP diario de SEPA");

  const outerZip = join(workDir, "sepa.zip");
  await execFileAsync("curl", ["--fail", "--location", "--retry", "3", "--output", outerZip, resource.url], { maxBuffer: 10 * 1024 * 1024 });
  const outerDir = join(workDir, "outer");
  await extract(outerZip, outerDir);

  const counters = { read: 0, accepted: 0, rejected: 0 };
  await processFolder(outerDir, { url: resource.url, modified: resource.last_modified ?? resource.metadata_modified }, counters);

  const nested = (await filesBelow(outerDir)).filter(file => /\.zip$/i.test(file));
  let index = 0;
  for (const zip of nested) {
    const folder = join(workDir, `retailer-${index++}`);
    await extract(zip, folder);
    await processFolder(folder, { url: resource.url, modified: resource.last_modified ?? resource.metadata_modified }, counters);
    await rm(folder, { recursive: true, force: true });
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
