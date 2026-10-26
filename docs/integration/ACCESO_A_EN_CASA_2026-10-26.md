# Acceso directo para pasar productos de Mi lista a En casa

El 26/10/2026 el titular no pudo localizar el botón de recepción durante la prueba Samsung. Sus capturas muestran la pestaña En casa: Gallo 500 g con stock 0 y Lucchetti 500 g con stock 1. No acreditan la recepción parcial del Gallo ni el fallo de una confirmación enviada. La prueba física permanece abierta.

La fuente de web 180 contiene la acción dentro de las herramientas situadas después de los productos y de la nota de cobertura en Mi lista. Sin una observación independiente del navegador no se determinó si el problema era desplazamiento, solapamiento, una página sin actualizar o navegación entre pestañas.

Se incorpora un acceso destacado **Pasar a En casa**, al comienzo de Mi lista y antes de Agregar producto. Aparece cuando hay productos pendientes, abre el mismo diálogo de selección/cantidad y conserva el acceso al final de la lista. Abrirlo no escribe stock ni gastos; los cambios requieren la confirmación existente. El funcionamiento de compras parciales, importes opcionales y reintentos no cambia.

El titular también pidió retirar el campo de subir foto al elegir un producto para la lista. Ese campo sólo adjuntaba una imagen opcional al producto. Se retira del formulario de Mi lista y se conserva en el alta propia de En casa. El reconocimiento pago continúa pausado. No se borran fotografías guardadas ni se modifican cantidades, precios o gastos por este ajuste.

Se comprueban el texto, la acción de abrir el diálogo y la ubicación del acceso anterior al alta mediante una regresión dirigida, junto a las pruebas existentes de confirmación y Worker de despensa: 14 aprobadas. Otros 4 controles del formulario verifican el alta sin foto en Mi lista, su conservación en En casa, la selección de variedad y la cancelación de consultas anteriores. En total: 18 controles dirigidos aprobados, 0 fallos y 0 omitidos; tipos, compilación y revisión del diff aprobados. La suite general de 335 corresponde al corte web 180; no se declara una nueva ejecución completa para este cambio de acceso y formulario.

La comprobación física del nuevo botón requiere actualizar la pantalla y abrir Mi lista. Después se debe recibir sólo 1 de las 3 unidades de Gallo, dejando el importe vacío: stock esperado 1, pendientes 2 y ningún gasto nuevo. La captura anterior de Lucchetti no sustituye este caso. La compacidad adicional del formulario sigue pendiente por indicación del titular, para después de terminar la prueba.

No se operó el teléfono ni se modificaron datos de producción durante esta revisión. La apariencia posterior aún requiere confirmación en Samsung; el navegador de control sigue sin una sesión reanudable disponible.
