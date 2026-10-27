# Política permanente del catálogo

Versión actual: `2026-10-27.abc.1`. Los archivos de `lib/` y `data/` son una copia exacta, con hashes, de las reglas publicadas por la aplicación Dónde Rinde. El importador y la app ejecutan el mismo código puro. La compilación de la app y los exportadores verifican el manifiesto; una divergencia detiene la generación.

Cada descarga vuelve a clasificar familias, aplicar alias acreditados por código y huella exacta, revisar envases y apartar importes inseguros. Los datos de origen permanecen intactos. La tupla nacional conserva las posiciones anteriores y agrega metadata opcional en la posición 11. La metadata sólo permite rechazar registros; no autoriza precios que fallen los controles de identidad o presentación de la app.

`update-san-juan.mjs` admite la canasta anterior, familias reconocidas y snacks como Lay’s y Takis. No depende de que el nombre contenga ketchup. La cobertura continúa limitada a lo informado por las sucursales y al criterio explícito de admisión; no es una promesa de disponer de todo SEPA.

`national-export.mjs` verifica que cada fila lleve la versión vigente y produce `data/national/catalog-policy-report.json`. La generación nueva reemplaza a la anterior sólo al completar todos los controles. El importador no envía al backend precios apartados, pero conserva sus registros originales y motivos para auditarlos.

## Cambios de reglas

Actualizar ambos repositorios, aumentar la versión, recalcular `data/catalog-policy-manifest.json`, conservar los casos anteriores y agregar una regresión por cada nuevo error. Ejecutar `node catalog-policy/scripts/verify-catalog-policy.mjs` y `node --test tests/catalog-import-policy.test.mjs tests/national-export.test.mjs tests/san-juan-snapshot.test.mjs`. El flujo diario ejecuta además `npm run check`; el CI del paquete corre antes de integrar sus cambios.

Los 107 casos de `data/catalog-policy-regressions.json` provienen de nombres reales de la copia fijada de San Juan. Los datos sintéticos usados en la prueba de dos importaciones no son precios reales. La evidencia de una provincia no acredita todo el país y una revisión funcional completa puede conservar excepciones de origen pendientes.

La revisión de C conserva 64 regresiones nuevas con nombres reales, tipos principales y categorías. Las capacidades de vajilla no generan precios por litro. Las tres abreviaturas sin evidencia primaria mantienen familia pendiente. El arroz declarado en litros y un jabón con variedad contradictoria quedan apartados por huella exacta; no se corrigen sus campos de origen.
