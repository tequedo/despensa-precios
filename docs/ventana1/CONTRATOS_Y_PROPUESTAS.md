# Contratos de precios y promociones — Ventana 1

Fecha: 22/10/2026. Base del código de datos: `0b1972f88cf63077674b049f1b78cc4d1bc0ed49`.

## Contratos conservados

| Archivo/interfaz | Contrato vigente | Consumidores |
| --- | --- | --- |
| `san-juan-promotions.json` | `promotions[]`: clave histórica `ean`, producto/marca, sucursal compuesta `storeId`, provincia, precio/régimen, slot, condiciones, `validDate`, `observedAt` | Verificador por producto, matriz de cobertura |
| `retailer-promotions-verified.json` y `partner-promotions-verified.json` | `evidenceVersion:2`; coincidencia exacta de producto, sucursal, provincia, canal físico, fecha SEPA, vigencia, precio/régimen, condiciones y slot; URL oficial y `corroboratedAt` real | Resolver de producto, comparación, campanita, prueba de lectura |
| Beneficios de bancos/billeteras | Distingue `kind:discount/reimbursement/installments`, estado, porcentaje, días, vigencia, medio de pago, mínimo, topes, exclusiones, alcance, acumulación y revisión | Matriz, comparador, simulador y notificaciones |
| Tuplas nacionales | Posiciones 0–8 históricas, identidad explícita en 9 y extensiones en 10; sin renumerar | `productFromTuple`, catálogo, comparación |
| Mayoristas en la app | `version:1`, `products[]`, `sourceSystem:sepa_wholesale`, dominios oficiales, bultos, impuestos, mínimos, fechas y coordenadas | `/api/prices/wholesale` y `verifiedWholesaleRows` |

No se cambiaron APIs HTTP, migraciones, estructura de feeds productivos ni `evidenceVersion`. Los nuevos JSON de `docs/ventana1/` son informes offline: la aplicación no los consume.

## Correcciones compatibles implementadas

- El verificador exige igualdad de condiciones normalizadas. Un texto oficial más restrictivo no puede corroborar una leyenda abreviada que omite tarjeta, mínimo o exclusión.
- La provincia debe ser reconocida, la fecha SEPA debe caer dentro de la oferta y el canal debe usar el enum de Schema.org admitido. Las consultas HTML estáticas rechazan redirecciones; las fuentes dinámicas conservan la limitación de comprobación del navegador.
- El enrutamiento a la fuente normaliza acentos de La Anónima/Átomo.
- El productor especializado conserva `capPeriod`, `capOwner` y `capRule`, campos ya existentes en el descubrimiento general y en la campanita.
- `minimumPurchase:null` conserva la incertidumbre. Solo una ausencia de mínimo expresamente indicada puede dar `0`. El consumidor preparado bloquea la simulación mientras falte esa prueba.
- El nombre de un tope que contiene la palabra reintegro no determina por sí solo el momento del beneficio. Se conserva la diferencia entre descuento en caja, devolución posterior y financiación.

## Cambios propuestos, pendientes de coordinación

### Identidad y presentación en candidatos por producto

**Problema reproducible:** los 631 candidatos de la base y de la revisión posterior tienen `ean=sepa:comercio:bandera:id_producto`. Es una clave interna estable. Ninguno transporta `barcode`, `barcodeStatus` ni `presentation`. `scopedPromotionEvidence` busca un GTIN en el JSON-LD oficial, por lo que una página con el código de barras real no puede coincidir con la clave interna. No es válido obtener el GTIN recortando esa clave.

**Propuesta no aplicada:** conservar `ean` y extender el exportador con la identidad explícita ya disponible en `record.product` y su presentación. La corroboración debe validar el código/estado, contenido y unidades; debe devolver una prueba vinculada a la clave interna original. Para identificadores internos o restringidos se requiere evidencia de SKU/comercio y presentación, sin equivalencias entre cadenas.

**Afectados:** `update-san-juan.mjs`, candidato por producto, `promotion-evidence.mjs`, verificadores de retailer/partner, pruebas de importer/identidad y consumidores de prueba de producto de la app. Las ventanas 2/3 deben acordar compatibilidad antes de cambiar el feed. No se añadió una excepción para conseguir resultados positivos.

### Identificadores de sucursal

El `storeId` interno es compuesto, por ejemplo `10|1|123`. Una tienda oficial que publica solo `123` necesita una correspondencia documentada con comercio/bandera/provincia/canal. No se consideran equivalentes por similitud de nombre, coordenada o dirección. La tabla de correspondencias y sus revisiones requieren un contrato acordado y evidencia del comercio.

### Topes múltiples o por banco

Las reglas actuales representan un importe y un período/titular. Un beneficio por banco y por mes, o con distintos topes por segmento, no debe simplificarse tomando el mayor importe. Se necesita acordar representación de múltiples límites y elegibilidad; mientras tanto queda informativo. El ejemplo hallado en Makro/MODO se documenta en `FUENTES_Y_REUTILIZACION.md`.

### Cotizaciones directas y mayoristas

El consumidor actual admite solo SEPA mayorista. Para aportes de un proveedor se propone una fuente distinta, con autorización, factura/cotización pública autorizada, impuestos incluidos y discriminados, unidad/bulto, mínimo, cargos, stock, canal y vigencia. Una página web con retiro en tienda sigue siendo una oferta online si el proveedor así la define. No se cambió `sourceSystem` para hacerla pasar por SEPA.

### Historial y alertas

El historial operativo conserva catorce fechas de comprobación, pero no acredita series comparables de cada presentación/sucursal. La ampliación debería registrar observaciones inmutables por identidad, presentación, sucursal y fecha interna, con origen y evidencia. Las primeras alertas mantenibles serían cambios de precio del mismo envase, caída de fuente y proximidad del vencimiento de una promoción ya verificada. Requieren deduplicación y retención acordadas con ventana 2. No se agregó una automatización ni una alerta basada en una categoría genérica.
