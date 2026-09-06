import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const API = "https://d3e6htiiul5ek9.cloudfront.net/prod";
const outputFile = process.env.OUTPUT_FILE ?? "data/san-juan.ndjson";
const keywords = JSON.parse(await readFile(new URL("./san-juan-products.json", import.meta.url), "utf8"));
const headers = {
  accept: "application/json",
  origin: "https://www.preciosclaros.gob.ar",
  referer: "https://www.preciosclaros.gob.ar/",
  "user-agent": "Mozilla/5.0 Chrome/131 Safari/537.36"
};

async function get(path, params) {
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers });
  if (response.status === 403) {
    const args = ["--fail", "--silent", "--show-error", "--location"];
    for (const [key, value] of Object.entries(headers)) args.push("--header", `${key}: ${value}`);
    args.push(url.toString());
    const { stdout } = await execFileAsync("curl", args, { maxBuffer: 20 * 1024 * 1024 });
    return JSON.parse(stdout);
  }
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function list(value, names) {
  for (const name of names) if (Array.isArray(value?.[name])) return value[name];
  return Array.isArray(value) ? value : [];
}

function pick(value, names, fallback = "") {
  for (const name of names) if (value?.[name] !== undefined && value[name] !== null) return value[name];
  return fallback;
}

function positiveNumber(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, "");

const branchPayload = await get("/sucursales", { lat: -31.5375, lng: -68.5364, limit: 100 });
const branches = list(branchPayload, ["sucursales", "results", "items"]);
if (!branches.length) throw new Error("Precios Claros no devolvió sucursales cercanas a San Juan");

const branchIds = branches
  .map(branch => pick(branch, ["id", "idSucursal", "id_sucursal"]))
  .filter(Boolean)
  .join(",");

const products = new Map();
for (const keyword of keywords) {
  const payload = await get("/productos", {
    string: keyword,
    array_sucursales: branchIds,
    offset: 0,
    limit: 50,
    sort: "-cant_sucursales_disponible"
  });
  for (const product of list(payload, ["productos", "results", "items"])) {
    const id = pick(product, ["id", "idProducto", "id_producto"]);
    if (id) products.set(String(id), product);
  }
}

let accepted = 0;
for (const [id, summary] of products) {
  const payload = await get("/producto", { id_producto: id, array_sucursales: branchIds, limit: 100 });
  const product = payload.producto ?? payload.product ?? summary;
  const records = [];
  for (const store of list(payload, ["sucursales", "comercios", "results", "items"])) {
    const priceData = store.preciosProducto ?? store.precios_producto ?? store.precio ?? store;
    const listPrice = positiveNumber(pick(priceData, ["precioLista", "precio_lista", "precio", "price"]));
    if (!listPrice) continue;
    records.push({
      source: { name: "SEPA - Precios Claros", kind: "official_api", official: true, verificationUrl: "https://www.preciosclaros.gob.ar/" },
      product: {
        ean: id,
        name: pick(product, ["nombre", "name", "descripcion"], id),
        brand: pick(product, ["marca", "brand"]),
        presentation: pick(product, ["presentacion", "presentation"]),
        referenceUnit: "unidad"
      },
      store: {
        externalId: pick(store, ["id", "idSucursal", "id_sucursal"]),
        chain: pick(store, ["banderaDescripcion", "bandera_descripcion", "razonSocial"]),
        branch: pick(store, ["sucursalNombre", "nombre"]),
        address: pick(store, ["direccion", "address"]),
        locality: pick(store, ["localidad"], "San Juan"),
        province: "San Juan",
        latitude: positiveNumber(pick(store, ["lat", "latitud"])),
        longitude: positiveNumber(pick(store, ["lng", "longitud"]))
      },
      price: {
        listPrice,
        promoPrice: positiveNumber(pick(priceData, ["precioPromo1", "precio_promocional"])),
        promoConditions: pick(priceData, ["promo1Descripcion", "leyendaPromocion", "promoConditions"]),
        promoKind: "none",
        channel: "sucursal",
        validDate: new Date().toISOString().slice(0, 10),
        observedAt: new Date().toISOString()
      }
    });
  }
  if (records.length) await appendFile(outputFile, records.map(JSON.stringify).join("\n") + "\n");
  accepted += records.length;
}

if (!accepted) throw new Error("La API oficial respondió, pero no produjo precios válidos");
console.log(JSON.stringify({ source: "Precios Claros API", branches: branches.length, products: products.size, accepted }));
