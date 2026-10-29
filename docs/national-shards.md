# Catálogos por sucursal

Los archivos publicados siguen limitados a 2.000.000 bytes, incluido el salto
de línea final. Una sucursal pequeña conserva el formato de versión 1.

Cuando no cabe en un archivo, el exportador escribe una cabecera de versión 2
en el nombre habitual de la sucursal. Incluye los mismos metadatos, el total
`records` y una lista `parts` con nombre y cantidad de registros por parte.
No incluye una lista parcial de precios. Cada parte tiene `version: 1`,
`kind: "price-part"`, `storeId`, `generatedAt`, `sourceDate` y `prices`.
Su nombre es el prefijo de 24 caracteres hexadecimales del SHA-256 del archivo.

La sucursal conserva una sola entrada en el índice provincial y todos sus
registros en la cobertura y el informe de política del catálogo. Las partes
se generan dentro de la publicación provisional y se publican con la misma
sustitución atómica que los índices. Un producto individual que exceda el
límite sigue rechazándose; no se omite ni reemplaza la publicación anterior.

`price-shards.mjs` reúne una sucursal completa, valida el manifiesto y todas
las partes y rechaza faltantes, mezclas de fecha/generación/sucursal,
duplicados y recuentos inconsistentes. Se usa también en diagnóstico y
pruebas de lectura de la app. Su contrato coincide con el lector web.

Desplegar primero la app compatible y luego el exportador. Un lector anterior
rechaza la versión 2, por lo que no interpreta una sucursal parcial como
completa. Una ejecución del recolector y sus verificaciones de producción
deben terminar correctamente antes de comunicar recuperación de precios.
