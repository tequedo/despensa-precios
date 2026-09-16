import { appendFile } from "node:fs/promises";
const endpoint = process.env.ACCESS_EVENTS_URL;
const token = process.env.PRICE_INGEST_TOKEN;
if (!endpoint || !token) throw new Error("Falta la configuración de notificaciones");
const response = await fetch(endpoint, {
  method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  signal: AbortSignal.timeout(150_000),
});
const result = await response.json();
if (!result.immediate || !result.digests || typeof result.ok !== "boolean") {
  throw new Error(`Respuesta de notificaciones inválida: HTTP ${response.status}`);
}
console.log(JSON.stringify({ pending: result.found, notified: result.sent, ...result }));
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.entries({ ...result.immediate, digests: result.digests }).map(([kind, value]) =>
    `| ${kind} | ${value.found ?? 0} | ${value.sent ?? 0} | ${value.failed ?? 0} |`);
  const dates = (result.digests.results || []).map(day =>
    `- ${day.date}: ${day.sent ? "resumen enviado" : day.waitingUntil ? `espera hasta ${day.waitingUntil} de Argentina` : day.skipped ? "ya procesado" : "sin actividad"}`);
  if (result.digests.checkedThrough) dates.unshift(`- Resúmenes revisados hasta: ${result.digests.checkedThrough}`);
  await appendFile(process.env.GITHUB_STEP_SUMMARY, [
    "### Alertas y resumen diario", "", "| Categoría | Revisados | Aceptados por correo | Fallos |",
    "| --- | ---: | ---: | ---: |", ...rows, "", ...dates,
    "", "La aceptación del proveedor no confirma la entrega en la bandeja.", "",
  ].join("\n"));
}
if (!response.ok || !result.ok) throw new Error(`Quedaron avisos pendientes de reintento: HTTP ${response.status}`);
