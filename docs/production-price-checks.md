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
