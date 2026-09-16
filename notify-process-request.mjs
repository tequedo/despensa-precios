import { setTimeout as sleep } from "node:timers/promises";
import { notificationReceipt } from "./notification-receipt.mjs";

export async function requestProcessNotification({ endpoint, token, kind, status, runId, runUrl, details }, { fetchImpl = fetch, delay = sleep } = {}) {
  if (!endpoint || !token || !runId) throw new Error("Falta la configuración del aviso");
  if (!["sepa", "promotions", "benefits"].includes(kind) || !["success", "failed"].includes(status)) throw new Error("Tipo de aviso inválido");
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ kind, status, runId, runUrl, details }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      if (attempt === 2) throw error;
      await delay(1_000 * (attempt + 1));
      continue;
    }
    if (response.ok) return notificationReceipt(response, kind, status);
    if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
      throw new Error(`La aplicación rechazó el aviso ${kind}: HTTP ${response.status}`);
    }
    await delay(1_000 * (attempt + 1));
  }
}
