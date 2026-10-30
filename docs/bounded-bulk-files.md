# Archivos masivos acotados

La ejecución 40982877550 terminó la adquisición, la exportación, la carga en
la app y las verificaciones de promociones. La publicación falló porque
`data/san-juan-quarantine.ndjson` acumulaba la auditoría de todo el país:
144,10 MiB, por encima del límite por archivo del repositorio. El informe
nacional de política ocupaba 83,09 MiB y el snapshot de San Juan 95,86 MiB;
la ampliación de categorías requiere también acotar estos dos resultados.

La auditoría nacional se guarda en `data/sepa-quarantine/`, con partes NDJSON
de 2.000.000 bytes y un índice de cantidades, bytes y SHA-256. El archivo
histórico de revisión de San Juan conserva sólo los registros de esa
provincia y la evidencia general de archivos. Ninguna revisión nacional se
descarta. Si una captura queda interrumpida, su índice lo declara.

El informe de política conserva sus contadores, motivos y versión de reglas.
Las exclusiones se guardan por provincia en `data/national/catalog-audits/`.
El resumen referencia todas las partes y no contiene una lista parcial que
pueda confundirse con el detalle completo. Los casos pequeños conservan la
lista inline para compatibilidad.

El snapshot de San Juan mantiene NDJSON para archivos pequeños. Los grandes
se representan con una cabecera `kind: san-juan-snapshot`, `version: 2` y
partes inmutables de una generación. El lector comprueba hashes, tamaños,
cantidades y SHA-256 del NDJSON reconstruido antes de devolver los registros.
La cabecera anterior no se reemplaza hasta completar la nueva escritura.
Los avisos cuentan los registros completos y las promociones se calculan
desde la misma colección exportada. La app consulta los índices nacionales;
su lector v209 ya acepta las cotizaciones por partes.

La transición cancela dos ejecuciones concretas que cargaron el workflow
anterior, cuyo listado de archivos a publicar no incluye las nuevas partes.
La carga nueva usa el workflow completo; no se fuerza la rama ni se alteran
importes, fechas, presentaciones o reglas de cotización.
