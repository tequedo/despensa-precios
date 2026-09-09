const endpoint = process.env.ACCESS_EVENTS_URL;
const token = process.env.PRICE_INGEST_TOKEN;
const resendApiKey = process.env.RESEND_API_KEY;
const notifyEmail = process.env.NOTIFY_EMAIL;
const notifyFrom = process.env.NOTIFY_FROM || "Despensa Inteligente <onboarding@resend.dev>";

for (const [name, value] of Object.entries({
  ACCESS_EVENTS_URL: endpoint,
  PRICE_INGEST_TOKEN: token,
  RESEND_API_KEY: resendApiKey,
  NOTIFY_EMAIL: notifyEmail,
})) {
  if (!value) throw new Error(`Falta ${name}`);
}

const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};

const pendingResponse = await fetch(endpoint, {
  headers,
  signal: AbortSignal.timeout(20000),
});
if (!pendingResponse.ok) {
  throw new Error(
    `No se pudieron consultar los ingresos: ${pendingResponse.status} ${(await pendingResponse.text()).slice(0, 300)}`,
  );
}

const { events = [] } = await pendingResponse.json();
const sent = [];

for (const event of events) {
  const occurredAt = new Date(event.occurredAt).toLocaleString("es-AR", {
    timeZone: "America/Argentina/San_Juan",
    dateStyle: "full",
    timeStyle: "long",
  });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
      "idempotency-key": `despensa-access-${event.id}`,
    },
    body: JSON.stringify({
      from: notifyFrom,
      to: [notifyEmail],
      subject: `Ingreso a Despensa Inteligente: ${event.userName || event.userEmail}`,
      text: [
        "Alguien ingresó correctamente a Despensa Inteligente.",
        `Nombre: ${event.userName || "No informado"}`,
        `Cuenta: ${event.userEmail}`,
        `Fecha y hora: ${occurredAt}`,
        `País aproximado: ${event.country || "No informado"}`,
        `Dispositivo/navegador: ${event.userAgent || "No informado"}`,
        "",
        "La despensa, las compras, el stock y los gastos de esta persona están separados de los demás usuarios.",
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(
      `Resend ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
  sent.push(event.id);
  if (events.length > 1) await new Promise((resolve) => setTimeout(resolve, 600));
}

if (sent.length) {
  const acknowledgeResponse = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids: sent }),
    signal: AbortSignal.timeout(20000),
  });
  if (!acknowledgeResponse.ok) {
    throw new Error(
      `No se pudieron confirmar los avisos: ${acknowledgeResponse.status} ${(await acknowledgeResponse.text()).slice(0, 300)}`,
    );
  }
}

console.log(JSON.stringify({ pending: events.length, notified: sent.length }));
