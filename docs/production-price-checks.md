# Corroboración posterior a la publicación

Al terminar la actualización nacional en `main`, el workflow de comprobación
de la app lee una copia coherente de la última publicación. Mantiene sus
controles anteriores y añade COTO Cabildo, el catálogo real que había
superado el límite de tamaño.

Se reconstruyen todas sus partes, se comprueban cantidad y tamaño y se
consulta en la API pública un registro cotizable de la última parte. Deben
coincidir código, importe, fecha interna, observación, sucursal, dirección,
provincia, generación y condición de fuente oficial. La fecha de consulta
no sustituye la fecha del precio. Una fuente vencida o un importe distinto
falla y deja evidencia, sin dar por corroborada la cotización.

El informe registra además si la publicación conserva el filtro histórico
de categorías o declara el alcance completo. Una coincidencia de cotización
no acredita por sí sola todos los comercios ni todos los productos del país.
Las auditorías locales anteriores tampoco sustituyen este control real.

Los informes quedan como artefactos de la ejecución durante 90 días incluso
si una comprobación falla. Sólo una comprobación completa aprobada registra
los informes en la rama principal. Los perfiles técnicos del control previo
siguen separados de las métricas del piloto; el control nuevo consulta la
API pública sin crear perfiles de uso normal.

El control nacional adicional comprueba los índices de las 24 provincias,
sus recuentos, fechas, canales, sucursales únicas y generación. Exige que la
publicación declare el catálogo físico completo y cero descartes por categoría.
Después reconstruye la sucursal con más registros de cada provincia, valida
los hashes de sus partes y consulta una cotización con sucursal explícita.
Los tamaños de archivo se comprueban en bytes UTF-8; una parte alterada o un
precio diferente al publicado impide dar el control por aprobado.

Este control conserva su informe como `national-large-branch-smoke-report.json`,
con el commit exacto de los datos. Acredita los índices y 24 catálogos de
sucursal completos, más una cotización por cada uno; no acredita individualmente
todas las cotizaciones ni todos los SKU del país. Sus fixtures de transporte
son sintéticos y se usan sólo para probar fallos y recuentos.
