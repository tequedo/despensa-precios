# Seguridad de los datos: borrador completo y punto de reanudación

Corte: 22/10/2026, Argentina. Fuente publicada: web 171, commit `ae08b5cf6246830fd8ea81cb0080619f7a35f550`. Este registro no es una declaración enviada a Google ni certifica todos los contratos o la supresión externa.

## Resultado comprobado

Se completaron y guardaron **16/16 tipos**, con recopilación, compartido, finalidades, opcionalidad y tratamiento no efímero. Se avanzó a **paso 5/5, Vista previa**. La consola mostró «Se guardó el cambio. Envíalo a revisión en Descripción general de la publicación». Guardar y Guardar como borrador quedaron deshabilitados.

La vista previa exige completar **Público objetivo y contenido** antes de enviar. No se pulsó envío a revisión, no se subió AAB y no se publicó Android. La captura comprobó paso 5 y el aviso de guardado. La exportación CSV no se obtuvo: la espera terminó por timeout; no se considera una denegación de revisión automática ni evidencia de un archivo descargado.

## Matriz guardada en Console

Todas las filas: recopilado **Sí**, tratamiento efímero **No**. Las finalidades indicadas son de recopilación salvo la columna de compartido. «Seguridad» abrevia prevención de fraudes, seguridad y cumplimiento; «cuenta» abrevia administración de la cuenta.

| Tipo | Elección | Finalidades de recopilación | Compartido |
| --- | --- | --- | --- |
| Nombre | Opcional | Funcionalidades; cuenta | No |
| Dirección de correo electrónico | Opcional | Funcionalidades; cuenta | No |
| ID de usuario | Opcional | Funcionalidades; cuenta; seguridad; análisis | No |
| Otra información personal | Opcional | Funcionalidades; personalización | No |
| Historial de compras | Opcional | Funcionalidades; personalización | No |
| Otra información financiera | Opcional | Funcionalidades; personalización | No |
| Ubicación aproximada | Obligatoria | Funcionalidades; análisis; publicidad o marketing | No |
| Ubicación precisa | Opcional | Funcionalidades | Sí; funcionalidades (Georef) |
| Fotos | Opcional | Funcionalidades | No |
| Registros de fallas | Obligatoria | Análisis | No |
| Diagnóstico | Obligatoria | Análisis | No |
| Interacciones en la app | Obligatoria | Funcionalidades; análisis; publicidad o marketing | No |
| Historial de búsqueda en la app | Obligatoria al buscar en servidor | Funcionalidades; personalización (memoria opcional) | No |
| Otro contenido generado por usuarios | Opcional | Funcionalidades; seguridad | No |
| Otras acciones | Opcional | Funcionalidades; personalización | No |
| Dispositivo u otros IDs | Obligatoria | Funcionalidades; seguridad; análisis; publicidad o marketing; cuenta | Sí; funcionalidades y seguridad (conexión de Google Identity) |

La comparación pública permite prescindir de cuenta, fotos, GPS y herramientas privadas. La obligatoriedad de registros técnicos se sustenta en la configuración publicada del alojamiento (`observability.enabled=true`, sin desactivación de registros de invocación ni opt-out de la app). No se deduce únicamente de los eventos de perfiles.

No se seleccionaron audio, videos, contactos, calendario, apps instaladas, navegación web, calificación crediticia ni información de pago del usuario. Las preferencias financieras son bancos/tarjetas/medios elegidos para ordenar beneficios; no números de tarjeta ni cuentas bancarias. Las fotos corresponden al adjunto manual opcional; el reconocimiento pago sigue pausado y las rutas bloqueadas.

## Comprobaciones que sustentan las respuestas

- Sites: el DPA público para ChatGPT Sites incluye datos alojados, registros, uso y cookies, bajo instrucciones del titular. Se distinguió ese alojamiento del uso de ChatGPT para desarrollar. No se extendió esa excepción a todos los proveedores.
- Resend: el DPA distingue tratamiento de contenido por cuenta del cliente de sus propios datos de cuenta/uso del servicio. El resumen por correo ya no enumera nombres de usuarios.
- Google: la identidad voluntaria por SSO se distinguió de los datos técnicos de conexión. Mi cuenta carga el script de Google antes de pulsar Ingresar; por eso los IDs técnicos se declaran compartidos para funcionalidad/seguridad, sin atribuir a Google publicidad no demostrada.
- Georef: la ruta envía coordenadas precisas para resolver ubicación. No se acreditó rol de encargado ni aviso suficiente para una exención; se declaró compartido. Hay alternativa manual.
- Compras y preferencias: `replenishment(items,purchases,days)` usa compras para sugerir reposición. La API de canasta y el catálogo priorizan bancos/tarjetas/medios elegidos. Sustentan personalización.
- Listas compartidas: requieren aceptación explícita de las condiciones antes del enlace. No se declaró toda lista pública por defecto.
- El mantenimiento operativo de 90 días es distinto de la retención de registros/copias del alojamiento. No acredita eliminación de correos o copias históricas.

## Corrección publicada y validación

Web **171** elimina la consulta y enumeración de nombres en el resumen diario, conservando conteos de perfiles y reingresos. La prueba nueva falló antes de la corrección y después comprobó 2 perfiles/3 reingresos sin identidades, con registros conservados y sin envío duplicado. No elimina correos históricos.

Validación: **299 pruebas web aprobadas, 0 fallos, 0 omitidas**; 19 pruebas específicas de notificaciones, TypeScript y compilación aprobados. Solo transporte de correo simulado: 0 correos reales y 0 llamadas a reconocimiento pago. La privacidad publicada aclara roles del alojamiento, registros y conexión técnica de Google.

## Registro de las interrupciones

La revisión automática de ChatGPT había interrumpido una lectura por origen no verificado/riesgo alto según la captura del titular. Se comprobó únicamente la URL oficial `https://play.google.com`; la lectura normal de la misma sesión fue permitida y se verificó el borrador. No se cambiaron políticas, permisos, dominio, navegador ni credenciales.

Después se rechazó un guardado por falta de respaldo de «Personalización» en compras y preferencias financieras. Se detuvo esa acción, se cotejaron los recorridos de reposición y beneficios con la definición oficial y se reanudaron los guardados normales con esa evidencia. Los dos se permitieron y las 16 filas quedaron guardadas. No se afirma una reparación permanente del mecanismo automático ni se atribuye la interrupción a Google.

## Continuación concreta

1. Completar público objetivo/contenido y sus dependencias con respuestas verificadas. El acceso dedicado de revisión sigue pendiente; no usar la cuenta personal del titular.
2. Cotejar nuevamente la vista previa con privacidad, eliminación y el paquete que efectivamente se vaya a presentar antes de un envío final.
3. Mantener pendientes firma/certificado real, capturas de teléfono, pruebas físicas y prueba cerrada. El borrador de datos completo no sustituye esos requisitos.

El frente 24 mantiene su estado pendiente de validación, aunque la subtarea de las 16 filas ya quedó completa y guardada. Los 31 frentes conservan sus criterios completos.

Fuentes oficiales contrastadas el 22/10/2026:

- [Google: Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
- [ChatGPT Sites: DPA](https://openai.com/policies/chatgpt-sites-data-processing-addendum/) y [términos](https://openai.com/policies/chatgpt-sites-terms/).
- [Resend: DPA](https://resend.com/legal/dpa).
- [Google Identity: descripción](https://developers.google.com/identity/gsi/web/guides/overview).
- [Cloudflare: Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).
- [OpenAI: revisiones automáticas](https://learn.chatgpt.com/docs/agent-approvals-security).
