import assert from "node:assert/strict";
import test from "node:test";

import {
  htmlToText,
  extractCarrefourPromotionCards,
  parseCarrefourBenefits,
  parseChangoBenefits,
} from "../verify-wallet-benefits.mjs";

test("conserva un descuento verificado pero bloquea el cálculo si hay exclusiones", () => {
  const text = `
    Todos los Martes 15% de descuento SIN TOPE DE REINTEGRO.
    PARA PAGOS REALIZADOS EL MARTES DE SEPTIEMBRE 2026 A TRAVÉS DEL SERVICIO DE
    PROCESAMIENTO DE PAGOS DE MERCADO PAGO. MEDIANTE EL ESCANEO DEL CÓDIGO QR CON
    LA APP DE MERCADO PAGO. EL BENEFICIO CONSISTE EN UN 15% DE DESCUENTO SIN TOPE,
    COMPRANDO EN TODAS LAS SUCURSALES DE HIPERCHANGOMAS, CHANGOMAS, MASGO DE FORMA
    PRESENCIAL Y A TRAVÉS DE MASONLINE. EXCLUIDOS-NO INCLUYE: ACEITES COMESTIBLES,
    HARINAS, LECHES FLUIDAS, AZÚCARES. NO ACUMULABLE CON OTRAS PROMOCIONES.
    CUOTAS SIN INTERÉS CON QR DE MERCADO PAGO: VÁLIDO DEL 1/9/2026 AL 30/09/2025.
    SERVICIO EXTRA CASH.
  `;
  const candidates = parseChangoBenefits(text, {
    checkedAt: "2026-09-09T12:00:00.000Z",
    asOf: "2026-09-09T12:00:00.000Z",
  });
  const discount = candidates.find((item) => item.kind === "discount");
  assert.equal(discount.status, "verified");
  assert.equal(discount.discountPercent, 15);
  assert.equal(discount.validFrom, "2026-09-01");
  assert.equal(discount.validTo, "2026-09-30");
  assert.equal(discount.capRule, "Sin tope");
  assert.equal(discount.calculationEligible, false);
  assert.deepEqual(discount.exclusions, [
    "Aceites comestibles",
    "Harinas",
    "Leches fluidas",
    "Azúcares",
  ]);
});

test("pone en conflicto una vigencia cuyo fin es anterior al inicio", () => {
  const candidates = parseChangoBenefits(
    "CUOTAS SIN INTERÉS CON QR DE MERCADO PAGO: VÁLIDO DEL 1/9/2026 AL 30/09/2025. SERVICIO EXTRA CASH",
    { checkedAt: "2026-09-09T12:00:00.000Z" },
  );
  const installments = candidates.find((item) => item.kind === "installments");
  assert.equal(installments.status, "conflict");
  assert.equal(installments.calculationEligible, false);
});

test("convierte HTML visible a texto compacto", () => {
  assert.equal(htmlToText("<p>Mercado&nbsp;Pago &amp; Más</p>"), "Mercado Pago & Más");
});

test("verifica el descuento de Carrefour sólo con sus condiciones completas", () => {
  const candidates = parseCarrefourBenefits(
    `
      Todos los lunes de Septiembre. 15% de descuento. Tope mensual por cliente de $15.000.
      Exclusivo con tarjeta de crédito de Mercado Pago (física y QR).
      Beneficio válido en Argentina los días lunes hasta el 30/09/2026.
      El beneficio consiste en un 15% de descuento con tope mensual por cliente de $15.000,
      abonando con tarjeta de crédito (física y QR) de Mercado Pago.
      Todas las sucursales de Hipermercados Carrefour, Carrefour Market, Carrefour Express y Carrefour Maxi.
      No válido para www.carrefour.com.ar. No incluye carnicería, huevos, frutas y verduras,
      electrodomésticos, aceites comestibles y leches fluidas. Mercado Pago.
    `,
    {
      checkedAt: "2026-09-09T12:00:00.000Z",
      asOf: "2026-09-09T12:00:00.000Z",
      recordId: "b5821964-430c-44e9-90d2-17fee264f019",
    },
  );
  assert.equal(candidates.length, 1);
  const discount = candidates[0];
  assert.equal(discount.status, "verified");
  assert.equal(discount.discountPercent, 15);
  assert.deepEqual(discount.daysOfWeek, [1]);
  assert.equal(discount.validFrom, "2026-09-01");
  assert.equal(discount.validTo, "2026-09-30");
  assert.equal(discount.capAmount, 15000);
  assert.equal(discount.calculationEligible, false);
  assert.equal(discount.sourceRecordId, "b5821964-430c-44e9-90d2-17fee264f019");
});

test("bloquea el descuento de Carrefour si sus términos contradicen el uso de la app", () => {
  const candidates = parseCarrefourBenefits(
    `
      Todos los viernes de Septiembre. 10% de descuento sin tope de reintegro.
      Beneficio válido los días viernes hasta el 30/09/2026 mediante el escaneo del código QR
      con la app de Mercado Pago. Medio de pago dinero en cuenta. El beneficio consiste en un
      10% de descuento sin tope. Todas las sucursales de Carrefour Maxi. No válido para
      www.carrefour.com.ar. No incluye carnicería, frutas y verduras, aceites comestibles.
      Promoción no válida para compras en cuotas, tarjetas emitidas fuera de Argentina,
      operaciones en moneda extranjera ni compras abonadas con la aplicación de Mercado Pago.
    `,
    { checkedAt: "2026-09-09T12:00:00.000Z", asOf: "2026-09-09T12:00:00.000Z" },
  );
  assert.equal(candidates[0].status, "conflict");
  assert.equal(candidates[0].calculationEligible, false);
  assert.match(candidates[0].reasons.join(" "), /exige la app/i);
});

test("bloquea las cuotas de Carrefour si el encabezado y el legal mencionan meses distintos", () => {
  const candidates = parseCarrefourBenefits(
    `
      Todos los lunes y miércoles de Septiembre. 6 cuotas sin interés con Mercado Pago.
      Beneficio válido desde el 01/08/2026 al 31/08/2026. Cuotas sin tarjeta de Mercado Pago,
      pagando con QR. Todas las sucursales de Hipermercados Carrefour, Carrefour Market y Carrefour Express.
      No válido para www.carrefour.com.ar.
    `,
    { checkedAt: "2026-09-09T12:00:00.000Z", asOf: "2026-09-09T12:00:00.000Z" },
  );
  assert.equal(candidates[0].status, "conflict");
  assert.equal(candidates[0].calculationEligible, false);
  assert.match(candidates[0].reasons.join(" "), /meses distintos/i);
});

test("separa las tarjetas oficiales de Carrefour y evita falsos positivos en los legales", () => {
  const cards = extractCarrefourPromotionCards(`
    <div class="valtech-carrefourar-bank-promotions-0-x-cardBox">
      <div><img src="/api/dataentities/BP/documents/b5821964-430c-44e9-90d2-17fee264f019/img_card/attachments/mercadopago.png"></div>
      <div>15% con Mercado Pago</div><div>Ver legal</div><div>No válido con otra billetera.</div>
    </div>
    <div class="valtech-carrefourar-bank-promotions-0-x-cardBox">
      <div><img src="/api/dataentities/BP/documents/110bec67-2e8a-4e40-84ca-3302e0e42ff8/img_card/attachments/banco.png"></div>
      <div>20% con Carrefour Banco</div><div>Ver legal</div><div>No aplica mediante Mercado Pago.</div>
    </div>
    <div class="valtech-carrefourar-bank-promotions-0-x-cardBox">
      <div><img src="/api/dataentities/BP/documents/0c9b6cc3-9b6f-11ef-b37f-9e3aeda600bd/img_card/attachments/mercado-pago.webp"></div>
      <div>15% con dinero en cuenta</div><div>Ver legal</div>
      <div>Para pagos realizados a través del servicio de procesamiento de pagos de Mercado Pago.</div>
    </div>
  `);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].id, "b5821964-430c-44e9-90d2-17fee264f019");
  assert.equal(cards[0].isMercadoPago, true);
  assert.equal(cards[1].isMercadoPago, false);
  assert.equal(cards[2].isMercadoPago, true);
});
