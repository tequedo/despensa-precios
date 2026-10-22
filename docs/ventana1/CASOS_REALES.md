# Casos observados — 22/10/2026

Los importes siguientes son observaciones del conjunto SEPA recibido mediante réplica. No fueron comprobados en una góndola o factura independiente. Se conserva la fecha interna del 21/10; consultarlos el 22/10 no cambia esa fecha.

## Producto control y lectura en producción

Producto control: aceite Natura 1,5 L, código de barras `7790272001029`. El endpoint público de la versión 167 devolvió HTTP 200 y **12 cotizaciones**. Todas coincidieron con el snapshot en clave de producto, código de barras, sucursal, precio y fecha. Ninguna tenía promoción aplicada.

| Sucursal | Identificador | Precio observado | Fecha SEPA |
| --- | --- | --- | --- |
| HiperChangoMás San Juan | `11\|5\|1006` | $5.989 | 21/10/2026 |
| Carrefour San Juan | `10\|1\|123` | $5.990 | 21/10/2026 |
| Vea 48 Gral. Acha | `9\|1\|417` | $5.990 | 21/10/2026 |
| La Anónima | `2\|1\|381` | $6.150 | 21/10/2026 |
| ChangoMás San Juan Norte | `11\|2\|1092` | $7.469 | 21/10/2026 |

Son algunos renglones del control completo, no una recomendación de compra con traslado o beneficios personales. El informe completo está en `lectura-publica-2026-10-22.json`. Se hizo una lectura pública, sin credenciales de clientes ni cambios de preferencias. Se observó una cookie de protección de infraestructura `__cf_bm`; no se guardaron sus valores ni se observó una cookie de perfil de la app en el control de encabezados.

## Promoción SEPA que permanece informativa

En el snapshot base, Carrefour San Juan (`10|1|123`) informa yerba La Merced Campo Sur 1 kg, clave `sepa:10:1:7790387015447`, precio normal $6.979 y candidato promocional $4.990, con leyenda de vigencia hasta el 22/10. **No se lo descuenta**: falta la prueba independiente exacta y el exportador no transporta la identidad/presentación requeridas para corroborarla. No basta que el precio y la fecha parezcan razonables.

## Presentación contradictoria

Hay observaciones de Vea para Corona con nombre que indica 330 cc y presentación que declara 355 cc, bajo la misma referencia del origen. No se decidió cuál es correcta. El control de paquetes de la app no establece equivalencia automática para ese registro. Es un caso real para solicitar rectificación al proveedor y revisar identidad/presentación antes de un cruce de precios.

La auditoría offline de la base contiene 22.045 observaciones de 14 sucursales físicas de San Juan: 21.648 códigos con formato/checksum válido, 387 restringidos y 10 internos. **7.381 filas no producen evidencia suficiente de presentación con las reglas actuales**; no implica que todas sean erróneas, y no se borraron. El checksum del extracto y ejemplos constan en `productos-observados-2026-10-22.json`.

## Notificaciones y límites de la comprobación

La ejecución [39779739748](https://github.com/tequedo/despensa-precios/actions/runs/39779739748) terminó correctamente. Su control de producción registró 30 fuentes leídas por la app, una notificación de beneficio verificado y 249 candidatos pendientes; comprobó que los no verificados no entraban en la campanita. La notificación no demuestra que el usuario sea elegible ni que el beneficio se haya aplicado a una canasta.

No se consiguió una promoción por producto que complete todas las verificaciones para un caso positivo real. Los casos de cantidades 2x1/3x2/segunda unidad, ranking y separación de reintegros se prueban automáticamente con fixtures aisladas; eso acredita el código y no una oferta comercial actual. La consulta local independiente a Carrefour no pudo revalidar su contenido dinámico porque este entorno no dispone de Chromium. El resultado negativo local no reemplaza la revisión exitosa de GitHub ni renueva su fecha.
