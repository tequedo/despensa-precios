import assert from "node:assert/strict";
import test from "node:test";

import { htmlToText, parseChangoBenefits } from "../verify-wallet-benefits.mjs";

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

