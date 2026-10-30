# Cobertura de productos de la fuente

El control con el original oficial del 29/10 de COTO Cabildo encontró
10.158 filas: el filtro histórico de palabras y categorías apartaba 3.258
antes de exportar. No era un recorte del lector por tamaño. La reproducción
inicial reunió sus 6.898 registros aceptados en dos partes, sin pérdidas.

La adquisición incorpora ahora todos los productos de las sucursales
presenciales válidas, sin el filtro histórico de nombres. Se conservan los
controles de precio, fecha interna, geografía, canal, identidad y base de
venta de carnes. La política de presentación e identidad sigue clasificando
cada registro: un dato pendiente de confirmar se conserva con su motivo y
no se convierte en una cotización aprobada por ampliar las categorías.

`sepa-import-quality.json` declara
`catalogScope: all_valid_physical_source_products` y cero descartes por el
filtro de categorías. Esto no equivale a cobertura de comercios que no
publican en la fuente ni certifica vigencia de un archivo interno atrasado.

El lector de la app prepara una sucursal por vez,
convierte y libera sus listas originales y conserva sólo el vencimiento
más temprano de las fuentes. Mantiene los productos de todas las sucursales
seleccionadas y la verificación completa de cada parte.
