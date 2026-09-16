import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { requestProcessNotification } from "./notify-process-request.mjs";

const endpoint = process.env.NOTIFICATION_ENDPOINT;
const token = process.env.PRICE_INGEST_TOKEN;
const kinds = (process.env.NOTIFICATION_KINDS || "sepa,promotions,benefits").split(",");
if (!endpoint || !token || !process.env.NOTIFICATION_RUN_ID) throw new Error("Falta la configuración de avisos");
if (kinds.some(kind => !["sepa", "promotions", "benefits"].includes(kind))) throw new Error("Categoría de aviso inválida");
const readJson = async path => JSON.parse(await readFile(path, "utf8"));
async function countLines(path) {
  let count = 0;
  for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity })) if (line.trim()) count++;
  return count;
}
const processes = [], errors = [], counts = {};
for (const kind of kinds) {
  try {
    let details;
    if (kind === "sepa") {
      counts.priceCount = await countLines(process.env.OUTPUT_FILE || "data/san-juan.ndjson");
      const coverage = await readJson("data/national/coverage.json");
      if (!coverage.geographyVerified) throw new Error("La cobertura nacional no tiene geografía validada");
      details = ["La actualización de precios y su comprobación en la app terminaron correctamente.",
        `Jurisdicciones con datos: ${coverage.provinces.filter(p => p.stores > 0).length}`,
        `Sucursales con provincia validada: ${coverage.provinces.reduce((n,p) => n + p.stores, 0)}`,
        `Registros de precios: ${coverage.provinces.reduce((n,p) => n + p.records, 0)}`];
    } else if (kind === "promotions") {
      const verified = await readJson(process.env.RETAILER_VERIFIED_FILE || "data/retailer-promotions-verified.json");
      const report = await readJson(process.env.RETAILER_REPORT_FILE || "data/retailer-promotion-sources.json");
      counts.promotionCount = verified.promotions?.length ?? 0;
      counts.promotionsChanged = process.env.PROMOTIONS_CHANGED === "true";
      details = [`Promociones verificadas: ${counts.promotionCount}`,
        `Fuentes accesibles: ${report.sources?.filter(s => s.reachable).length ?? 0} de ${report.sources?.length ?? 0}`,
        `Cambios en promociones: ${counts.promotionsChanged ? "sí" : "no"}`];
    } else {
      const verified = await readJson(process.env.WALLET_VERIFIED_FILE || "data/wallet-benefits-verified.json");
      const report = await readJson(process.env.WALLET_REPORT_FILE || "data/wallet-benefit-sources.json");
      counts.walletBenefitCount = verified.benefits?.length ?? 0;
      counts.calculableWalletBenefitCount = verified.benefits?.filter(b => b.calculationEligible).length ?? 0;
      counts.walletBenefitsChanged = process.env.WALLET_BENEFITS_CHANGED === "true";
      details = [`Beneficios verificados: ${counts.walletBenefitCount} · calculables: ${counts.calculableWalletBenefitCount}`,
        `Fuentes accesibles: ${report.sources?.filter(s => s.reachable).length ?? 0} de ${report.sources?.length ?? 0}`];
    }
    const receipt = await requestProcessNotification({ endpoint, token, kind, status: "success",
      runId: process.env.NOTIFICATION_RUN_ID, runUrl: process.env.NOTIFICATION_RUN_URL, details });
    processes.push({ kind, ...receipt });
  } catch (error) { errors.push({ kind, error: error instanceof Error ? error.message : String(error) }); }
}
const result = { checkedAt: new Date().toISOString(), success: errors.length === 0,
  ...(processes.find(p => p.kind === "sepa") || processes[0] || {}), ...counts, processes, errors };
await writeFile(process.env.NOTIFICATION_REPORT_FILE || "data/notification-status.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
if (errors.length) process.exitCode = 1;
