# Canal, fecha interna y contradicciones — 14 de septiembre de 2026

Puntos del listado: 4.3, 4.4, 4.7, 4.9, 4.11, 5.8; seguimiento 1.5 y 1.6.

## Problemas y comportamiento

- `sucursales_tipo=Web` identifica un canal online. Su domicilio no acredita una zona de entrega. Se excluye del catálogo presencial hasta verificar esa cobertura. Los tipos desconocidos se apartan para revisión; no se adivina un canal. Se conservan tipo y canal de las sucursales físicas.
- La fecha del recurso del catálogo no sustituye el pie `Última actualización` de `productos.csv`. Se leen y conservan por separado la publicación, descarga y actualización del CSV. El precio publicado usa el día argentino del CSV. Fechas ausentes, inválidas, futuras o con más de tres días quedan fuera; la antigüedad no se reinicia al descargar.
- La selección del recurso considera el más reciente, incluido el día actual. La ausencia o incoherencia de la réplica correspondiente produce un fallo y conserva lo publicado; no atribuye otra revisión ni omite controles de procedencia.
- Una misma sucursal, producto y fecha con distinto precio o identidad detiene la generación nacional. El catálogo anterior se mantiene hasta terminar y validar la nueva generación. Los identificadores de compras e inventario no cambian.
- `data/sepa-import-quality.json` conserva el detalle de archivos y sucursales apartados. El proceso diario conserva ese informe como evidencia y publica el resultado con los datos.

## Comprobaciones

- Pruebas de regresión de canal, fecha, variantes del pie, antigüedad, contradicciones y conservación del catálogo anterior.
- Ejecución del importador real con adquisición sustituida por una entrada de prueba: el precio presencial de 1.800 prevalece porque el registro Web de 900 se excluye; el archivo de 2025 no entra; la publicación del 14/09 no reemplaza la fecha del CSV del 13/09. Este mecanismo sólo existe en el proceso de prueba, no en la configuración productiva.
- Lectura dirigida de los 14 CSV de productos conservados del paquete del 06/09, con reloj de evaluación de esa fecha: 13 aceptados por vigencia y Unicoop apartado por fecha 11/06/2025. Es una comprobación histórica de fechas internas; no demuestra autenticidad oficial del ZIP ni auditoría de todos los precios.
- La app v102 lee `sourceDate` de cada sucursal y exige coincidencia con la fecha del registro. El exportador conserva esa relación. La comprobación de la publicación real se registra por separado al terminar el proceso de actualización.

## Pendientes

La descarga oficial 4.2 sigue esperando la respuesta de SEPA. El conflicto de marca/presentación entre cadenas y la identificación física de envases no quedan resueltos por estos controles de duplicados. Tampoco se habilita comparación online, mayoristas, promoción 2 ni reintegros nuevos.

Referencia de formato: [Anexo II SEPA, Resolución 678](https://www.argentina.gob.ar/normativa/345335_res678-2_pdf/archivo), tipos de sucursal y pie de actualización. Los datos recibidos también usan pies sin tilde y zona `-0300`; se normalizan sin inventar fechas.
