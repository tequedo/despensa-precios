# Recolector diario de precios de Despensa Inteligente

Descarga el recurso diario más reciente de SEPA, filtra la canasta configurada, valida precios y envía lotes autenticados al motor de Despensa.

Requiere Node.js 22, `unzip`, espacio temporal suficiente y las variables `DESPENSA_INGEST_URL` y `PRICE_INGEST_TOKEN`. `PROVINCE_CODES` acepta códigos separados por comas (por ejemplo, `AR-J,AR-M`); vacío procesa todo el país. El archivo oficial es grande, por eso se procesa línea por línea y se ejecuta como tarea programada.

El Blueprint de Render lo programa todos los días a las 13:30 UTC (10:30 de Argentina). El despliegue inicial conserva `AR-J` para validar estabilidad y costos; quitar ese filtro habilita todo el país sin cambiar el código.

La salida informa recurso, fecha oficial y cantidad aceptada. Un valor cero se considera fallo de cobertura y no una actualización válida.
