import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const resendApiKey = process.env.RESEND_API_KEY;
const notifyEmail = process.env.NOTIFY_EMAIL;
const notifyFrom = process.env.NOTIFY_FROM || "Despensa Inteligente <onboarding@resend.dev>";
const pricesFile = process.env.OUTPUT_FILE || "data/san-juan.ndjson";
const promotionsFile = process.env.RETAILER_VERIFIED_FILE || "data/retailer-promotions-verified.json";
const promotionsChanged = process.env.PROMOTIONS_CHANGED === "true";
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

await send({
  subject: "SEPA cargado completamente en Despensa Inteligente",
  key: `sepa-final-${runDate}`,
  text: [
    "La actualización completa terminó correctamente.",
    "Los archivos se descargaron, descomprimieron, analizaron y depuraron.",
    "Los precios de San Juan ya quedaron cargados en la aplicación.",
    `Registros cargados: ${priceCount}`,
    `Promociones verificadas vigentes: ${promotionCount}`,
    `Fecha y hora: ${runTime}`
  ].join("\n")
});

if (promotionsChanged) {
  await send({
    subject: "Promociones verificadas actualizadas en Despensa Inteligente",
    key: `promociones-final-${runDate}`,
    text: [
      "Las promociones verificadas fueron actualizadas correctamente.",
      `Promociones vigentes cargadas: ${promotionCount}`,
      "Solo se incluyeron coincidencias entre SEPA y las páginas oficiales de las cadenas.",
      `Fecha y hora: ${runTime}`
    ].join("\n")
  });
}

console.log(JSON.stringify({ notified: true, priceCount, promotionCount, promotionsChanged }));
