import { requestProcessNotification } from "./notify-process-request.mjs";
const kind = process.env.NOTIFICATION_KIND || "sepa";
const labels = { sepa: "La actualización de precios de Argentina", promotions: "La revisión de promociones", benefits: "La revisión de beneficios de billeteras" };
const receipt = await requestProcessNotification({
  endpoint: process.env.NOTIFICATION_ENDPOINT, token: process.env.PRICE_INGEST_TOKEN,
  kind, status: "failed", runId: process.env.NOTIFICATION_RUN_ID, runUrl: process.env.NOTIFICATION_RUN_URL,
  details: [`${labels[kind] || "El proceso"} no terminó correctamente, incluidos sus pasos finales.`, "Revisar la ejecución; conservar los últimos datos completos y su fecha real."],
});
console.log(JSON.stringify({ kind, status: "failed", ...receipt }));
