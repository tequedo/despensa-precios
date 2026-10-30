# Indicadores EAN duplicados · 29/10/2026

La ejecución 40967726395 superó el bloqueo por tamaño y se detuvo al reunir
`5|1|1 / sepa:5:1:0079400052919 / 2026-10-29`. El ZIP original oficial
conservado en el artefacto `original-sepa-40967726395` contiene dos filas con
idénticos descripción, marca, presentación, precio de lista y referencias;
sólo cambia `productos_ean` entre `1` y `0`. El importe de ambas es $942.
El archivo de ese comercio contiene 49 pares sucursal/producto con esta
única diferencia. La fixture conserva encabezado, las dos filas originales
del primer caso y el pie de actualización.

El exportador y la salida de San Juan reúnen exclusivamente este caso:
todos los demás campos de producto, precio y política deben coincidir.
Conservan el ID interno y cada declaración original en
`sourceIdentityVariants`, incluidos los indicadores EAN. La identidad
resultante sigue siendo interna y no autoriza equivalencias entre comercios.
No se modifica ningún importe, presentación ni fecha. Las contradicciones
reales de precio, promoción, referencia, descripción, marca o presentación
siguen impidiendo sustituir la publicación anterior.

Este ajuste no omite sucursales ni registros por tamaño y no modifica la
política compartida del catálogo. La fragmentación conserva la totalidad de
las cotizaciones; cada duplicado del mismo registro cuenta una sola vez.
