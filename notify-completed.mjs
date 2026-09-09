import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const endpoint = process.env.NOTIFICATION_ENDPOINT;
const token = process.env.PRICE_INGEST_TOKEN;
const pricesFile = process.env.OUTPUT_FILE || "data/san-juan.ndjson";
const promotionsFile = process.env.RETAILER_VERIFIED_FILE || "data/retailer-promotions-verified.json";
const promotionsChanged = process.env.PROMOTIONS_CHANGED === "true";
const reportFile = process.env.RETAILER_REPORT_FILE || "data/retailer-promotion-sources.json";
const walletFile = process.env.WALLET_VERIFIED_FILE || "data/wallet-benefits-verified.json";
const walletReportFile = process.env.WALLET_REPORT_FILE || "data/wallet-benefit-sources.json";
const walletBenefitsChanged = process.env.WALLET_BENEFITS_CHANGED === "true";
const notificationRunId = process.env.NOTIFICATION_RUN_ID || new Date().toISOString();
const notificationRunUrl = process.env.NOTIFICATION_RUN_URL;

if (!endpoint) throw new Error("Falta NOTIFICATION_ENDPOINT");
if (!token) throw new Error("Falta PRICE_INGEST_TOKEN");

async function countLines(path) {
  let count = 0;
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of input) if (line.trim()) count++;
  return count;
}

async function notify(kind, details) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      kind,
      runId: notificationRunId,
      runUrl: notificationRunUrl,
      details,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(
      `La aplicación rechazó el aviso ${kind}: ${response.status} ${(await response.text()).slice(0, 300)}`,
    );
  }
}

const priceCount = await countLines(pricesFile);
const verified = JSON.parse(await readFile(promotionsFile, "utf8"));
const promotionCount = verified.promotions?.length ?? 0;
const report = JSON.parse(await readFile(reportFile, "utf8"));
const checkedSources = report.sources?.length ?? 0;
const reachableSources = report.sources?.filter((source) => source.reachable).length ?? 0;
const walletPayload = JSON.parse(await readFile(walletFile, "utf8"));
const walletBenefitCount = walletPayload.benefits?.length ?? 0;
const calculableWalletBenefitCount = walletPayload.benefits?.filter((benefit) => benefit.calculationEligible).length ?? 0;
const walletReport = JSON.parse(await readFile(walletReportFile, "utf8"));
const checkedWalletSources = walletReport.sources?.length ?? 0;
const reachableWalletSources = walletReport.sources?.filter((source) => source.reachable).length ?? 0;

try {
  await notify("sepa", [
    "La actualización completa terminó correctamente.",
    "Los archivos se descargaron, descomprimieron, analizaron y depuraron.",
    "Los precios de San Juan ya quedaron cargados en la aplicación.",
    `Registros cargados: ${priceCount}`,
    `Promociones verificadas vigentes: ${promotionCount}`,
  ]);

  await writeFile(
    "data/notification-status.json",
    `${JSON.stringify({ checkedAt: new Date().toISOString(), success: true, priceCount, promotionCount, promotionsChanged, walletBenefitCount, calculableWalletBenefitCount, walletBenefitsChanged }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ notified: true, priceCount, promotionCount, promotionsChanged, walletBenefitCount, calculableWalletBenefitCount, walletBenefitsChanged }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await writeFile(
    "data/notification-status.json",
    `${JSON.stringify({ checkedAt: new Date().toISOString(), success: false, error: message }, null, 2)}\n`,
  );
  console.error(message);
  process.exitCode = 1;
}
