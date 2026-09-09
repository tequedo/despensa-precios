import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const reportFile = process.env.WALLET_REPORT_FILE ?? "data/wallet-benefit-sources.json";
const candidatesFile = process.env.WALLET_CANDIDATES_FILE ?? "data/wallet-benefit-candidates.json";
const verifiedFile = process.env.WALLET_VERIFIED_FILE ?? "data/wallet-benefits-verified.json";
const selectedSourceIds = new Set(
  String(process.env.WALLET_SOURCE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const sources = [
  {
    id: "mercado_pago_public",
    name: "Mercado Pago — promociones públicas",
    url: "https://promociones.mercadopago.com.ar/tipocat/supermercado/",
    render: true,
    role: "discovery",
  },
  {
    id: "changomas",
    name: "ChangoMás / Más Online",
    chain: "ChangoMás",
    url: "https://www.masonline.com.ar/promociones-bancarias?banco=Mercado%20Pago",
    structured: "vtex_master_data",
    role: "retailer_terms",
  },
  {
    id: "la_anonima",
    name: "La Anónima",
    chain: "La Anónima",
    url: "https://www.laanonima.com.ar/",
    render: true,
    role: "retailer_terms",
  },
  {
    id: "vea",
    name: "Vea",
    chain: "Vea",
    url: "https://www.vea.com.ar/descuentos-del-dia?type=por-banco",
    render: true,
    role: "retailer_terms",
  },
  {
    id: "dia",
    name: "DIA",
    chain: "DIA",
    url: "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones",
    render: true,
    role: "retailer_terms",
  },
  {
    id: "carrefour",
    name: "Carrefour",
    chain: "Carrefour",
    url: "https://www.carrefour.com.ar/descuentos-bancarios",
    structured: "carrefour_vtex",
    role: "retailer_terms",
  },
];

const MONTHS = new Map([
  ["ENERO", 0],
  ["FEBRERO", 1],
  ["MARZO", 2],
  ["ABRIL", 3],
  ["MAYO", 4],
  ["JUNIO", 5],
  ["JULIO", 6],
  ["AGOSTO", 7],
  ["SEPTIEMBRE", 8],
  ["SETIEMBRE", 8],
  ["OCTUBRE", 9],
  ["NOVIEMBRE", 10],
  ["DICIEMBRE", 11],
]);

const DAY_NAMES = [
  ["LUNES", 1],
  ["MARTES", 2],
  ["MIERCOLES", 3],
  ["JUEVES", 4],
  ["VIERNES", 5],
  ["SABADO", 6],
  ["DOMINGO", 0],
];

const EXCLUSION_LABELS = [
  ["CARNICERIA", "Carnicería"],
  ["GRANJA", "Granja"],
  ["ELABORADOS", "Elaborados"],
  ["EMBUTIDOS", "Embutidos"],
  ["QUESOS", "Quesos"],
  ["FRUTAS Y VERDURAS", "Frutas y verduras"],
  ["HUEVOS", "Huevos"],
  ["ACEITES COMESTIBLES", "Aceites comestibles"],
  ["HARINAS", "Harinas"],
  ["LECHES FLUIDAS", "Leches fluidas"],
  ["AZUCARES", "Azúcares"],
  ["BEBIDAS BLANCAS", "Bebidas blancas"],
  ["VINOS", "Vinos"],
  ["FERNET", "Fernet"],
  ["CERVEZAS", "Cervezas y marcas detalladas en los legales"],
  ["GASEOSAS", "Gaseosas y marcas detalladas en los legales"],
  ["ELECTRODOMESTICOS", "Electrodomésticos y electrónicos"],
  ["RODADOS", "Rodados"],
  ["INFORMATICA", "Informática"],
  ["CELULARES", "Celulares"],
  ["CLIMATIZACION", "Climatización"],
  ["LINEA BLANCA", "Línea blanca"],
  ["MEDICAMENTOS", "Medicamentos de farmacia"],
  ["AUTOCENTER", "Servicios de Autocenter"],
  ["BATERIAS", "Baterías"],
  ["NEUMATICOS", "Neumáticos"],
  ["PRODUCTOS EN LIQUIDACION", "Productos en liquidación"],
  ["ELECTROS", "Electrodomésticos y electrónicos"],
  ["BAZAR", "Bazar"],
  ["FERRETERIA", "Ferretería"],
  ["AUTOMOTOR", "Automotor"],
  ["JUGUETERIA", "Juguetería y librería"],
  ["COCINA", "Cocina"],
  ["JARDINERIA", "Jardinería"],
  ["TEXTIL", "Textil"],
  ["OFERTON POR BULTO", "Ofertón por bulto"],
  ["PACK FAMILIAR", "Pack familiar"],
  ["PRECIO SUPER BAJO", "Precio Súper Bajo"],
  ["BAJAMOS LOS PRECIOS", "Campaña Bajamos los Precios"],
  ["LECHES INFANTILES", "Leches infantiles y maternizadas"],
];

const CHANGOMAS_PROMOTION_FIELDS = [
  "express_ecommerce_all",
  "id",
  "title",
  "sub_title",
  "discount_percentage",
  "discounts_amount_installments",
  "discounts_text_installments",
  "discount_text_info",
  "order",
  "active_from",
  "active_to",
  "active",
  "validText",
  "hyper",
  "market",
  "ecommerce",
  "express",
  "maxi",
  "legal",
  "valid",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "idBank",
  "idCard",
  "isMasClub",
];

const hash = (value) => createHash("sha256").update(value).digest("hex");
const stripAccents = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const compact = (value) => stripAccents(value).replace(/\s+/g, " ").trim();
const parsingText = (value) => compact(value).toUpperCase();

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

export const htmlToText = (html) =>
  decodeEntities(
    String(html ?? "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const isoDate = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function monthWindow(text) {
  const match = text.match(
    /(?:EL|LOS DIAS?)\s+(LUNES|MARTES|MIERCOLES|JUEVES|VIERNES|SABADO|DOMINGO)S?\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+(20\d{2})/,
  );
  if (!match) return null;
  const month = MONTHS.get(match[2]);
  const year = Number(match[3]);
  if (month === undefined || !Number.isInteger(year)) return null;
  return {
    dayName: match[1].toLowerCase(),
    dayOfWeek: DAY_NAMES.find(([name]) => name === match[1])?.[1] ?? null,
    from: isoDate(year, month, 1),
    to: isoDate(year, month, new Date(Date.UTC(year, month + 1, 0)).getUTCDate()),
  };
}

function numericDate(value) {
  const match = String(value ?? "").match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

const moneyValue = (value) => {
  const normalized = String(value ?? "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

function textSection(text, startPattern, endPatterns, maxLength = 16000) {
  const start = text.search(startPattern);
  if (start < 0) return "";
  const remainder = text.slice(start, start + maxLength);
  const end = endPatterns
    .map((pattern) => remainder.search(pattern))
    .filter((index) => index > 0)
    .sort((a, b) => a - b)[0];
  return remainder.slice(0, end ?? remainder.length).trim();
}

function exclusionsFrom(section) {
  const start = section.indexOf("EXCLUIDOS-NO INCLUYE:");
  if (start < 0) return { complete: false, labels: [] };
  const tail = section.slice(start + "EXCLUIDOS-NO INCLUYE:".length);
  const end = tail.indexOf("NO ACUMULABLE");
  const exclusionText = tail.slice(0, end >= 0 ? end : tail.length);
  return {
    complete: end >= 0,
    labels: EXCLUSION_LABELS.filter(([needle]) => exclusionText.includes(needle)).map(
      ([, label]) => label,
    ),
  };
}

function activeOn(date, from, to) {
  const day = new Date(date).toISOString().slice(0, 10);
  return Boolean(from && to && from <= day && day <= to);
}

export function parseChangoBenefits(
  visibleText,
  {
    sourceUrl = "https://www.masonline.com.ar/promociones-bancarias?banco=Mercado%20Pago",
    checkedAt = new Date().toISOString(),
    asOf = checkedAt,
  } = {},
) {
  const text = parsingText(visibleText);
  const candidates = [];
  const discountTerms = textSection(
    text,
    /PARA PAGOS REALIZADOS (?:EL|LOS DIAS?)/,
    [/CUOTAS SIN INTERES CON QR DE MERCADO PAGO:/, /SERVICIO EXTRA CASH/],
  );

  if (discountTerms.includes("MERCADO PAGO")) {
    const window = monthWindow(discountTerms);
    const discountMatch = discountTerms.match(
      /BENEFICIO CONSISTE EN UN\s+(\d{1,2}(?:[.,]\d+)?)%\s+DE DESCUENTO/,
    );
    const noCap = /SIN TOPE/.test(discountTerms);
    const paymentVerified =
      /ESCANEO DEL CODIGO QR/.test(discountTerms) && /APP DE MERCADO PAGO/.test(discountTerms);
    const scopeVerified =
      /TODAS LAS SUCURSALES DE HIPERCHANGOMAS, CHANGOMAS, MASGO/.test(discountTerms) &&
      /MASONLINE/.test(discountTerms);
    const exclusions = exclusionsFrom(discountTerms);
    const percent = discountMatch ? Number(discountMatch[1].replace(",", ".")) : null;
    const complete = Boolean(
      window && percent && noCap && paymentVerified && scopeVerified && exclusions.complete,
    );
    const active = window ? activeOn(asOf, window.from, window.to) : false;
    const reasons = [];
    if (!window) reasons.push("No se pudo verificar la vigencia completa.");
    if (!percent) reasons.push("No se pudo verificar el porcentaje.");
    if (!noCap) reasons.push("No se pudo verificar el tope de reintegro.");
    if (!paymentVerified) reasons.push("No se pudo verificar el medio de pago.");
    if (!scopeVerified) reasons.push("No se pudo verificar el alcance de sucursales y canal.");
    if (!exclusions.complete) reasons.push("No se pudo recuperar la lista completa de exclusiones.");
    if (complete && !active) reasons.push("La vigencia verificada no incluye la fecha de revisión.");

    candidates.push({
      id: `mercado-pago-changomas-${window?.from ?? "sin-vigencia"}`,
      provider: "Mercado Pago",
      chain: "ChangoMás",
      kind: "discount",
      title: percent && window ? `${percent}% con Mercado Pago los ${window.dayName}` : "Beneficio Mercado Pago",
      discountPercent: percent,
      daysOfWeek: window?.dayOfWeek === null || window?.dayOfWeek === undefined ? [] : [window.dayOfWeek],
      dayLabels: window ? [window.dayName] : [],
      validFrom: window?.from ?? null,
      validTo: window?.to ?? null,
      minimumPurchase: null,
      capAmount: noCap ? null : undefined,
      capRule: noCap ? "Sin tope" : "No verificado",
      paymentRequirement: paymentVerified ? "Pago con QR desde la app de Mercado Pago" : null,
      channels: scopeVerified ? ["Sucursales", "Más Online con pago online"] : [],
      geographicScope: scopeVerified ? "Todas las sucursales de HiperChangoMás, ChangoMás y MasGo" : null,
      exclusions: exclusions.labels,
      exclusionsVerified: exclusions.complete,
      accumulable: false,
      sourceUrl,
      checkedAt,
      termsHash: discountTerms ? hash(discountTerms) : null,
      status: complete && active ? "verified" : complete ? "expired" : "incomplete",
      calculationEligible: false,
      calculationBlockedReason: exclusions.labels.length
        ? "Tiene exclusiones por categoría y marca; todavía no se puede validar cada renglón de la canasta de forma exacta."
        : "El beneficio no reúne todas las condiciones necesarias para modificar el total.",
      reasons,
    });
  }

  const installmentTerms = textSection(
    text,
    /CUOTAS SIN INTERES CON QR DE MERCADO PAGO:/,
    [/SERVICIO EXTRA CASH/, /CUOTAS SIN INTERES LAS SIGUIENTES/],
    6000,
  );
  if (installmentTerms) {
    const range = installmentTerms.match(
      /VALIDO DEL\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+AL\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
    );
    const from = numericDate(range?.[1]);
    const to = numericDate(range?.[2]);
    const conflict = Boolean(from && to && to < from);
    candidates.push({
      id: `mercado-pago-changomas-cuotas-${from ?? "sin-vigencia"}`,
      provider: "Mercado Pago",
      chain: "ChangoMás",
      kind: "installments",
      title: "Cuotas con QR de Mercado Pago",
      validFrom: from,
      validTo: to,
      sourceUrl,
      checkedAt,
      termsHash: hash(installmentTerms),
      status: conflict ? "conflict" : "incomplete",
      calculationEligible: false,
      calculationBlockedReason: conflict
        ? `Los legales indican inicio ${from} y fin ${to}; la fecha final es anterior a la inicial.`
        : "Las cuotas no modifican el precio de contado y requieren verificación adicional.",
      reasons: conflict
        ? ["La fecha de fin publicada es anterior a la fecha de inicio."]
        : ["La promoción de cuotas no está habilitada para calcular descuentos."],
    });
  }
  return candidates;
}

function carrefourDays(text) {
  if (/TODOS LOS DIAS/.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  return DAY_NAMES.filter(([name]) => new RegExp(`\\b${name}S?\\b`).test(text)).map(([, day]) => day);
}

function carrefourValidity(text) {
  const rangeMatch = text.match(
    /VALID[OA](?:\s+DESDE)?(?:\s+EL)?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(?:AL|HASTA(?:\s+EL)?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  );
  if (rangeMatch) {
    return { from: numericDate(rangeMatch[1]), to: numericDate(rangeMatch[2]) };
  }
  const toMatch = text.match(/HASTA (?:EL )?(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const to = numericDate(toMatch?.[1]);
  if (!to) return { from: null, to: null };
  return { from: `${to.slice(0, 7)}-01`, to };
}

function carrefourExclusions(text) {
  const complete = /NO INCLUYE|QUEDAN EXCLUIDOS|LA PROMOCION NO INCLUYE/.test(text);
  const labels = [...new Set(EXCLUSION_LABELS.filter(([needle]) => text.includes(needle)).map(([, label]) => label))];
  return { complete, labels };
}

export function parseCarrefourBenefits(
  visibleText,
  {
    sourceUrl = "https://www.carrefour.com.ar/descuentos-bancarios",
    checkedAt = new Date().toISOString(),
    asOf = checkedAt,
    recordId = null,
  } = {},
) {
  const text = parsingText(visibleText);
  if (!/MERCADO ?PAGO/.test(text)) return [];

  const installments = /CUOTAS? SIN INTERES/.test(text) && !/% (?:DE )?(?:DESCUENTO|AHORRO)/.test(text);
  const percentMatch = text.match(/(?:CONSISTE EN\s*UN\s*|\b)(\d{1,2}(?:[.,]\d+)?)%\s+(?:DE\s+)?(?:DESCUENTO|AHORRO)/);
  const percent = percentMatch ? Number(percentMatch[1].replace(",", ".")) : null;
  const validity = carrefourValidity(text);
  const daysOfWeek = carrefourDays(text);
  const dayLabels = DAY_NAMES.filter(([, day]) => daysOfWeek.includes(day)).map(([name]) => name.toLowerCase());
  const noCap = /SIN TOPE(?: DE REINTEGRO)?/.test(text);
  const capMatch = text.match(/TOPE(?: MENSUAL)?(?: POR CLIENTE)?(?: DE)?\s*\$\s*([\d.]+(?:,\d+)?)/);
  const capAmount = noCap ? null : moneyValue(capMatch?.[1]);
  const minimumMatch = text.match(/(?:MINIMO DE COMPRA|COMPRAS A PARTIR DE(?: LOS)?)\s*\$\s*([\d.]+(?:,\d+)?)/);
  const minimumPurchase = moneyValue(minimumMatch?.[1]);
  const moneyInAccount = /MEDIO DE PAGO DINERO EN CUENTA|EXCLUSIVO CON DINERO EN CUENTA/.test(text);
  const creditCard = /TARJETA DE CREDITO \(FISICA Y QR\)|TARJETA DE CREDITO DE MERCADO PAGO/.test(text);
  const installmentCredit = /CUOTAS SIN TARJETA/.test(text);
  const paymentRequirement = moneyInAccount
    ? "Dinero en cuenta, pagando con QR desde la app de Mercado Pago"
    : creditCard
      ? "Tarjeta de crédito de Mercado Pago, física o mediante QR"
      : installmentCredit
        ? "Cuotas sin tarjeta de Mercado Pago, pagando con QR"
        : null;
  const maxiOnly = /TODAS LAS SUCURSALES DE CARREFOUR ?MAXI/.test(text);
  const allFormats = /HIPERMERCADOS CARREFOUR,? CARREFOUR MARKET,? CARREFOUR EXPRESS Y CARREFOUR MAXI/.test(text);
  const standardFormats = /HIPERMERCADOS CARREFOUR,?\s*CARREFOUR MARKET Y CARREFOUR EXPRESS/.test(text);
  const scopeVerified = maxiOnly || allFormats || standardFormats;
  const geographicScope = maxiOnly
    ? "Todas las sucursales físicas de Carrefour Maxi del país"
    : allFormats
      ? "Sucursales físicas de Hipermercados Carrefour, Market, Express y Maxi del país"
      : standardFormats
        ? "Sucursales físicas de Hipermercados Carrefour, Market y Express del país"
        : null;
  const channels = /NO VALIDO PARA (?:WWW\.)?CARREFOUR\.COM\.AR/.test(text)
    ? ["Sucursales físicas"]
    : /CARREFOUR\.COM\.AR/.test(text)
      ? ["Sucursales físicas", "Carrefour online"]
      : [];
  const exclusions = carrefourExclusions(text);
  const appRequired = /ESCANEO DEL CODIGO QR CON LA APP DE MERCADO PAGO/.test(text);
  const appForbidden = /NO VALIDA?[\s\S]{0,1000}CON LA APLICACION DE MERCADO PAGO/.test(text);
  const presentMonthNumbers = [...MONTHS.entries()]
    .filter(([month]) => text.includes(month))
    .map(([, monthNumber]) => monthNumber);
  for (const date of [validity.from, validity.to]) {
    if (date) presentMonthNumbers.push(Number(date.slice(5, 7)) - 1);
  }
  const monthConflict = new Set(presentMonthNumbers).size > 1;
  const paymentConflict = appRequired && appForbidden;
  const reasons = [];
  if (!validity.from || !validity.to) reasons.push("No se pudo verificar la vigencia completa.");
  if (!daysOfWeek.length) reasons.push("No se pudieron verificar los días del beneficio.");
  if (!installments && !percent) reasons.push("No se pudo verificar el porcentaje.");
  if (!installments && !noCap && !capAmount) reasons.push("No se pudo verificar el tope.");
  if (!paymentRequirement) reasons.push("No se pudo verificar el medio de pago exacto.");
  if (!scopeVerified) reasons.push("No se pudo verificar el formato de sucursal alcanzado.");
  if (!installments && !exclusions.complete) reasons.push("No se pudo verificar la existencia de exclusiones.");
  if (monthConflict) reasons.push("La publicación menciona meses distintos dentro del mismo beneficio.");
  if (paymentConflict) reasons.push("El legal exige la app de Mercado Pago y luego indica que no es válida.");

  const conflict = monthConflict || paymentConflict;
  const complete = Boolean(
    validity.from &&
      validity.to &&
      daysOfWeek.length &&
      paymentRequirement &&
      scopeVerified &&
      (installments || (percent && (noCap || capAmount) && exclusions.complete)),
  );
  const active = complete ? activeOn(asOf, validity.from, validity.to) : false;
  const kind = installments ? "installments" : "discount";
  const status = conflict ? "conflict" : complete && active && !installments ? "verified" : complete && !active ? "expired" : "incomplete";

  return [{
    id: `mercado-pago-carrefour-${recordId ?? validity.from ?? "sin-vigencia"}`,
    provider: "Mercado Pago",
    chain: "Carrefour",
    kind,
    title: installments
      ? "Cuotas sin interés con Mercado Pago"
      : percent && dayLabels.length
        ? `${percent}% con Mercado Pago los ${dayLabels.join(" y ")}`
        : "Beneficio Mercado Pago en Carrefour",
    discountPercent: percent,
    daysOfWeek,
    dayLabels,
    validFrom: validity.from,
    validTo: validity.to,
    minimumPurchase,
    capAmount,
    capRule: noCap ? "Sin tope" : capAmount ? `Tope $${capAmount.toLocaleString("es-AR")}` : "No verificado",
    paymentRequirement,
    channels,
    geographicScope,
    exclusions: exclusions.labels,
    exclusionsVerified: exclusions.complete,
    accumulable: /ACUMULABLE CON TODAS/.test(text) && !/NO ACUMULABLE/.test(text),
    sourceUrl,
    checkedAt,
    termsHash: hash(text),
    status,
    calculationEligible: false,
    calculationBlockedReason: conflict
      ? "Los términos oficiales contienen una contradicción y no se puede calcular el beneficio."
      : installments
        ? "Las cuotas no modifican el precio de contado."
        : exclusions.labels.length
          ? "Tiene exclusiones por categoría; falta validar cada producto de la canasta."
          : "El beneficio no reúne todas las condiciones necesarias para modificar el total.",
    reasons,
    sourceRecordId: recordId,
  }];
}

async function renderedHtml(url) {
  const browsers = [
    process.env.CHROME_PATH,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  let foundBrowser = false;
  let emptyDocument = false;
  for (const browser of browsers) {
    try {
      const { stdout } = await execFileAsync(
        browser,
        [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--virtual-time-budget=18000",
          "--dump-dom",
          url,
        ],
        { timeout: 50000, maxBuffer: 35 * 1024 * 1024 },
      );
      foundBrowser = true;
      if (stdout?.trim()) return stdout;
      emptyDocument = true;
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw new Error(`No se pudo renderizar la página pública: ${error.message}`, {
        cause: error,
      });
    }
  }
  if (foundBrowser && emptyDocument) {
    throw new Error("La página pública se abrió, pero no devolvió contenido utilizable.");
  }
  throw new Error("No hay un navegador Chromium disponible");
}

async function vtexMasterDataSearch(acronym, fields, where = "") {
  const params = new URLSearchParams({
    _schema: "mdv1",
    _fields: fields.join(","),
    _sort: "id ASC",
  });
  if (where) params.set("_where", where);
  const response = await fetch(
    `https://www.masonline.com.ar/api/dataentities/${acronym}/search?${params}`,
    {
      headers: {
        accept: "application/json",
        "rest-range": "resources=0-999",
        "user-agent": "Despensa-Inteligente-Benefits-Verifier/1.0",
      },
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok) throw new Error(`VTEX Master Data respondió HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("VTEX Master Data no devolvió una lista");
  return payload;
}

async function changoStructuredData(source, checkedAt) {
  const [banks, promotions] = await Promise.all([
    vtexMasterDataSearch("FB", ["id", "name"], ""),
    vtexMasterDataSearch("BP", CHANGOMAS_PROMOTION_FIELDS, "active=true"),
  ]);
  const mercadoPago = banks.find((bank) => parsingText(bank.name) === "MERCADO PAGO");
  if (!mercadoPago?.id) throw new Error("No se encontró la entidad oficial Mercado Pago");
  const matching = promotions.filter(
    (promotion) => promotion.idBank === mercadoPago.id || promotion.idCard === mercadoPago.id,
  );
  const parsed = matching.flatMap((promotion) =>
    parseChangoBenefits(
      [promotion.validText, promotion.title, promotion.sub_title, promotion.legal, promotion.valid]
        .filter(Boolean)
        .join(" "),
      { sourceUrl: source.url, checkedAt },
    ).map((candidate) => ({
      ...candidate,
      sourceRecordId: promotion.id,
      sourceActiveFrom: promotion.active_from ?? null,
      sourceActiveTo: promotion.active_to ?? null,
    })),
  );
  const unique = [
    ...new Map(parsed.map((candidate) => [`${candidate.id}|${candidate.termsHash}`, candidate])).values(),
  ];
  return { banks, promotions: matching, candidates: unique, mercadoPago };
}

function carrefourRecordIds(html) {
  return [
    ...new Set(
      [...String(html ?? "").matchAll(/\/api\/dataentities\/BP\/documents\/([0-9a-f-]{36})\/img_card/gi)]
        .map((match) => match[1]),
    ),
  ];
}

export function extractCarrefourPromotionCards(html) {
  const source = String(html ?? "");
  const startPattern = /<div\b[^>]*class=(?:"[^"]*-cardBox(?:\s[^"]*)?"|'[^']*-cardBox(?:\s[^']*)?')[^>]*>/gi;
  const cards = [];
  let startMatch;
  while ((startMatch = startPattern.exec(source))) {
    const tagPattern = /<div\b[^>]*>|<\/div\s*>/gi;
    tagPattern.lastIndex = startPattern.lastIndex;
    let depth = 1;
    let end = source.length;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(source))) {
      if (/^<\/div/i.test(tagMatch[0])) depth -= 1;
      else depth += 1;
      if (depth === 0) {
        end = tagPattern.lastIndex;
        break;
      }
    }
    if (depth !== 0) break;
    const cardHtml = source.slice(startMatch.index, end);
    const text = htmlToText(cardHtml);
    const summary = text.split(/VER LEGAL/i, 1)[0];
    const normalizedText = parsingText(text);
    const positiveLegal = /(?:PAGOS REALIZADOS|PAGANDO) A TRAVES DEL SERVICIO DE PROCESAMIENTO DE PAGOS DE MERCADO PAGO/.test(normalizedText);
    const ids = carrefourRecordIds(cardHtml);
    cards.push({
      id: ids[0] ?? null,
      text,
      isMercadoPago: /MERCADO\s*PAGO/i.test(summary) || positiveLegal,
    });
    startPattern.lastIndex = end;
  }
  return cards;
}

async function carrefourStructuredData(source, checkedAt) {
  let pageHtml = "";
  let rendered = false;
  try {
    const response = await fetch(source.url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Despensa-Inteligente-Benefits-Verifier/1.0",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (response.ok) pageHtml = await response.text();
  } catch {
    // La carga renderizada de abajo es la segunda vía oficial.
  }

  let cards = extractCarrefourPromotionCards(pageHtml);
  if (!cards.length) {
    pageHtml = await renderedHtml(source.url);
    rendered = true;
    cards = extractCarrefourPromotionCards(pageHtml);
  }
  if (!cards.length) {
    throw new Error("Carrefour cargó la página, pero no expuso tarjetas de promociones verificables.");
  }

  const mercadoPagoRecords = cards.filter((card) => card.isMercadoPago);
  const parsed = mercadoPagoRecords.flatMap((record) =>
    parseCarrefourBenefits(record.text, {
      sourceUrl: source.url,
      checkedAt,
      recordId: record.id,
    }),
  );
  const unique = [
    ...new Map(parsed.map((candidate) => [`${candidate.id}|${candidate.termsHash}`, candidate])).values(),
  ];
  return {
    promotions: mercadoPagoRecords,
    candidates: unique,
    rendered,
    sourceRecords: cards.length,
    failedRecords: 0,
    accessMethod: rendered ? "rendered_official_promotion_cards" : "official_promotion_cards",
  };
}

async function sourceHtml(source) {
  if (source.render) return { body: await renderedHtml(source.url), rendered: true };
  const response = await fetch(source.url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "Despensa-Inteligente-Benefits-Verifier/1.0",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: await response.text(), rendered: false };
}

async function run() {
  const checkedAt = new Date().toISOString();
  const report = [];
  const candidates = [];
  const activeSources = selectedSourceIds.size
    ? sources.filter((source) => selectedSourceIds.has(source.id))
    : sources;

  for (const source of activeSources) {
    try {
      const structured = source.structured === "vtex_master_data"
        ? await changoStructuredData(source, checkedAt)
        : source.structured === "carrefour_vtex"
          ? await carrefourStructuredData(source, checkedAt)
          : null;
      const { body, rendered } = structured
        ? { body: JSON.stringify(structured.promotions), rendered: structured.rendered ?? false }
        : await sourceHtml(source);
      const text = structured ? body : htmlToText(body);
      const mentions = text.match(/mercado\s+pago/gi)?.length ?? 0;
      const found = structured?.candidates ?? [];
      candidates.push(...found);
      report.push({
        sourceId: source.id,
        source: source.name,
        chain: source.chain ?? null,
        role: source.role,
        url: source.url,
        checkedAt,
        reachable: true,
        rendered,
        accessMethod: structured?.accessMethod ?? (structured
            ? "public_structured_data"
            : rendered
              ? "rendered_public_page"
              : "public_page"),
        sourceRecords: structured?.sourceRecords ?? structured?.promotions.length ?? null,
        failedSourceRecords: structured?.failedRecords ?? 0,
        officialEntityId: structured?.mercadoPago.id ?? null,
        mercadoPagoMentions: mentions,
        contentHash: hash(compact(text)),
        extractedCandidates: found.length,
        verifiedBenefits: found.filter((item) => item.status === "verified").length,
        status: mentions ? "reachable_with_mercado_pago_mentions" : "reachable_without_mercado_pago_mentions",
        note:
          source.id === "mercado_pago_public"
            ? "Portal público revisado. La sección personalizada de la app requiere una sesión del usuario y no se consulta ni se elude."
            : undefined,
      });
    } catch (error) {
      report.push({
        sourceId: source.id,
        source: source.name,
        chain: source.chain ?? null,
        role: source.role,
        url: source.url,
        checkedAt,
        reachable: false,
        extractedCandidates: 0,
        verifiedBenefits: 0,
        status: "unavailable",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const verified = candidates.filter((item) => item.status === "verified");
  await Promise.all(
    [reportFile, candidatesFile, verifiedFile].map((path) => mkdir(dirname(path), { recursive: true })),
  );
  await writeFile(
    reportFile,
    `${JSON.stringify({ generatedAt: checkedAt, scope: "San Juan", sources: report }, null, 2)}\n`,
  );
  await writeFile(
    candidatesFile,
    `${JSON.stringify({
      generatedAt: checkedAt,
      scope: "San Juan",
      rule: "Toda condición incompleta o contradictoria se informa pero no se calcula",
      candidates,
    }, null, 2)}\n`,
  );
  await writeFile(
    verifiedFile,
    `${JSON.stringify({
      generatedAt: checkedAt,
      scope: "San Juan",
      rule: "Solo beneficios vigentes con porcentaje, días, vigencia, medio de pago, tope, alcance y exclusiones verificadas",
      benefits: verified,
    }, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      checkedSources: report.length,
      reachableSources: report.filter((item) => item.reachable).length,
      candidates: candidates.length,
      verifiedBenefits: verified.length,
      calculationEligible: verified.filter((item) => item.calculationEligible).length,
      reportFile,
      candidatesFile,
      verifiedFile,
    }),
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await run();
