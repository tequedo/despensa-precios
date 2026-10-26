# Variedad y menor precio al agregar un producto

Revisión del 26/10/2026. Base publicada: web 179, fuente `8f404477ecbffe88d3b424f25f9401aad11e8b1b`.

## Problema observado y causa

El titular seleccionó Arroz, Gallo y 500 g en su Samsung. El formulario anunció «Datos completos», pero mostró «Precio en revisión» y pidió elegir un producto exacto sin ofrecer las opciones. El producto se podía agregar con 3 unidades y quedaba en la lista sin precio. La captura posterior confirma esas 3 unidades y stock 0; la recepción parcial todavía no está acreditada por esa imagen.

La API ya devolvía productos concretos en `review.choices` cuando detectaba varias identidades. La pantalla de Precios los ofrecía desde web 177; el formulario de alta sólo utilizaba `review.message` y descartaba las opciones. Marca y tamaño no distinguen, por ejemplo, arroz largo fino, parboil y yamaní.

## Cambio

El alta de producto conserva y muestra las opciones exactas en un selector de variedad. Elegir una dispara automáticamente la consulta por su código y presenta los precios del producto elegido, comenzando por el menor disponible dentro del ámbito consultado. La cantidad ya ingresada se conserva y el guardado retiene la identidad elegida. Si se cambia marca/tamaño, se cancelan las consultas anteriores y sus respuestas tardías se descartan.

La ayuda deja de anunciar una selección completa para comparar mientras hay variedades pendientes. Una ambigüedad resoluble utiliza el selector; las observaciones reales de calidad y los errores de conexión conservan sus mensajes y controles. Se mantiene la posibilidad de alta manual sin precio, sin inventar un importe. No se cambia la protección de identidad de la API, las fechas, los importes de origen o los gastos.

El selector ocupa un campo y utiliza la estética existente. La reducción adicional de espacios del cuadro «¿Qué producto querés agregar?» fue solicitada para **después de terminar la prueba física** y permanece pendiente; no se incorpora en este cambio.

## Comprobación

La muestra de regresión conserva 288 observaciones que contienen arroz/Gallo, incluidas referencias a snacks que las búsquedas deben distinguir, extraídas de las 14 sucursales del índice AR-J. Proceden del repositorio de datos, commit `4f4340ea0129361943c103c32585e348f738fc3c`, índice blob `89caada6631c5e50b659cfe4841e483a2dce02d7`. Se conservan los valores originales, sus metadatos y fecha 25/10/2026. Es una muestra filtrada; no se presenta como una copia completa del catálogo ni como acceso oficial directo.

La prueba ejecuta el Worker construido, su cargador real y la selección geográfica de las 12 sucursales. La consulta general mantiene el bloqueo de identidades distintas; cada opción exacta devuelve precios presentes en la muestra original, del mismo código de barras y con el mínimo igual al menor de sus cotizaciones. El reloj de ensayo se fija al 26/10 para conservar la reproducibilidad de la muestra histórica. Las salidas HTTP se sustituyen por esos archivos; no se consulta ni modifica producción.

Las pruebas de eventos del formulario comprueban que se ofrecen las opciones, se consulta el código elegido, se guardan 3 unidades y stock 0, y se ignora una respuesta anterior después de cambiar el tamaño. El renderizado del selector y de la ayuda se verifica por separado. Los importes ficticios de la prueba de eventos son datos de ensayo; la comprobación del Worker contrasta los importes reales de la muestra.

Archivos: `tests/add-product-prices.test.mjs`, `tests/product-review-choices.test.mjs` y `tests/fixtures/arroz-gallo-san-juan-2026-10-26.json`.

| Control | Resultado |
| --- | --- |
| Pruebas específicas del formulario, selector, ayuda y Worker real con muestra | 7 aprobadas; 0 fallos; 0 omitidas |
| Suite completa, incluidas cinco regresiones nuevas | 335 aprobadas; 0 fallos; 0 omitidas; 0 canceladas |
| TypeScript | Sin errores |
| Compilación y revisión del diff | Aprobadas |
| Coherencia técnica de inventario legal previa a compilar | 879 entradas, 5 archivos de marca y 7 componentes suplementarios; no acredita todos los derechos de distribución |

Las capturas del titular acreditan el problema y el alta previa. La interfaz posterior necesita revisión en el Samsung. El navegador de control no estaba disponible por su estado de credenciales; no se eludió esa restricción ni se declaró una prueba visual independiente. La compra parcial, el segundo dispositivo y los restantes frentes conservan sus verificaciones pendientes.
