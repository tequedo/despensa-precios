# Procedencia de archivos SEPA — punto 4.2

La fuente inmediata de esta aplicación es la réplica `catdevnull/preciazo`,
con metadatos en `catdevnull/sepa-precios-metadata` y archivos en Backblaze B2.
El conjunto declarado de origen es SEPA, del portal datos.produccion.gob.ar.
La copia y sus metadatos proceden del mismo intermediario: su concordancia
no constituye una confirmación independiente del original gubernamental.

El 14/09/2026 el catálogo, su API y el ZIP oficial devolvieron HTTP 403.
La consulta normal en navegador confirmó un bloqueo de BunkerWeb. No se
eludió ese control. Los metadatos copiados no contienen un hash oficial.
El cotejo independiente del original sigue bloqueado.

## Controles implementados

- Identidad de conjunto, recurso y revisión; dominio y ruta originales exactos.
- URL de réplica contrastada con el índice, revisión y nombre seleccionado.
- Fechas de fuente y copia coherentes; rechazo de fecha inválida, futura o de
  más de 72 horas. La hora copiada de CKAN sin zona se interpreta como UTC,
  conservando la cadena original en la evidencia de metadatos internos.
- Metadatos internos del archivo iguales al recurso seleccionado: ID,
  revisión, URL, tamaño original declarado y fecha.
- SHA-256 del archivo recibido y de cada archivo interno. Se conserva un
  manifiesto reproducible de nombres, tamaños y hashes.
- Extracción limitada, sin rutas que salgan del directorio, enlaces,
  duplicados, ZIP cifrados, CRC incorrecto ni archivo zstd truncado.
- Cada grupo de CSV debe incluir comercio, sucursales y productos. Los ZIP
  vacíos se conservan como marcadores explícitos; un ZIP no vacío dañado falla.
- La validación completa termina antes de borrar salidas anteriores o enviar
  un lote a la app. Un fallo conserva su diagnóstico en el artefacto de CI.
- Se retiró la carga manual que atribuía origen oficial y fecha actual a
  cualquier ZIP. El cotejo manual queda separado de la publicación.
- Las salidas mantienen `source.name` para conservar referencias existentes,
  pero usan `kind=dataset_replica`, `official=false`, fecha y hashes reales.

`replica_integrity_checked` significa integridad local comprobada. No significa
original autenticado, precio contrastado con caja ni cobertura completa del país.
Los checks de tamaño/grupos detectan corrupción e inconsistencias; sin original
no pueden detectar una omisión coherente realizada por el intermediario.

## Comparación de original y réplica

La réplica recomprime los datos: sus bytes externos no deben coincidir con el
ZIP original. El comparador expande los ZIP anidados siguiendo sus nombres y
coteja **todos los archivos de contenido** por ruta, tamaño y SHA-256. Sólo
excluye el `dataset-info.json` añadido en la raíz por el replicador; sus bytes
y contenidos se validan y registran por separado.

Un ZIP aportado manualmente se registra como archivo aportado, cuya procedencia
no ha sido autenticada de manera independiente. Aunque el contenido coincida,
esa coincidencia no se transforma automáticamente en origen oficial verificado.

```bash
node scripts/audit-sepa.mjs --replica /ruta/copia.tar.zst --original /ruta/original.zip --resource-id ID_DEL_RECURSO --output /ruta/informe.json
```

El comando sólo audita; no ingresa precios ni envía notificaciones. Sin
`--original`, registra expresamente que no se realizó el cotejo. Si se activa
`REQUIRE_ORIGINAL_AUTHENTICITY=1`, la importación se detiene mientras no exista
evidencia oficial independiente; aportar otro archivo por sí solo no la habilita.

## Evidencia y límites

La auditoría del archivo del 12/09/2026 se conserva en
`docs/audits/2026-09-14-sepa-provenance.json`: 67.791.439 bytes comprimidos,
48 archivos de contenido, 15 grupos de CSV, 2.134.346.621 bytes de contenido y
un marcador ZIP vacío. Es un archivo diario concreto, no todo el histórico.

Archivo recibido SHA-256:
`df25fe7c4d7e8e922bd281dbdb0eefbb3582f2345916cfca809104a052861e2c`.

Contenido SHA-256:
`17e6dfa89462407a473e003bcb2121e457045b78d0646f608cc6298ad3bbf592`.

El alcance de 4.3/4.5 se documenta por separado; no se deduce de la integridad
del archivo. Tampoco se declara verificada la ausencia de cadenas como Átomo
en el original a partir de su ausencia en una réplica no cotejada.

Referencias: [catálogo oficial](https://datos.produccion.gob.ar/dataset/sepa-precios),
[metadatos archivados](https://github.com/catdevnull/sepa-precios-metadata/tree/44eac927b53b71796d88a3ebc394ac984184bcdc),
[código del replicador examinado](https://github.com/catdevnull/preciazo/blob/2642ece2a284417b267e1e9d74ea59c55d89c1a3/sepa/archiver.ts).
