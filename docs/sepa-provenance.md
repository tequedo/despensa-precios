# Procedencia de archivos SEPA — punto 4.2

La fuente inmediata configurada de esta aplicación es la réplica `catdevnull/preciazo`,
con metadatos en `catdevnull/sepa-precios-metadata` y archivos en Backblaze B2.
El conjunto declarado de origen es SEPA, del portal datos.produccion.gob.ar.
La copia y sus metadatos proceden del mismo intermediario: su concordancia
no constituye una confirmación independiente del original gubernamental.

El 14/09/2026 el catálogo, su API y el ZIP oficial devolvieron HTTP 403.
La consulta normal en navegador confirmó un bloqueo de BunkerWeb. No se
eludió ese control. Los metadatos copiados no contienen un hash oficial.
El cotejo independiente del original sigue bloqueado.

## Descargador propio del original

`sepa-official.mjs` incorpora una adquisición directa desde el catálogo HTTPS
oficial. No usa los metadatos de Preciazo para decidir qué original descargar.
Conserva los bytes del ZIP, el catálogo anterior y posterior a la descarga,
fechas de adquisición, tamaño, SHA-256, manifiesto completo y resultado.
Rechaza una revisión que cambió durante la descarga, redirecciones, contenido
truncado, ZIP dañado y tamaños distintos de los declarados. Un error no activa
automáticamente otra fuente ni borra los precios anteriores.

La etiqueta `official_https_download` sólo se obtiene al completar esa
adquisición directa y la validación; nunca al proporcionar un ZIP local.
Confirma el canal HTTPS de adquisición, no una firma digital de SEPA ni la
coincidencia con cada caja del supermercado. La comparación con la réplica
tiene un estado independiente y sólo dice `matched` tras cotejar todos los
archivos internos de la misma revisión.

```bash
node scripts/download-official-sepa.mjs --compare-replica --original-dir /ruta/originales --output /ruta/informe.json
```

El comando y el workflow **Descargar original SEPA y auditar sin publicar
precios** sólo descargan y auditan. El workflow es manual, sin acceso al token
de ingestión y sin notificaciones. Se prepara para utilizar el canal oficial
cuando el acceso esté resuelto; no se ha ejecutado contra SEPA para eludir el
403 previamente observado. Las pruebas automatizadas usan respuestas locales
simuladas y archivos pequeños identificados como pruebas.

La actualización diaria existente acepta la variable de repositorio
`SEPA_SOURCE=official`; sin ella conserva el modo explícito `replica`.
La activación debe seguir a una auditoría real satisfactoria del acceso y del
original. `REQUIRE_ORIGINAL_AUTHENTICITY=1` sigue bloqueando la ruta de réplica;
la ruta oficial verifica su adquisición directamente. No se incorporan
contraseñas personales de SEPA ni configuraciones para sortear el bloqueo.

En GitHub Actions los paquetes de originales se guardan como artefactos por
**3 días**, y el informe de auditoría por **90 días**. No son un archivo
histórico permanente: deben descargarse antes del vencimiento si se necesita
conservarlos más tiempo. El ZIP permanece intacto dentro del artefacto. En
ejecución local se conserva en `artifacts/sepa-originals` o en la carpeta
indicada. Los ZIP grandes no se agregan al historial Git.

## Por qué se utilizó Preciazo y qué muestra su código

- Nuestro intento directo del 06/09/2026 falló en el catálogo, antes de
  descargar el ZIP: [ejecución con HTTP 403](https://github.com/tequedo/despensa-precios/actions/runs/34059224553).
  Después se incorporó la [ruta de réplica](https://github.com/tequedo/despensa-precios/commit/f5ca3ce02732011489b350a24d72303702c9f7a8).
  También hubo una ruta de ZIP aportado manualmente; no se atribuye origen
  independiente a ese archivo sólo por el título del cambio.
- Preciazo usa Bun/TypeScript y `curl` contra el mismo catálogo oficial.
  No hay un inicio de sesión SEPA en el código examinado. Descarga, extrae,
  elimina el ZIP externo y recomprime el contenido para Backblaze B2.
- Su [cambio del 17/09/2024](https://github.com/catdevnull/preciazo/commit/9fced663ffbb2b3a5da4ba01f44a68630fc0aaa4)
  incorporó un proxy. Un comentario anterior de su autor mencionaba posibles
  bloqueos a conexiones desde fuera del país: es una observación del autor,
  no una confirmación de la regla que nos afecta.
- El [08/03/2026](https://github.com/catdevnull/preciazo/commit/7d43851d399fbd77af2c439c87cac9667d46e624)
  cambió de `ubuntu-latest` a un ejecutor propio. Minutos después
  [quitó el proxy del workflow](https://github.com/catdevnull/preciazo/commit/03124d852fe39f6d60259885574b6e06fd7a7905).
- El 24/08/2026 añadió IPv4 y límites de tiempo a la consulta de metadatos.
  El [31/08/2026 hay una descarga exitosa](https://github.com/catdevnull/preciazo/actions/runs/33434878472)
  en su ejecutor propio; no autentica por sí misma nuestras copias de septiembre.
- Desde el [cambio del 01/09/2026](https://github.com/catdevnull/preciazo/commit/2642ece2a284417b267e1e9d74ea59c55d89c1a3)
  documenta Docker/Uncloud. La configuración pública permite un proxy opcional,
  vacío por defecto. Sus valores privados actuales no se conocen.

Tener el código en GitHub no implica descargar desde una máquina de GitHub.
La conexión y las características de la petición son diferencias comprobables;
la causa exacta de nuestro 403, el país/IP actual del servidor de Preciazo y
cualquier habilitación particular siguen sin confirmarse. Copiar su programa
no garantiza que SEPA acepte una conexión diferente.

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
