import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const inputFile = process.env.PROMOTIONS_FILE ?? "data/san-juan-promotions.json";
const reportFile = process.env.RETAILER_REPORT_FILE ?? "data/retailer-promotion-sources.json";
const verifiedFile = process.env.RETAILER_VERIFIED_FILE ?? "data/retailer-promotions-verified.json";
const maxAgeHours = Number(process.env.PROMOTION_MAX_AGE_HOURS ?? 72);

const sources = [
  { id: "vea", chain: /vea/i, name: "Vea", url: "https://www.vea.com.ar/ofertas-y-catalogo" },
  { id: "changomas", chain: /chango|walmart|mas online/i, name: "ChangoMás", url: "https://www.masonline.com.ar/3195?map=productClusterIds" },
  { id: "libertad", chain: /libertad|la anonima/i, name: "Libertad / La Anónima", url: "https://www.laanonima.com.ar/empresa/catalogos", render: true },
  { id: "carrefour", chain: /carrefour/i, name: "Carrefour", url: "https://www.carrefour.com.ar/promociones", render: true }
];

const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const htmlText = html => normalize(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const dateWindows = text => {
  const found = [...text.matchAll(/(?:del|desde el)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(?:al|hasta el)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi)];
  return found.map(match => ({
    from: `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`,
    to: `${match[6]}-${match[5].padStart(2, "0")}-${match[4].padStart(2, "0")}`
  }));
};
const signature = item => normalize(`${item.product} ${item.brand ?? ""}`).split(" ").filter(word => word.length >= 4 && !["para","con","del","los","las","producto","unidad"].includes(word)).slice(0, 4);
const recent = observedAt => Number.isFinite(new Date(observedAt).getTime()) && Date.now() - new Date(observedAt).getTime() <= maxAgeHours * 3600000;

async function renderedHtml(url) {
  const browsers = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
  let lastError;
  for (const browser of browsers) {
    try {
      const { stdout } = await execFileAsync(browser, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--virtual-time-budget=18000",
        "--dump-dom",
        url
      ], { timeout: 45000, maxBuffer: 30 * 1024 * 1024 });
      if (stdout?.trim()) return stdout;
    } catch (error) {
      lastError = error;
      if (error?.code !== "ENOENT") break;
    }
  }
  throw lastError ?? new Error("No hay un navegador Chromium disponible");
}

async function sourceHtml(source) {
  if (source.render) return { body: await renderedHtml(source.url), rendered: true };
  const response = await fetch(source.url, {
    headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Despensa-Inteligente-Promotion-Verifier/1.0" },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: await response.text(), rendered: false };
}

const input = JSON.parse(await readFile(inputFile, "utf8"));
const accepted = [];
const report = [];

for (const source of sources) {
  const candidates = (input.promotions ?? []).filter(item => source.chain.test(item.chain ?? "") && recent(item.observedAt));
  try {
    const { body, rendered } = await sourceHtml(source);
    const text = htmlText(body);
    const windows = dateWindows(body);
    const today = new Date().toISOString().slice(0, 10);
    const activeWindows = windows.filter(window => window.from <= today && window.to >= today);
    const mentionsSanJuan = /san\s+juan/i.test(body);
    const nationwide = /todo\s+el\s+pa[ií]s|todo\s+el\s+territorio/i.test(body);
    const matched = candidates.filter(item => {
      const ean = String(item.ean ?? "").replace(/\D/g, "");
      if (ean.length >= 8 && body.includes(ean)) return true;
      const words = signature(item);
      return words.length >= 2 && words.filter(word => text.includes(word)).length >= Math.min(3, words.length);
    });
    for (const item of matched) accepted.push({ ...item, retailerSource: source.url, corroboratedAt: new Date().toISOString() });
    report.push({
      retailer: source.name,
      url: source.url,
      checkedAt: new Date().toISOString(),
      reachable: true,
      rendered,
      sepaPromotions: candidates.length,
      corroboratedPromotions: matched.length,
      activeWindows,
      mentionsSanJuan,
      nationwide,
      status: matched.length ? "corroborated" : "reachable_without_product_match"
    });
  } catch (error) {
    report.push({
      retailer: source.name,
      url: source.url,
      checkedAt: new Date().toISOString(),
      reachable: false,
      sepaPromotions: candidates.length,
      corroboratedPromotions: 0,
      status: "unavailable",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

await mkdir(dirname(reportFile), { recursive: true });
await writeFile(reportFile, JSON.stringify({ generatedAt: new Date().toISOString(), scope: "San Juan", sources: report }, null, 2) + "\n");
await writeFile(verifiedFile, JSON.stringify({
  generatedAt: new Date().toISOString(),
  scope: "San Juan",
  rule: "Coincidencia entre SEPA reciente y página oficial de la cadena",
  promotions: accepted
}, null, 2) + "\n");
console.log(JSON.stringify({ checkedSources: report.length, reachableSources: report.filter(item => item.reachable).length, verifiedPromotions: accepted.length, reportFile, verifiedFile }));
