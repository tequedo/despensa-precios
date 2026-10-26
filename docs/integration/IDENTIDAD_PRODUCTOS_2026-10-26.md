# Identidad y presentación de productos — 26/10/2026

Frente 3. Correcciones del comparador y de la canasta; se mantienen pendientes las presentaciones no resolubles y las confirmaciones del origen de datos.

## Cambios comprobados

| Caso reproducido con datos reales de San Juan | Comportamiento corregido |
| --- | --- |
| Consulta general de Coca-Cola de 2,25 L: Original y Light comparten marca declarada y tamaño en parte de las filas | La consulta y la canasta exigen seleccionar el producto exacto cuando no pueden comprobar que todas las opciones corresponden al mismo SKU. No se elige el precio mínimo entre variedades distintas. |
| Azúcar Ledesma con nombre de 1000 g y presentación de 1 g | La consulta directa de sucursales también excluye la presentación contradictoria y explica el motivo. Antes esa ruta podía mostrarla aunque la cotización detallada la rechazara. |
| Oreo `3 X 118 GRS` | Se conserva el pack de tres y su contenido total de 354 g. No se cotiza como una unidad de 118 g; el precio del pack permanece tomado de la fuente. |
| Molinillo de sal de marca `1854`, 120 g | La marca numérica no se interpreta como cantidad de envases. Se conserva el cotejo del mismo producto y el precio menor informado. |
| Mayonesa `DOY PACK X 950 GRS` | Los 950 g describen el contenido del envase. Se calcula como 0,95 kg, sin multiplicarlo por 950 supuestos envases. |
| Natura de 1,5 L, en litros, cm3 y `1 UNI` con contenido explícito en el nombre | Mantiene el cotejo entre sucursales con el código, marca y contenido coherentes. No habilita el cruce con 900 ml o 3 L. |

La selección exacta utiliza la evidencia de identidad ya existente. Un código interno de comercio no se transforma en un EAN quitándole el prefijo; un dígito verificador válido tampoco prueba por sí solo asignación o identidad. Los conflictos de marca/presentación conservan el bloqueo del cotejo entre comercios. Los cortes de carne vendidos por kilo mantienen su contrato específico de corte y base de peso.

## Datos revisados

Fuente retenida: `tequedo/despensa-precios`, commit `2cf3f169b6697a69aff18df9597ac9e93e6632f5`, directorio `data/national/AR-J`. Índice generado el **25/10/2026 a las 23:26:35.887 UTC**. Las fechas originales de observación se conservaron; no se atribuyeron al día de esta revisión.

Se descargaron las 14 sucursales del índice: **22.026 observaciones**. Los 14 archivos materializados coinciden con sus blobs Git; el manifiesto conserva además sus huellas SHA-256. La revisión encuentra **7.424 filas con presentación no resoluble o contradictoria**. Es un conteo de observaciones, con repeticiones entre sucursales, y no de 7.424 productos distintos. No todas esas filas permiten afirmar cuál debería ser la unidad correcta.

Se conserva una selección de **103 observaciones reales** en `tests/fixtures/product-identity-san-juan-2026-10-26.json`, con código, nombre, marca, presentación, precio y fechas del corte, además de las referencias de origen. Los casos permiten repetir las regresiones sin depender de otra descarga ni de un cambio de precios posterior.

La procedencia sigue siendo una réplica de SEPA con comprobación de integridad; no se acredita autenticidad independiente ni un permiso nuevo de reutilización. Las contradicciones del comercio no se corrigen inventando gramos, litros o códigos.

## Contrato de comparación

1. Buscar y descubrir opciones puede aceptar texto parcial; sumar una comparación exige una selección concreta y comprobable.
2. Una consulta general que admite varios productos no publica un ganador. La canasta informa qué renglones requieren elegir el producto exacto.
3. Se exige contenido, dimensión y cantidad de envases compatibles cuando se comparan tamaños. Las abreviaturas de gramos/litros y el signo `×` no convierten un multipack en una unidad.
4. La marca declarada acompaña las comprobaciones de tamaño para distinguir marcas numéricas de cantidades.
5. Una declaración de masa/volumen detrás de `pack`, `paquete` o `caja` describe contenido; no se toma automáticamente como número de envases.
6. Las filas de presentación contradictoria quedan fuera de la consulta de sucursales, además de las cotizaciones y cálculos que ya las rechazaban. Se ofrece una explicación visible.
7. Se mantienen precio, sucursal, fecha, canal y procedencia de cada observación. Los beneficios sin evidencia aplicable no sustituyen la identidad del producto.

## Verificación y límites

- **55 pruebas específicas** aprobadas de rutas, identidad, búsqueda y presentaciones.
- **320 pruebas web** aprobadas, 0 fallos, 0 omitidas; TypeScript y compilación aprobados.
- El script `scripts/audit-price-catalog.mjs` se actualizó para cargar las dependencias de las rutas actuales, usar la lectura pública explícita y conservar los motivos de ambigüedad.
- La auditoría de la aplicación usa su selección predeterminada de hasta 12 sucursales y radio de 50 km desde el centro de San Juan; no se confunde con el examen de los 14 archivos de la provincia.
- Esa selección carga 19.028 observaciones y 10.175 identificadores locales. Los 8.844 identificadores ofrecidos con precio pudieron cotizarse; la auditoría final no encontró discrepancias entre el precio del catálogo y la cotización de su selección exacta.
- De 352 combinaciones generales revisadas, 60 requieren elegir el producto exacto. La cantidad de combinaciones generales con precio automático pasa de 110 a 52; los 8.844 identificadores concretos cotizables se conservan. No se presenta esa reducción de consultas generales como una pérdida de productos del catálogo.
- El manifiesto y los resultados detallados, incluidos los cambios de selección de cotización, se conservan en el JSON homónimo.
- La vista previa local quedó detenida al importar `virtual:vinext-app-browser-entry`. No se alteró el código de la app para compensar ese fallo del entorno. La verificación visual de la publicación se registra por separado.

La validación utilizó datos públicos retenidos y solicitudes de prueba locales. El frente 3 no se declara cerrado: continúan pendientes las presentaciones no resolubles, confirmaciones del origen y la revisión de casos adicionales fuera de este corte.

## Publicación y comprobación de producción

Web **175**, fuente `36c1f029638b83e13ec9d09f9008de81443cc70c`, despliegue `appgdep_6adf5c2489f88191b19f0d9b62f17f8f`: publicación confirmada como satisfactoria. Se comprobaron en la API pública la respuesta `ambiguous_product` de Coca-Cola y la exclusión de ocho filas de azúcar de presentación contradictoria dentro de las 12 sucursales seleccionadas. La app terminó de cargar y se abrió la sección Precios. Las respuestas conservaron fecha de precios del 25/10/2026. No se comprobó visualmente el recorrido completo del formulario hasta mostrar el aviso; la limitación de la vista previa local se conserva diferenciada de la comprobación del sitio publicado.
