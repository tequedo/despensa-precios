# Recuperación de la descarga diaria SEPA

Estado comprobado el 2 de octubre de 2026: **la actualización real sigue bloqueada**.
Las pruebas del descargador no acreditan que la app tenga precios nuevos.

## Causa y vías comprobadas

El portal oficial responde HTTP 403 y muestra protección BunkerWeb. La réplica
catdevnull está detenida: último commit y datos del 22 de septiembre de 2026.
No se cambió la fecha de esos precios ni se amplió su antigüedad admitida.

| Vía | Resultado observado | Decisión |
| --- | --- | --- |
| API CKAN oficial `package_show?id=sepa-precios` | HTTP 403 en el entorno de trabajo y en GitHub Actions | Mantener como primera opción; registrar el identificador de rechazo |
| ZIP diarios oficiales publicados | Viernes, jueves y miércoles devolvieron HTTP 403 | Añadir adquisición independiente del catálogo, sin afirmar que esté habilitada |
| Réplica catdevnull / Backblaze | Metadatos accesibles; último precio 22/09 | Rechazar como actualización actual |
| Catálogo nacional `datos.gob.ar` | API accesible; sus recursos minoristas conservan fechas de junio/julio y apuntan a los mismos ZIP | Sirve para comprobar los enlaces publicados; no aporta una descarga independiente actual |
| API de la web Precios Claros | Una búsqueda devolvió productos y mínimos/máximos; las consultas de detalle posteriores fueron rechazadas | No sustituir precios por sucursal sin fecha real verificable |
| Almanac | Publica un producto agregado nacional; la consulta de su ficha REST SEPA devolvió `dataset_not_found` | No atribuir sus medianas a sucursales concretas ni contratar una integración sin validar el contrato de datos |
| Argentina Data MCP | API requiere cuenta/clave; el plan gratuito limita consultas, no se verificó una exportación completa actual | Evaluar sólo con acceso concedido y permiso de reutilización comercial |
| Superprecios Claros / Railway | El manifiesto publicado en su repositorio devolvió HTTP 404 | No conectar un servicio sin respuesta válida |
| Precios Abiertos | El sitio devolvió HTTP 502 | No usarlo como fuente operativa comprobada |
| Render conectado | No se listaron servicios en el espacio confirmado por el titular | No existe un descargador propio comprobado en esa cuenta |

Cambiar el modelo de IA no concede acceso al portal ni convierte un precio
agregado o antiguo en un precio actual por sucursal. Una IA puede ayudar a
mantener el código y leer términos; la adquisición debe conservar evidencia.

## Cambio implementado

`SEPA_SOURCE=auto` prueba en este orden:

1. Catálogo oficial, ZIP y catálogo posterior, con revisión y tamaño cotejados.
2. ZIP del día de Argentina mediante su enlace oficial publicado, sin depender
   de `package_show`.
3. Réplica identificada y validada, dentro del límite existente de antigüedad.

La segunda opción conserva el ZIP exacto y sus SHA-256, comprueba la estructura
y CRC del archivo, y lee el pie `Ultima actualizacion` de cada `productos.csv`.
Exige al menos un archivo con fecha interna del día; el importador vuelve a
validar cada archivo y excluye fechas viejas y sucursales Web. La comprobación
nacional posterior exige precios actuales visibles en las 24 jurisdicciones.

Esta adquisición declara `official_archive_content_checked`, fecha basada en
`product_file_footer` y `catalog_revision_not_observed`. No inventa revisión,
tamaño publicado ni fecha de modificación del catálogo. No anuncia una fecha
de descarga como fecha de precio. Una respuesta HTTP 403 se conserva como fallo;
no se cambia de identidad, de IP ni se desactiva la verificación TLS.

La selección conserva la evidencia de los tres intentos. En los fallos HTTP se
guardan código, servidor, protección observada e identificador de solicitud;
se descartan HTML, IP del cliente y credenciales.

## Prueba real independiente

```sh
node scripts/probe-sepa-sources.mjs
```

El comando adquiere y valida; no importa precios, no cambia preferencias y no
envía avisos. Sale con error cuando no hay fuente válida. El flujo de pruebas
del PR ejecuta este comando y conserva el resultado en el artefacto
`prueba-descarga-sepa-<run_id>`. El resumen diferencia las pruebas de código
aprobadas de una descarga real bloqueada.

La automatización diaria conserva sus horarios 14:30, 16:30 y 18:30 de Argentina.
Cuando la adquisición sea aceptada, el flujo existente importa, publica los
archivos por sucursal, verifica la lectura en la app y registra continuidad.
Para cerrar la incidencia deben quedar acreditados **dos días consecutivos**,
con fecha interna actual, importación correcta y lectura de la nueva generación.

## Solicitud técnica preparada para el operador oficial

Canales publicados: enlace `contacto` de https://www.preciosclaros.gob.ar/ y
https://www.argentina.gob.ar/datos-abiertos/contacto (soporte/incidencias del
portal nacional; solicitar derivación al responsable del conjunto SEPA).
El mensaje está preparado; no fue enviado.

**Asunto:** Acceso automatizado autorizado al conjunto público Precios Claros - Base SEPA

Estamos desarrollando una aplicación de comparación de precios por sucursal
que consume el conjunto minorista público SEPA, identificador
`6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5`. Necesitamos una descarga diaria completa
para conservar producto, sucursal, provincia, promociones informadas y fecha
de actualización interna de los archivos.

Desde GitHub Actions y nuestro entorno de trabajo, tanto la API CKAN
`https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios`
como los enlaces diarios publicados devuelven HTTP 403. La página de error
identifica BunkerWeb. Un rechazo de ejemplo se registró el 02/10/2026 a las
23:31:36 UTC, identificador `20d365a94abf8b53623186a794d37a63`.

¿Pueden indicar el canal autorizado vigente para descargar estos datos,
requisitos de identificación o credenciales, cuotas y horario de publicación?
Si corresponde, podemos configurar un descargador con IP de salida fija para
que ustedes autoricen ese acceso. También agradeceríamos una URL alternativa
oficial del archivo completo o su manifiesto diario.

Conservaremos atribución a SEPA, fecha real por archivo y trazabilidad del ZIP.
No queremos usar precios atrasados como actuales. Podemos aportar los códigos
de rechazo adicionales generados por nuestra automatización.

## Fuentes consultadas

- Catálogo original: https://datos.produccion.gob.ar/dataset/sepa-precios
- Catálogo nacional: https://datos.gob.ar/api/3/action/package_search?q=sepa&rows=20
- Réplica: https://github.com/catdevnull/sepa-precios-metadata
- Archivador de la réplica: https://github.com/catdevnull/preciazo/tree/master/sepa
- API de la web: scripts publicados por https://www.preciosclaros.gob.ar/
- Almanac: https://almanac.ar/datasets/sepa.precios.productos y https://almanac.ar/developers/api
- Argentina Data: https://argentinadata.mymcps.dev/ y https://github.com/abenassi/argentina-data-mcp
- Otro descargador: https://github.com/hysmarcos/superprecios-claros

Pendiente externo: obtener un canal de acceso permitido y comprobar datos nuevos.
No corresponde publicar en Play Store como si esta incidencia estuviera resuelta.
