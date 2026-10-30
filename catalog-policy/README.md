# Política permanente del catálogo

Versión actual: `2026-10-30.provincias-indexadas.1`. Los archivos de `lib/` y `data/` son una copia exacta, con hashes, de las reglas publicadas por la aplicación Dónde Rinde. El importador y la app ejecutan el mismo código puro. La compilación de la app y los exportadores verifican el manifiesto; una divergencia detiene la generación.

Cada descarga vuelve a clasificar familias, aplicar alias acreditados por código y huella exacta, revisar envases y apartar importes inseguros. Los datos de origen permanecen intactos. La tupla nacional conserva las posiciones anteriores y agrega metadata opcional en la posición 11. La metadata sólo permite rechazar registros; no autoriza precios que fallen los controles de identidad o presentación de la app.

`update-san-juan.mjs` conserva todos los productos físicos válidos de la fuente, incluidas las familias desconocidas. Las clasificaciones y revisiones no recortan la descarga; los precios apartados se conservan y quedan fuera de los cálculos. La cobertura depende de las sucursales, fechas y canales efectivamente informados por la fuente.

`national-export.mjs` verifica que cada fila lleve la versión vigente y produce `data/national/catalog-policy-report.json`. La generación nueva reemplaza a la anterior sólo al completar todos los controles. El importador no envía al backend precios apartados, pero conserva sus registros originales y motivos para auditarlos.

## Cambios de reglas

Actualizar ambos repositorios, aumentar la versión, recalcular `data/catalog-policy-manifest.json`, conservar los casos anteriores y agregar una regresión por cada nuevo error. Ejecutar `node catalog-policy/scripts/verify-catalog-policy.mjs` y `node --test tests/catalog-import-policy.test.mjs tests/national-export.test.mjs tests/san-juan-snapshot.test.mjs`. El flujo diario ejecuta además `npm run check`; el CI del paquete corre antes de integrar sus cambios.

Los 151 casos de `data/catalog-policy-regressions.json` provienen de nombres reales de la copia fijada de San Juan. Los datos sintéticos usados en la prueba de dos importaciones no son precios reales. La evidencia de una provincia no acredita todo el país y una revisión funcional completa puede conservar excepciones de origen pendientes.

La revisión de C conserva 64 regresiones nuevas con nombres reales, tipos principales y categorías. Las capacidades de vajilla no generan precios por litro. Las tres abreviaturas sin evidencia primaria mantienen familia pendiente. El arroz declarado en litros y un jabón con variedad contradictoria quedan apartados por huella exacta; no se corrigen sus campos de origen.

La D agrega 44 regresiones reales: dulce de leche abreviado, cosméticos, desodorante, difusores, discos y palitos de arroz, dispensadores y libros. Una clasificación por ID local exige el ID, código restringido, estado, nombre, marca y presentación literales de origen. No convierte ese código en GTIN ni habilita coincidencias entre comercios. Si cambia la huella, la siguiente descarga aparta el precio. Los nombres de marca distintos de un EAN revisado se acreditan por parejas exactas de nombre y marca.

Los dispensadores con conteo explícito de origen (incluido `1 cu`) se comparan como recipientes. Su única medida en ml describe capacidad y no detergente incluido; múltiples contenidos o cantidades contradictorias continúan apartados. La exportación conserva el precio, identificador y presentación originales.

La política contiene 1.017 regresiones. La revisión de unidades agrega la botella real de COTO Cabildo del 29/10: `750 cmq` con precio de referencia en `ltr`. UNECE documenta CMQ como cm³ y LTR como litro (https://vocabulary.uncefact.org/VolumeUnitMeasureCode). El reconocimiento de estas unidades no cambia los campos de origen, cantidades, identificadores, precios ni el número de envases.

La aplicación puede revalidar un `package_conflict` de `2026-10-28.abecedario.1` únicamente cuando la presentación declara CMQ/LTR y el control estricto de envases ahora confirma todos los tamaños y cantidades de origen. Las contradicciones reales, revisiones de importes o identidad, versiones desconocidas y exclusiones de la versión vigente conservan su bloqueo. Esto permite leer la generación anterior mientras la descarga siguiente aplica la nueva política.

El índice de provincias conserva los 24 códigos, nombres y alias anteriores. Se prepara una vez para evitar repetir la normalización de todas las provincias por cada producto en las consultas completas. No modifica clasificaciones, precios, controles de identidad ni exclusiones.
