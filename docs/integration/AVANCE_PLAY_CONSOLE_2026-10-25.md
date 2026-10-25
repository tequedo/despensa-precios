# Dónde Rinde — avance de acceso y Play Console

Fecha de comprobación: **25/10/2026**, America/Argentina/Buenos_Aires. Alcance: navegador web alojado y consola existente de `ar.rindecasa.app`. No acredita publicación Android, aprobación de Google ni cierre integral de los 31 frentes.

## Versión y alcance

Se confirmó con Sites que la web activa sigue en la versión **172**, fuente `dbfc57ed1916ed21e4f925dda5c8044479679cf3`. Esta sesión no cambió código ni publicó otra versión. Los cambios operativos se limitaron al perfil de revisión y a metadatos de Play Console.

## Acceso dedicado comprobado

El titular creó una identidad Google exclusiva y escribió su contraseña directamente en Play Console. Se comprobó el correo de la identidad desde la pantalla de cuenta de la app, sin copiar aquí el identificador ni leer la contraseña. La cuenta personal del titular sigue excluida de las credenciales de revisión.

La consola mostró **Se guardó el cambio** para el conjunto Dedicated reviewer account. Después de probar una sesión cerrada se corrigieron sus instrucciones: la entrada pública real es **Mi cuenta opcional > Continuar con Google**; el recorrido por Opciones corresponde a una despensa ya abierta. La corrección de instrucciones, de 451 caracteres, también mostró confirmación de guardado. Se conservaron los campos de credenciales existentes y no se leyeron sus valores.

| Comprobación web | Resultado observado |
| --- | --- |
| Acceso con la identidad dedicada | La app mostró la identidad Google correcta y su despensa de prueba vinculada. |
| Localidad manual | San Juan / Capital seleccionado sin pedir GPS. |
| Consulta de precios | Arroz Gallo de 1 kg: 12 sucursales consultadas; 4 con precio. Las fichas conservaron fechas del 23 y 24/10/2026; no se presentaron como precios originados el 25/10. |
| Lista y compra parcial | Se agregaron 3 unidades a la lista de prueba; al pasar 1 a En casa quedaron 2 pendientes y 1 disponible. |
| Gastos de la prueba | El importe se dejó vacío. Después de recuperar la sesión, Gastos mostró 0 compras registradas y total $0. No se hizo una compra ni un pago real. |
| Cierre e ingreso nuevo en la app | Se cerró la sesión propia de la app, se eligió la cuenta dedicada mediante el selector seguro de Google y se recuperó la misma despensa, con 1 unidad en casa y 2 pendientes. |

El ingreso reutilizó una sesión Google ya existente en este navegador. **No prueba credenciales desde una sesión Google vacía, desde un segundo dispositivo ni ausencia universal de desafíos de Google.** La localidad debe poder elegirse manualmente en cada acceso; no se declara persistencia geográfica entre dispositivos. No se borró la cuenta ni se acreditó borrado y recreación desde Android.

## Público objetivo y panel

Se guardaron **13–15, 16–17 y mayores de 18 años**. El titular indicó conservar el alcance actual de la app si incluir grupos menores exigía ampliarlo; se retiró 9–12 y no se seleccionó 6–8. Esto no certifica cumplimiento de todas las reglas locales para adolescentes.

El panel confirmó **9 de 11 tareas iniciales completadas**, incluidos acceso y público objetivo. Las pendientes son Seguridad de los datos y la ficha de Play Store. Este recuento no es el de los 31 frentes del proyecto.

## Seguridad de los datos: vista previa revisada, guardado final bloqueado

Se recorrieron los cinco pasos del borrador existente y se observaron **16 de 16 tipos completados**. Las categorías actuales excluyen audio. La fuente publicada mantiene `PAID_RECOGNITION_ENABLED = false` y ambos POST de reconocimiento devuelven la respuesta de pausa antes de procesar la carga o llamar al proveedor. Las fotos manuales adjuntas a productos siguen siendo una función distinta y opcional.

La vista previa observada contiene:

| Dato recopilado | Elección del usuario | Finalidad declarada |
| --- | --- | --- |
| Nombre | Opcional | Funciones; administración de cuenta |
| Correo electrónico | Opcional | Funciones; administración de cuenta |
| ID de usuario | Opcional | Funciones; estadísticas; seguridad; administración de cuenta |
| Otra información personal | Opcional | Funciones; personalización |
| Historial de compras | Opcional | Funciones; personalización |
| Otra información financiera (preferencias de beneficios) | Opcional | Funciones; personalización |
| Ubicación aproximada | Requerida | Funciones; estadísticas; publicidad contextual |
| Ubicación precisa | Opcional | Funciones |
| Fotos adjuntadas manualmente | Opcional | Funciones |
| Registros de fallas | Requeridos | Estadísticas |
| Diagnóstico | Requerido | Estadísticas |
| Interacciones en la app | Requeridas | Funciones; estadísticas; publicidad contextual |
| Historial de búsqueda en la app | Requerido | Funciones; personalización |
| Otro contenido generado por usuarios | Opcional | Funciones; seguridad |
| Otras acciones | Opcional | Funciones; personalización |
| Dispositivo u otros IDs | Requeridos | Funciones; estadísticas; seguridad; publicidad contextual; administración de cuenta |

Datos compartidos declarados: **ubicación precisa**, para funciones; **dispositivo u otros IDs**, para funciones y seguridad. El borrador no usa una declaración global de procesamiento efímero. Los campos de eliminación permiten solicitar borrado de la cuenta o de otros datos; no certifican supresión de todos los respaldos y proveedores.

La respuesta existente de cifrado en tránsito es **Sí**. La revisión de fuente observó llamadas del cliente al mismo origen HTTPS y destinos HTTPS para Google, Georef, correo y datos de precios; el reconocimiento está pausado. La definición consultada de Google se refiere al transporte entre dispositivo y servidor de la app. Esto no constituye una auditoría independiente, cifrado de extremo a extremo ni validación del paquete Android final.

Al intentar Guardar, la **revisión automática rechazó la acción**: señaló respuestas no confirmadas, como cifrado universal y datos compartidos, y falta de aprobación del titular para ese contenido exacto. No se reintentó ni se evitó ese rechazo. El borrador anterior se conserva; falta autorización específica y resolver la verificación requerida antes de afirmar guardado final. No se envió a revisión.

## Ficha de la tienda

Se reabrió y leyó la ficha es-419: nombre Dónde Rinde, descripción breve de 68 caracteres y completa de 1.726; describen carga manual, inventario, compras parciales, gastos registrados y precios disponibles con fecha y fuente. No anuncian reconocimiento por voz/foto activo. El ícono de 512 px y el gráfico de funciones ya están cargados. No fue necesario cambiar el texto.

**No hay capturas de teléfono cargadas.** La consola exige entre 2 y 8. Las capturas se mantienen pendientes del paquete y recorrido Android que efectivamente se presentarán; no se sustituyeron por imágenes antiguas de emulador o maquetas.

## Límites y próximos cierres

- Frente 23: identidad dedicada implementada y validada en el alcance web descrito; falta otra sesión/dispositivo, Android firmado y borrado/recreación con datos descartables.
- Frente 24: 9/11 tareas iniciales; guardado final de Seguridad de los datos bloqueado por revisión automática y ficha pendiente de capturas.
- Firma de producción, AAB, asociación de certificados y pruebas físicas mantienen su estado previo. No se subió una versión a Play.
- La prueba cerrada continúa con 0 participantes observados; no se acredita el requisito de 12 participantes durante 14 días.
- Los bloqueos de conservación, restauración y proveedores de los frentes 15–17 siguen abiertos. Este formulario no los cierra.

Fuente primaria para las definiciones: [Google Play — Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en). Requisitos para públicos infantiles: [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en&ref_topic=9877766).


## Prueba adicional del gasto confirmado

Después de la primera prueba sin importe, se verificó el flujo con un dato ficticio de **$1 ARS**, exclusivamente en la cuenta dedicada. Desde las 2 unidades pendientes se eligió 1, se escribió el importe y el comercio **PRUEBA — sin compra real**, y se confirmó con Agregar a En casa. La app mostró 2 unidades disponibles y 1 pendiente. Gastos pasó de 0 a **1 compra registrada**, total $1, con ese nombre de comercio. No hubo pago ni compra real y el catálogo público no fue modificado. El estado final de esta fixture es 2 en casa, 1 pendiente y un importe ficticio registrado de $1.

La confirmación ya existe en la interfaz como Pasar a En casa; el gasto usa el importe ingresado por el usuario y no el estimado del catálogo. Cuando se ingresa un importe, el campo Comercio pasa a ser obligatorio. No fue necesario agregar otra función para comprobar este comportamiento.
