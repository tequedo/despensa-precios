import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const resendApiKey = process.env.RESEND_API_KEY;
const notifyEmail = process.env.NOTIFY_EMAIL;
const notifyFrom = process.env.NOTIFY_FROM || "Despensa Inteligente <onboarding@resend.dev>";
const pricesFile = process.env.OUTPUT_FILE || "data/san-juan.ndjson";
const promotionsFile = process.env.RETAILER_VERIFIED_FILE || "data/retailer-promotions-verified.json";
const promotionsChanged = process.env.PROMOTIONS_CHANGED === "true";
const reportFile = process.env.RETAILER_REPORT_FILE || "data/retailer-promotion-sources.json";
const notificationRunId = process.env.NOTIFICATION_RUN_ID || new Date().toISOString();
const runDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/San_Juan" });
const runTime = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/San_Juan" });

if (!resendApiKey) throw new Error("Falta el secreto RESEND_API_KEY");
if (!notifyEmail) throw new Error("Falta NOTIFY_EMAIL");

async function countLines(path) {
  let count = 0;
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of input) if (line.trim()) count++;
  return count;
}

async function send({ subject, text, key }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
      "idempotency-key": key
    },
    body: JSON.stringify({ from: notifyFrom, to: [notifyEmail], subject, text })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
}

const priceCount = await countLines(pricesFile);
const verified = JSON.parse(await readFile(promotionsFile, "utf8"));
const promotionCount = verified.promotions?.length ?? 0;
const report = JSON.parse(await readFile(reportFile, "utf8"));
const checkedSources = report.sources?.length ?? 0;
const reachableSources = report.sources?.filter(source => source.reachable).length ?? 0;

try {
  await send({
  subject: "SEPA cargado completamente en Despensa Inteligente",
  key: `sepa-final-${notificationRunId}`,
  text: [
    "La actualización completa terminó correctamente.",
    "Los archivos se descargaron, descomprimieron, analizaron y depuraron.",
    "Los precios de San Juan ya quedaron cargados en la aplicación.",
    `Registros cargados: ${priceCount}`,
    `Promociones verificadas vigentes: ${promotionCount}`,
    `Fecha y hora: ${runTime}`
  ].join("\n")
});

await send({
    subject: "Promociones verificadas actualizadas en Despensa Inteligente",
    key: `promociones-final-${notificationRunId}`,
    text: [
      "Las promociones verificadas fueron actualizadas correctamente.",
      `Páginas oficiales revisadas: ${checkedSources}`,
      `Páginas accesibles: ${reachableSources}`,
      `Promociones corroboradas y vigentes: ${promotionCount}`,
      `Hubo cambios respecto de la revisión anterior: ${promotionsChanged ? "sí" : "no"}`,
      "Solo se incluyeron coincidencias entre SEPA y las páginas oficiales de las cadenas.",
      `Fecha y hora: ${runTime}`
    ].join("\n")
  });

  await writeFile("data/notification-status.json", JSON.stringify({ checkedAt: new Date().toISOString(), success: true, priceCount, promotionCount, promotionsChanged }, null, 2) + "\n");
  console.log(JSON.stringify({ notified: true, priceCount, promotionCount, promotionsChanged }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await writeFile("data/notification-status.json", JSON.stringify({ checkedAt: new Date().toISOString(), success: false, error: message }, null, 2) + "\n");
  console.error(message);
  process.exitCode = 1;
}
