const endpoint = process.env.ACCESS_EVENTS_URL;
const token = process.env.PRICE_INGEST_TOKEN;

for (const [name, value] of Object.entries({
  ACCESS_EVENTS_URL: endpoint,
  PRICE_INGEST_TOKEN: token,
})) {
  if (!value) throw new Error(`Falta ${name}`);
}

const response = await fetch(endpoint, {
  method: "PUT",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  },
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) {
  throw new Error(
    `No se pudieron enviar los avisos pendientes: ${response.status} ${(await response.text()).slice(0, 300)}`,
  );
}

const result = await response.json();
console.log(JSON.stringify({ pending: result.found ?? 0, notified: result.sent ?? 0 }));
