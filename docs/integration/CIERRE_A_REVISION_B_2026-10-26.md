# Revisión funcional de A y B y política permanente de importación

Se conserva la copia del 25/10/2026 de 14 sucursales de San Juan, 22.026 observaciones, commit de datos `0ef2f12e9f80d3d8c0b1694fdbd39e94657c2067`. No se actualizan sus fechas o precios para aprobarla. La revisión completa se refiere al catálogo filtrado disponible en esa copia, no a todos los productos del archivo SEPA nacional.

| Control | A | B |
| --- | ---: | ---: |
| Observaciones | 1.691 | 354 |
| Códigos locales | 792 | 189 |
| Nombres informados distintos | 659 | 130 |
| Códigos encontrados por búsqueda, nombre exacto y tras filtros | 792 | 189 |
| Combinaciones de consulta, marca y presentación | 369 | 70 |
| Consultas iniciales / específicas adicionales | 55 / 2 | 39 / 0 |
| Páginas de descubrimiento / filtradas | 130 / 369 | 50 / 70 |
| Códigos con cotización contrastada | 702 | 176 |
| Códigos apartados por datos de origen | 90 | 13 |
| Incidencias funcionales del barrido final | 0 | 0 |

La revisión funcional local de ambas letras terminó. Los controles accionan los eventos reales de Marca y Tamaño y usan el manejador real, con la carga de mercado reemplazada por la copia fijada. No son clics de navegador en cada código, cuentas Google ni pruebas físicas. Los datos apartados conservan una entrada individual con contenido declarado y descrito, importe original, fecha, archivo de origen y decisión de no usar el precio.

En la A, 87 exclusiones contienen cantidades contradictorias, dos contienen varios contenidos o un paquete no resuelto y una corresponde al agua Benedictino informada como 1500 lt. En la B hay doce conflictos de cantidad y un conjunto de varios contenidos. Se concluyó su revisión con decisión explícita de cuarentena; la confirmación de esos datos de origen sigue pendiente. No se declara que todos los precios sean utilizables ni se cierran los frentes generales del proyecto.

## Correcciones adicionales

La abreviatura `AGUILA FRAMB LECHE`, GTIN 7790580147822, se acreditó mediante el catálogo de Josimar, con EAN y título completo de frambuesas con chocolate, y la referencia concordante de DeliMart. Conserva el registro original y recibe un alias de búsqueda. Los seis GTIN revisados de la A ya tienen significado acreditado.

El lector admite que un nombre repita su cantidad como metadato final con marca exacta: `4 L, QUERUBIN, 4000 cm3`. Exige cantidades equivalentes, la marca suministrada y un último campo formado sólo por la medida. Sigue rechazando sumas de productos, varios contenidos, marcas diferentes y cantidades contradictorias. Esta corrección recupera la cotización de ese código y pasa la A de 701 a 702 cotizables, sin cambiar la fuente.

La B incorpora 23 controles semánticos con nombres reales: barras y bizcochos frente a arroz, barras proteicas frente a café o sal, bebidas sin azúcar frente a azúcar, bebidas lácteas frente a leche simple, magdalenas frente a dulce de leche, mamaderas frente a jugo, batidores frente a leche y bolsas frente a vino. BRC CHO LECHE se acredita como chocolate Bariloche; BOM BONOBON y la caja Bon o Bon como bombones; BRUNELLO C VINO como copa Nadir. La capacidad acreditada de 390 ml de la copa sólo ayuda a encontrarla: no se convierte en contenido, volumen comprado o precio por litro.

## Lay’s y Takis: causa distinta y prueba incorporada

La canasta del importador tenía treinta palabras y no incluía snacks o Takis. Algunas Lay’s entraban por la palabra ketchup. La copia fijada no contiene Lay’s de 150 o 250 g ni Takis. Los tamaños de 150/250 g pertenecían al atajo predefinido y no acreditaban disponibilidad en San Juan.

Los campos compartidos ahora respetan también una respuesta vacía del catálogo: retiran los tamaños sin datos, impiden declarar completa una combinación ausente y explican la falta de coincidencias en la localidad. Los filtros reconocen LAYS, Lay's y LAY´S como escritura de la misma marca, conservando intactos los controles de identidad y marca originales al cotejar precios. Una consulta de 77 g se contrasta con los códigos originales; 150 y 250 g deben devolver cero opciones en esta copia. Takis no recibe un precio inventado.

## Reglas que se conservan en cada descarga

La versión `2026-10-26.ab-snacks.1` del paquete `catalog-policy/` del repositorio de datos contiene los mismos archivos puros de reglas y huellas SHA-256 que la aplicación. La compilación de la app y el inicio de los exportadores verifican esos hashes. Cambiar una regla exige actualizar la versión compartida, su manifiesto y las pruebas.

El importador conserva la canasta anterior y admite además familias reconocidas y snacks por descripción o marca, incluidos Lay’s y Takis. Esto elimina su dependencia de un sabor incidental como ketchup; no acredita que una tienda o la fuente disponga de todos los productos.

Cada registro se clasifica y valida antes de publicarse. Nombre, marca, presentación, identificadores, fechas e importes originales se conservan. Se agrega metadata opcional de clasificación y elegibilidad al final de la tupla nacional, sin desplazar los campos anteriores. La app sólo puede usar esa metadata para apartar un registro; nunca para habilitar un envase inválido. Una huella desconocida de un GTIN ya revisado queda en cuarentena sin heredar alias. Los nombres aún no reconocidos se cuentan para revisión.

La publicación nacional conserva su reemplazo atómico: un fallo no reemplaza la generación anterior. Genera `data/national/catalog-policy-report.json`, por provincia, con conteos y excepciones por código y sucursal. Los registros apartados permanecen auditables y se excluyen de los lotes de precios utilizables enviados al backend. El informe queda incluido en los artefactos de calidad de la actualización programada.

Hay 43 regresiones con nombres reales de A/B que se ejecutan también en el repositorio de importación. Se ensayan dos importaciones consecutivas, una cantidad contradictoria que sigue apartada, su liberación cuando una nueva fuente es consistente, otra provincia y preservación exacta del NDJSON. Los ocho controles dirigidos del importador pasaron localmente. La suite de la app, su publicación, las muestras de navegador y el resultado del CI quedan registrados en el estado canónico al completar el corte.

La verificación final de la app aprobó TypeScript, compilación y 374 pruebas completas, con cero fallos, omitidas o canceladas. La del importador aprobó los ocho controles, incluyendo los cinco previos de exportación y copia de San Juan. La política y sus 43 casos están incluidos en esos controles, no son 43 cuentas o importaciones reales. La ejecución alojada de la primera descarga posterior conserva su evidencia separada del ensayo local.

La C no se inició. Los casos Lay’s/Takis no acreditan una revisión de las letras P o T. La validación Samsung, Gallo 3/1/2, tres tarjetas por pantalla y el segundo dispositivo conservan su estado pendiente.

## Ajuste final observado durante la prueba visible

La muestra publicada de Lay’s 77 g recuperó la opción de La Anónima y su precio original de $4.050 del 25/10/2026. La búsqueda de Copa 390 ml habilitó NADIR y 1 EA y encontró el código Brunello. No se guardaron productos, existencias o compras durante estas consultas.

La prueba de Lay’s mostró opciones con texto igual y distinto código local. El selector exacto incorpora ahora la sucursal de origen, conserva dos opciones visibles y permite desplegar las restantes. No une esas identidades ni relaja la cuarentena de un dato contradictorio. La carga del catálogo también evita anunciar ausencia de productos mientras la consulta está pendiente. Son cambios de presentación y estado; las reglas de la política compartida se conservan. La suite final con el ajuste aprueba 375 pruebas, cero fallos, omitidas o canceladas, con tipos y compilación aprobados.


Comprobación publicada de web 191: Papas → LAYS → 77 gr muestra dos opciones iniciales con sucursal y «Ver 2 opciones más» abre y cierra las dos restantes. Takis conserva el estado de búsqueda durante la carga y anuncia ausencia sólo al terminar. No se guardaron productos, existencias o compras. La vista de prueba queda abierta para acompañar la revisión; las pruebas automáticas no se presentan como una transmisión de cada código.
