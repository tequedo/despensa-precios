# Dónde Rinde — avance de acceso y Play Console

Fecha de comprobación: **25/10/2026**, America/Argentina/Buenos_Aires. Alcance: navegador web alojado y consola existente de `ar.rindecasa.app`. No acredita publicación Android, aprobación de Google ni cierre integral de los 31 frentes.

## Versión y alcance

Las pruebas funcionales de acceso y gastos se hicieron sobre la web **172**, fuente `dbfc57ed1916ed21e4f925dda5c8044479679cf3`. Después se publicó la web **173**, fuente `e9a8ae902a02631b11ecce363058a5e7775b7d0f`, con un único archivo nuevo: `public/.well-known/assetlinks.json`. La lógica de cuenta, despensa, gastos y reconocimiento no cambió. Sites confirmó la publicación de la versión 173.

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

Después de la aprobación específica del titular y del guardado final de Seguridad de los datos, el panel confirmó **10 de 11 tareas iniciales completadas**, incluidos acceso, público objetivo y Seguridad de los datos. La única tarea inicial pendiente es la ficha de Play Store. Este recuento no es el de los 31 frentes del proyecto.

## Seguridad de los datos: guardado final confirmado

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

Al intentar Guardar, la **revisión automática rechazó la acción**: señaló respuestas no confirmadas, como cifrado universal y datos compartidos, y falta de aprobación del titular para ese contenido exacto. No se evitó ese rechazo. Se presentó al titular la declaración exacta y su detalle; tras su aprobación expresa se realizó un segundo Guardar normal, que fue aceptado. La consola mostró **Se guardó el cambio** y el panel pasó a **10/11**, con Seguridad de los datos completada. La resolución corresponde a esta acción aprobada, no a una eliminación general de los controles de revisión. No se envió la app a revisión.

## Ficha de la tienda

Se reabrió y leyó la ficha es-419: nombre Dónde Rinde, descripción breve de 68 caracteres y completa de 1.726; describen carga manual, inventario, compras parciales, gastos registrados y precios disponibles con fecha y fuente. No anuncian reconocimiento por voz/foto activo. El ícono de 512 px y el gráfico de funciones ya están cargados. No fue necesario cambiar el texto.

**No hay capturas de teléfono cargadas.** La consola exige entre 2 y 8. Las capturas se mantienen pendientes del paquete y recorrido Android que efectivamente se presentarán; no se sustituyeron por imágenes antiguas de emulador o maquetas.

## Límites y próximos cierres

- Frente 23: identidad dedicada implementada y validada en el alcance web descrito; falta otra sesión/dispositivo, Android firmado y borrado/recreación con datos descartables.
- Frente 24: 10/11 tareas iniciales; Seguridad de los datos guardada tras aprobación específica del titular y ficha pendiente de capturas.
- El AAB sigue sin firma del titular y no se subió una versión Android a Play. La asociación pública de certificados sí quedó publicada en web 173 y comprobada por el verificador oficial de Google; la TWA y los recorridos físicos siguen pendientes.
- La prueba cerrada continúa con 0 participantes observados; no se acredita el requisito de 12 participantes durante 14 días.
- Los bloqueos de conservación, restauración y proveedores de los frentes 15–17 siguen abiertos. Este formulario no los cierra.

Fuente primaria para las definiciones: [Google Play — Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en). Requisitos para públicos infantiles: [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en&ref_topic=9877766).


## Prueba adicional del gasto confirmado

Después de la primera prueba sin importe, se verificó el flujo con un dato ficticio de **$1 ARS**, exclusivamente en la cuenta dedicada. Desde las 2 unidades pendientes se eligió 1, se escribió el importe y el comercio **PRUEBA — sin compra real**, y se confirmó con Agregar a En casa. La app mostró 2 unidades disponibles y 1 pendiente. Gastos pasó de 0 a **1 compra registrada**, total $1, con ese nombre de comercio. No hubo pago ni compra real y el catálogo público no fue modificado. El estado final de esta fixture es 2 en casa, 1 pendiente y un importe ficticio registrado de $1.

La confirmación ya existe en la interfaz como Pasar a En casa; el gasto usa el importe ingresado por el usuario y no el estimado del catálogo. Cuando se ingresa un importe, el campo Comercio pasa a ser obligatorio. No fue necesario agregar otra función para comprobar este comportamiento.

## Asociación Android publicada y comprobada

Se consultó la pantalla **Protegido con Play > Firma de apps** de la app existente. Se conservó el paquete `ar.rindecasa.app`. El fragmento JSON de Digital Asset Links mostró la huella de distribución en uso y la acción **Copiar todas las huellas digitales SHA-256 del certificado** devolvió tres huellas públicas de Play:

```text
0A:F6:EF:2E:F6:10:7E:CE:B4:5D:89:CC:FF:57:B5:B6:AA:BD:71:0F:03:75:C5:87:25:37:63:5A:3A:6D:74:45
2D:BB:6C:15:0D:7B:18:7F:5F:E2:43:74:1F:91:9F:CF:83:BB:7D:73:5E:8A:47:9A:AB:75:04:FB:3F:4B:64:B0
FC:63:5B:DC:AF:64:DD:2F:1E:CC:4A:1A:19:5C:14:51:97:A9:82:A9:94:91:FA:3C:DB:E1:FF:BA:9F:4C:A7:C1
```

Se publicaron esas huellas en [assetlinks.json](https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site/.well-known/assetlinks.json), únicamente para la relación `delegate_permission/common.handle_all_urls` y el paquete de publicación. No se agregó una relación para compartir contraseñas. No se publicaron certificados de prueba ni claves privadas.

- Fuente web: `e9a8ae902a02631b11ecce363058a5e7775b7d0f`, versión **173**.
- Publicación Sites: `appgdep_6add8368fef88191bb3adf6e40176fcb`, estado **succeeded**.
- SHA-256 del archivo en la fuente y en el build: `d15a0a47f55dc824f31ea7f24a12b99e94f86d7f9f0cfb880b2b9c65dd91284a`.
- Build y comprobación del JSON, paquete, formato de tres huellas y copia exacta en `dist/client`: aprobados. El control legal previo del build también pasó.
- El manifiesto release del artefacto Android revisado declaró `ar.rindecasa.app`, versión 0.1.2/código 3 y el mismo origen HTTPS.
- La navegación al archivo publicado mostró el JSON esperado.
- En [el verificador oficial de Google](https://developers.google.com/digital-asset-links/tools/generator), se eligió Deep Linking y se probaron el origen, el paquete y la primera huella. La herramienta confirmó que el host concede el manejo de vínculos a `ar.rindecasa.app`. Las otras dos huellas se copiaron de Play, sin prueba remota individual adicional.
- La petición anónima con urllib desde el ejecutor devolvió HTTP 403 y `error code: 1010`. No se estableció su causa ni se cambiaron protecciones. La navegación y la comprobación oficial de Google sí funcionaron. No se afirma una medición HTTP anónima propia de tipo de contenido o ausencia de redirecciones.
- Falta verificar en el Android final que la TWA valide el dominio y no muestre una barra de navegador inesperada. La confirmación del verificador no acredita esa instalación.

El frente 22 pasa de dependencia bloqueada a **implementado pendiente de validar**. Los 31 frentes originales quedan: **0 cerrados integralmente, 16 implementados pendientes de validar, 12 bloqueados y 3 posteriores**. El frente adicional de difusión sigue separado.

## Kit de firma listo para el equipo del titular

Se recuperó el artefacto **12446594671** de CI **39828245411**. Su ZIP coincide con SHA-256 `682f7541f1d5afe8c7fac5562e004d673bf406eb050a27511e54d169ac1aac42`. El AAB 0.1.2/código 3 coincide con `e9a1b27830bd117bd6b02c1e637ff1a4315f18aec36ce7f6b7ee1864091f879d`; la función original `checked_bundle` comprobó el hash, el paquete y la ausencia de firma previa.

Se entregó `Donde_Rinde_0.1.2_kit_de_firma.zip` (3.500.139 bytes), SHA-256 `58af0c62aed4e7f465643612d07ae1581fd4750ff2d92354b5cdd4a9a4f1d7e4`. Contiene el AAB, seis archivos originales del asistente de firma fijados a `db521195b9edcb1587958ab9d1d25dc16c5ac422`, lanzadores de raíz que seleccionan el AAB correcto, instrucciones y evidencias. Se cotejaron los seis blobs Git, la sintaxis Python, el contenido del ZIP y sus sumas. No contiene APK, claves privadas ni contraseñas.

La ejecución `--check-only` se detuvo por faltar un JDK completo en este ejecutor: faltan `javac` y `jarsigner`. No se declara aprobado ese preflight completo ni una firma nueva. El asistente original mantiene las **25 pruebas aprobadas en CI** ya registradas. El titular debe ejecutar el kit con Python 3.11+ y JDK 17 en su computadora según [el procedimiento existente](../play/FIRMA_DE_SUBIDA.md), conservar clave y respaldo, y compartir sólo AAB firmado, informe `.verification.json` y certificado público.

Los APK del artefacto resultaron ser `ar.rindecasa.app.preview` (0.1.2-prueba) y `ar.rindecasa.app.preview012` (0.1.2-prueba-independiente). No se confundieron con la app de publicación ni se subieron a su ficha. Se leyeron las condiciones de Uso compartido interno de apps y se canceló el diálogo: no se aceptó ese acuerdo nuevo, no se habilitó el servicio y no se compartió ningún APK.

La copia técnica legal de web 172 sigue siendo una evidencia histórica verificada. Desde la incorporación de `assetlinks.json` en web 173 ya no representa exactamente la fuente publicada más reciente; debe actualizarse antes de un eventual depósito. No hubo presentación registral.

## Actualización posterior de la copia técnica DNDA

El 25/10 se completó la actualización que había quedado indicada en este informe: [`COPIA_DNDA_2026-10-25.json`](COPIA_DNDA_2026-10-25.json) identifica el paquete para web **173**, con **491 archivos web y 24 Android**. Los 490 archivos web anteriores conservan contenido y modo; la única incorporación es `public/.well-known/assetlinks.json`. Se cotejaron los blobs Git, tamaños, huellas y modos de cada componente. El ZIP Android se conservó idéntico y también se verificó contra el árbol actual del proyecto. La copia coincide con el corte publicado y sustituye a la de web 172 como material técnico vigente. Conserva su historial de versiones.

El expediente preparatorio y el estado único remiten al corte actualizado. No se inició ni presentó el depósito DNDA, no se certificó autoría ni se realizó un pago. Los datos jurídicos, la base de la tasa y el formato de depósito siguen pendientes. No hubo cambio de código ni nueva publicación web durante esta actualización documental.
