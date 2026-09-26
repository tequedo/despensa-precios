# Descargador propio SEPA — 25/09/2026

## Qué hace el intermediario

Se revisaron el código público `catdevnull/preciazo/sepa/archiver.ts`,
`sepa/archiver-runner.sh` y `compose.archiver.yaml` en la rama master.
Consulta el catálogo CKAN `package_show?id=sepa-precios`, descarga los ZIP,
extrae archivos de comercios/sucursales/productos, agrega los metadatos,
recomprime y guarda la réplica en almacenamiento de objetos. Publica un índice
con la identidad y revisión de cada recurso. El bucle declara una revisión cada
dos horas y un reintento después de cinco minutos en caso de error.

El código admite configuración opcional de proxy y de servidor de origen.
No conocemos la configuración privada que utiliza su operador; esas opciones
no prueban que estén activadas. Nuestro proceso no depende de esas opciones.

## Implementación propia

`sepa-official.mjs` adquiere el archivo desde HTTPS oficial, conserva el ZIP
original y dos copias del catálogo (antes/después), exige coincidencia de revisión,
tamaño e integridad, y obtiene un manifiesto SHA-256 de los archivos internos.
No requiere una página nueva ni un prompt diario: es un proceso de servidor.

El flujo de producción selecciona explícitamente `SEPA_SOURCE=auto`:
1. Intenta la adquisición oficial propia.
2. Si falla, intenta la réplica con sus controles existentes y la identifica
   como réplica, sin atribuirle autenticidad oficial independiente.
3. Si ninguna fuente válida responde, no reemplaza los precios con datos
   inventados o un archivo vencido. El informe conserva ambas causas de error.

Se mantienen el límite de antigüedad de 72 horas del recurso, las fechas internas
por sucursal/producto y la cuarentena de registros inconsistentes. Ese límite
no significa que un archivo de 72 horas sea una actualización diaria.

La programación pasa a 14:30, 16:30 y 18:30 de Argentina. Son oportunidades de
adquisición, no una garantía del horario en que el proveedor publica datos.
Los originales se retienen tres días y los manifiestos de adquisición 90 días
en los artefactos de la ejecución. Los avisos de importación incluyen la fecha
real del recurso y advierten si supera 26 horas.

## Criterio de aceptación operativo

Pruebas automáticas cubren descarga, integridad, cambio de revisión, archivos
rotos, errores HTTP, aislamiento de fuentes, respaldo y comunicación de fechas.
Eso no acredita una descarga real de hoy. La recuperación se acredita solo con
una ejecución que conserve un archivo reciente, importe precios con su vigencia
interna y complete la comprobación de lectura desde la aplicación.

## Resultado de la ejecución real

El 25/09/2026 a las 22:23 ART, la ejecución 36208130185 aprobó las 92 pruebas
JavaScript y llegó a la adquisición. El primer transporte falló con
UND_ERR_CONNECT_TIMEOUT. El reintento al mismo servidor HTTPS con curl por IPv4
agotó 20 segundos sin conectar a datos.produccion.gob.ar:443 (curl 28).
La réplica se rechazó por superar 72 horas; su índice seguía en el 22/09.
No se obtuvo un catálogo oficial ni un ZIP reciente. Por tanto, la recuperación
diaria no está acreditada. No se relajaron controles ni se sustituyeron precios.

La alternativa IPv4 se utiliza solo ante errores de conexión, nunca para eludir
un rechazo HTTP o una validación TLS. Preserva las comprobaciones de URL,
tamaño, contenido y revisión del recurso. Los errores y originales disponibles
se conservan como artefactos de la ejecución.

Evidencia: https://github.com/tequedo/despensa-precios/actions/runs/36208130185

Referencias de código público:
- https://github.com/catdevnull/preciazo/blob/master/sepa/archiver.ts
- https://github.com/catdevnull/preciazo/blob/master/sepa/archiver-runner.sh
- https://github.com/catdevnull/preciazo/blob/master/compose.archiver.yaml
- https://github.com/catdevnull/sepa-precios-metadata
