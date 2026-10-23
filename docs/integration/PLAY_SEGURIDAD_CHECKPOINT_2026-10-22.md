# Seguridad de los datos: punto de reanudación

Corte: 22/10/2026, Argentina. Fuente revisada: web 170, commit `4924c5c3f8ea51f4314778e42c218305592d6c71`. Este documento es un registro técnico; no es una declaración presentada a Google ni una verificación de contratos.

## Actualización al retomar: acceso y guardado verificados

Se comprobó primero únicamente la URL de la pestaña conservada: `https://play.google.com`. La lectura normal posterior fue autorizada y tuvo éxito. Se observó el paso 4/5 con los mismos 16 tipos y **Se guardaron los cambios**, con Guardar borrador deshabilitado. El diálogo pendiente de ubicación se cerró mediante el control normal y la página siguió accesible. La captura de comprobación muestra el borrador guardado.

El bloqueo no se reproduce en esta sesión. No se cambiaron permisos, políticas, navegador, dominio ni credenciales. Esto comprueba que se pudo retomar; no demuestra ni promete una reparación permanente del mecanismo de revisión automática. Continúan pendientes las respuestas de uso/manejo y las condiciones de proveedores. No se envió la declaración.

## Registro de la interrupción anterior

Se avanzó del paso 3 al **paso 4 de 5, Uso y manejo de datos**. Las siete secciones mostraron 16 tipos seleccionados: 4 personales, 2 financieros, 2 de ubicación, 1 de fotos, 2 de rendimiento, 4 de actividad y 1 de identificadores. Ninguna finalidad individual se había completado.

Se pulsó **Guardar borrador** y el último resultado mostró **Enviando…**. No se llegó a observar el aviso final de guardado ni a reabrir el borrador. La persistencia de este avance debe comprobarse antes de dar el paso por terminado. El borrador anterior de nueve tipos sí había mostrado confirmación de guardado.

La siguiente lectura fue interrumpida. La captura aportada por el titular muestra que la revisión automática de ChatGPT rechazó el acceso a la sesión por dominio no verificado y riesgo alto, y terminó el turno. No se atribuye el rechazo a Google ni a un error de la app. El origen oficial observado antes fue `https://play.google.com`; ese antecedente no anula la revisión posterior. Se pausa la interacción bloqueada; no se usa otro navegador, dominio o acceso directo para sortearla.

## Matriz técnica para el paso 4

En todas estas filas existe recopilación según el código. **Compartido queda pendiente por recorrido y proveedor**: ni una respuesta universal negativa ni marcar todo como compartido sustituyen esa comprobación. No se declara tratamiento efímero sin verificar alojamiento y registros. Las finalidades siguientes están preparadas para revisión; todavía no están introducidas en Console.

| Tipo | Opcionalidad sustentada | Finalidades preparadas | Evidencia |
| --- | --- | --- | --- |
| Ubicación aproximada | Necesaria para comparar por localidad | Funcionalidades; análisis; publicidad o marketing en patrocinios | Localidad a APIs; país en accesos; anuncios por zona. |
| Ubicación precisa | Opcional, hay selección manual | Funcionalidades | GPS y consulta HTTPS a Georef; no se envía al módulo de patrocinios. |
| Nombre | Opcional respecto de la comparación pública | Funcionalidades; administración de cuenta | Google, perfil y solicitudes voluntarias. |
| Correo | Opcional respecto de la comparación pública | Funcionalidades; administración de cuenta | Identidad de Google y contacto voluntario. Verificar antes de añadir comunicaciones del desarrollador. |
| ID de usuario | Opcional respecto de la comparación pública | Funcionalidades; administración de cuenta; seguridad; análisis | Identidad verificada, aislamiento, revocación y actividad. |
| Otra información personal | Opcional | Funcionalidades; personalización | Preferencia de jubilado/pensionado: Sin informar/Sí/No. |
| Historial de compras | Opcional | Funcionalidades; personalización | Compras, importes, comercios, stock y reposición; sin procesamiento del pago. |
| Otra información financiera | Opcional | Funcionalidades; personalización | Preferencias heredadas de bancos, tarjetas y medios de pago que el servidor conserva para beneficios; no números de cuenta ni claves. |
| Fotos | Opcional | Funcionalidades | Imagen adjuntada manualmente al producto. El reconocimiento pago está pausado. |
| Interacciones en la app | Automática en los recorridos que la generan | Funcionalidades; análisis; publicidad o marketing en patrocinios | Acciones operativas y vistas de anuncios. |
| Historial de búsqueda en la app | Consulta necesaria para buscar; memoria opcional | Funcionalidades; personalización para memoria | API pública recibe consultas; desactivar memoria no convierte la búsqueda en local. |
| Otro contenido generado por usuarios | Opcional | Funcionalidades; seguridad para reportes/moderación | Listas, propuestas, solicitudes y reclamos. |
| Otras acciones | Opcional | Funcionalidades; personalización | Favoritos y preferencias de marcas, comercios y días. |
| Registros de fallas | Los propios requieren perfil; alcance del alojamiento pendiente | Análisis | `client_runtime_error` y `app_error` en `/api/activity`. |
| Diagnóstico | Los propios requieren perfil; alcance del alojamiento pendiente | Análisis | Etapa, estado técnico, cliente normalizado y errores de procesos. |
| Dispositivo u otros IDs | Necesarios en el acceso público | Funcionalidades; seguridad; análisis; publicidad o marketing en patrocinios | IP para límite temporal de acceso público, cookie de dispositivo y sesión de anuncios; no ID publicitario Android. |

No se seleccionaron audio, videos, contactos, calendario, apps instaladas, navegación web, calificación crediticia ni información de pago del usuario. La dirección de una sucursal y su contacto público no se clasificaron automáticamente como domicilio o teléfono personal del usuario: el formulario de propuesta pide información del comercio. Si cambia el propósito o se pide contacto personal por teléfono, revisar la clasificación.

## Evidencia que se conserva

- `db/schema.ts`: perfiles, compras, accesos y eventos.
- `app/api/activity/route.ts`, `app/app-activity.ts`, `app/notifications.ts`: eventos y errores.
- `components/search-memory.tsx`, `components/market-personal-tools.tsx`, `lib/shopping-tools.mjs`: memoria y preferencias.
- `lib/public-read-limit.ts`, `components/sponsored-placement.tsx`, `app/api/patrocinios/route.ts`: acceso público y patrocinios.
- `app/api/location/route.ts`: envío de coordenadas a Georef.
- `app/comercios/solicitud.tsx`, `app/api/feedback/route.ts`: solicitudes y avisos.
- `lib/data-retention.mjs`: mantenimiento operativo de 90 días; no elimina automáticamente despensas o cuentas inactivas.
- `lib/recognition-availability.mjs`, `components/product-entry-actions.tsx`: reconocimiento pago pausado y teclado conservado.
- Matriz previa: `docs/play/MATRIZ_DATOS_VERIFICADA_2026-10-21.md` en la fuente web. Audio/cifrado/Google de esa revisión histórica deben leerse con los cambios de web 170.

## Continuación concreta

1. Acceso y persistencia comprobados al retomar: paso 4/5, 16 tipos, confirmación de guardado. Mantener la comprobación de origen y los controles normales en próximas acciones.
2. Resolver el tratamiento y los posibles supuestos de exención por proveedor: Sites/Cloudflare, Resend y buzón, Google Identity, Georef y acciones voluntarias de compartir. OpenAI no recibe nuevas solicitudes por el alcance pausado; ello no demuestra eliminación de envíos históricos.
3. Introducir uso y manejo por tipo con evidencia; revisar opcionalidad y procesamiento no efímero.
4. Revisar la vista previa y su coherencia con privacidad, eliminación, app y paquete Android. No enviar una declaración incompleta ni certificar condiciones desconocidas.

El frente 24 conserva su estado pendiente de validación. No se subió un AAB ni se envió una versión o declaración a revisión. Los demás frentes continúan con sus límites; este registro evita perder el avance o contarlo como cierre.

Fuentes oficiales contrastadas el 22/10/2026: [Google, Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) y [OpenAI Docs, revisiones automáticas](https://learn.chatgpt.com/docs/agent-approvals-security).
