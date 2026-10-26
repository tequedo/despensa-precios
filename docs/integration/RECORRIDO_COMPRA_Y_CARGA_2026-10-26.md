# Carga inicial, comparación de la lista y registro de lo comprado

Base de la revisión: web 181, fuente `b736f2c3b06eb6eb01512eb233686d0e0c5772eb`. Cambios solicitados por el titular el 26/10/2026 tras la prueba Samsung.

## En casa: varios productos y un cierre visible

La carga manual permite guardar un producto y continuar con el siguiente mediante **Guardar y agregar otro**. Tras el guardado confirmado, se muestra un aviso y un formulario limpio. **Finalizar carga** cierra la sesión de carga; si hay un producto completo en pantalla, lo guarda primero y sólo cierra después del éxito. Si falla, conserva el formulario y muestra el error. El formulario vacío también ofrece un cierre explícito.

Cada guardado usa la operación de despensa existente, sus comprobantes y la comprobación del perfil activo. No se introduce una transacción única para toda una sesión: los productos guardados anteriormente permanecen guardados si falla el último. Una carga inicial de existencias no fabrica compras, precios pagados o gastos.

## Mi lista: comparar todo y después registrar lo comprado

Se retira el acceso grande «Pasar a En casa» anterior a los productos. **Comparar lista** abre la comparación de la lista completa tanto con un producto como con varios. La sección principal consulta automáticamente el endpoint de canasta, con las cantidades reales y las promociones/beneficios admitidos. El usuario puede revisar sus preferencias y condiciones y aplicar un beneficio, lo que vuelve a calcular el total.

Se prioriza el menor total completo por comercio/sucursal, no el supermercado que tenga un solo producto más barato. El cálculo de canasta y sus controles de identidad se mantienen. La regresión específica contrasta un comercio con precios 1 y 100 (total 101) con otro que cobra 20 y 20 (total 40); la lista completa recomienda el segundo. Es un ejemplo ficticio de ensayo.

Las condiciones dudosas no se descuentan y un reintegro posterior permanece separado del desembolso. Si faltan precios, se informa que no hay un ganador de la lista completa. Los totales sin beneficios personales se conservan como detalle adicional.

**Ya compré** es una acción pequeña al final de la consulta, una vez terminada la espera de la comparación, y se oculta durante un nuevo cálculo. Permite registrar una compra real también cuando la consulta es incompleta o no puede recomendar un ganador; esa limitación sigue visible. No inicia un pago ni una compra a un comercio. Abre **Registrar lo que compraste** para revisar productos y cantidades y confirmar lo comprado. Sólo esa confirmación usa la operación existente para actualizar En casa y dejar pendientes las cantidades no adquiridas. Los importes opcionales conservan su regla: sólo los ingresados se registran en Gastos.

La sección de herramientas conserva guardar/copiar/compartir listas; su antiguo acceso inferior a «Pasar a En casa» se retira para mantener un único lugar coherente para registrar la compra.

## Tarjetas de Mi lista

Se reducen rellenos, separaciones e imagen de referencia. Cantidad, comparación individual y quitar de la lista comparten una fila. Se conservan nombre completo, marca, tamaño, tipo, stock mostrado, importe, comercio/sucursal/localidad, fechas, referencia por unidad y subtotal cuando corresponda. Las acciones mantienen 44 píxeles CSS de tamaño táctil mínimo y la disposición vuelve a varias filas si el ancho resulta insuficiente. No se introducen recortes de texto ni límites de altura.

El objetivo solicitado es aproximadamente tres tarjetas al recorrer una pantalla del Samsung con el tamaño de texto habitual. El número exacto depende del texto, las advertencias, el ancho y la ampliación: no está medido en el teléfono después del cambio. La revisión visual independiente sigue sin estar disponible por el estado de credenciales del navegador de control.

## Evidencia y límites

Siete controles específicos prueban continuidad de carga, guardado del último producto al finalizar, conservación ante error, cierre vacío, posición/acción de Ya compré, recálculo antes de confirmar y prioridad del total completo. La suite completa añade esas regresiones a los controles anteriores de cantidades, compras, identidad, sesiones, gastos y restauración. Tipos y compilación se verifican sobre el nuevo corte.

| Control | Resultado |
| --- | --- |
| Controles específicos del recorrido | 7 aprobados; 0 fallos; 0 omitidos |
| Suite completa | 344 aprobadas; 0 fallos; 0 omitidas; 0 canceladas |
| TypeScript, compilación y revisión del diff | Aprobados |
| Inventario legal previo a compilar | 879 entradas, 5 archivos de marca y 7 componentes suplementarios coherentes; permisos de distribución pendientes según su matriz |

La captura del titular muestra el acceso de web 181 y un mensaje de compra confirmada de esa versión. No muestra las cantidades finales del Gallo original ni permite confirmar el caso físico exacto de 3 solicitadas, 1 recibida y 2 pendientes. Ese caso y el segundo dispositivo conservan su verificación pendiente. Este cambio no opera el teléfono ni escribe datos privados de producción.
