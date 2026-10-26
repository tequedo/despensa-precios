# Comparador Natura: corrección del caso informado desde Samsung

El 26 de octubre el titular confirmó que la aplicación independiente **Dónde Rinde Prueba Nueva 0.1.2** se instala y abre en su Samsung. Sus capturas posteriores mostraron un bloqueo al consultar **aceite de girasol Natura de 1,5 L** en San Juan: el formulario indicaba que el producto estaba completo y la respuesta pedía una selección exacta que la pantalla no ofrecía.

## Causa y comportamiento corregido

La consulta general por girasol también encontraba **ACEITE MEZCLA GIRASOL- OLIVA, NATURA, 1500 cm3**, un código diferente. El control de identidad evitaba combinar sus precios con los del girasol. Se conserva ese control y se corrigen dos pasos:

- Las búsquedas específicas de girasol u oliva excluyen los aceites mezcla. Las búsquedas generales de aceite conservan ambos tipos.
- Una respuesta ambigua ahora contiene hasta 30 productos concretos, agrupados sólo cuando la identidad es compatible en ambos sentidos. La pantalla ofrece botones para elegir y comparar el artículo exacto. Si hay más de 30, permite abrir el catálogo completo con los filtros actuales.
- La selección actualiza marca, tamaño y código antes de enviar la nueva comparación. Las peticiones anteriores se cancelan al cambiar los campos.
- La ayuda distingue los datos del formulario completos de la selección exacta todavía pendiente.

## Reproducción con datos reales

Se usó la misma copia de San Juan ya verificada, generada el 25 de octubre, con alcance de 12 sucursales y radio de 50 km desde el centro público de San Juan.

| Comprobación | Antes | Después |
| --- | --- | --- |
| Coincidencias para girasol Natura 1,5 L | 13: girasol y una mezcla | 12 de girasol |
| Cotizaciones devueltas | 0, bloqueo ambiguo | 12 sucursales |
| Código del girasol | `7790272001029` | `7790272001029` |
| Menor precio de la copia utilizada | No se mostraba | ARS 5.989 |
| Fecha de los precios | 25/10/2026 | 25/10/2026 |

El producto mezcla real, código `7790272000053`, se incorporó a la prueba de regresión conservando su descripción, tamaño, sucursal y precio originales. La fixture pasa de 103 a 104 observaciones.

## Validación y límites

- 44 pruebas específicas aprobadas: separación de aceites, selección exacta, paginación y renderizado del selector, además de los casos previos de identidad y presentaciones.
- Suite completa: **326 aprobadas, 0 fallidas, 0 omitidas**.
- TypeScript: aprobado.
- Se conserva el bloqueo de Original/Light, envases contradictorios y productos sin identidad compatible. Elegir un producto no modifica precios ni fechas de la fuente.
- El navegador de esta sesión no pudo reanudarse; el nuevo selector tiene verificación de renderizado estático y de su contrato con la API. Falta comprobar la interacción completa en el Samsung.

La corrección corresponde a la web que abre el APK; no se modifica ni reconstruye el paquete Android. La prueba física de comparación queda pendiente de repetición por el titular. El punto 10 sigue abierto para el resto del recorrido y el segundo teléfono.
