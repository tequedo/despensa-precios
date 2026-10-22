# Dónde Rinde — comprobaciones para cerrar Android y lo legal

Corte: 22/10/2026, Argentina. Web 168, fuente
`753215f2075f8dfd41464b91fddf735a5fc69297`; Android 0.1.2/código 3,
paquete `ar.rindecasa.app`. Revisión de preparación: no es un dictamen ni una
declaración de cumplimiento integral. Conserva los 31 frentes y C1–C4 abiertos.

## Google Play comprobado en esta revisión

- Se ingresó a la cuenta existente y a la única app Dónde Rinde. Estado **Borrador**,
  **7 de 11** tareas completas. No se creó otra app ni se volvió a aceptar acuerdos.
- Clasificación de contenido, privacidad, anuncios, categoría/contacto, Gobierno,
  funciones financieras y salud figuran completos. IARC no es una decisión sobre
  dirigir la app a menores.
- Se reemplazó el ícono anterior por la casa/D azul con R naranja aprobada.
  `Donde_Rinde_Icono_Play_512.png`: 512×512, SHA-256
  `65b420d82f0ee3e7ad66807475aeb527249b46fefb721e2cb026e700e4096ab8`.
  Se guardó como borrador y se volvió a abrir la ficha para comprobar su persistencia.
- Siguen abiertos **Detalles de acceso**, **Público objetivo**, **Seguridad de los
  datos** y **Ficha de Play Store**, esta última por capturas faltantes.
- Detalles de acceso todavía no tiene respuesta ni cuenta dedicada comprobada.
  Público objetivo exige completar primero ese acceso. Propuesta previa: adultos;
  edades finales todavía sin guardar.
- Seguridad de los datos conserva recopilación **Sí**, creación **OAuth**, URL de
  eliminación de cuenta y solicitud de datos sin eliminar la cuenta. La respuesta
  universal de cifrado en tránsito está sin seleccionar. No se marcó una respuesta
  sin evidencia para habilitar el siguiente paso.
- No hay capturas de teléfono cargadas. La consola exige al menos dos. La prueba
  cerrada muestra **0 participantes adheridos**; exige 12 durante 14 días. No empezó
  ese período con las pruebas automáticas ni con los APK externos a Play.

## Firma y distribución

El AAB revisado tiene SHA-256
`e9a1b27830bd117bd6b02c1e637ff1a4315f18aec36ce7f6b7ee1864091f879d`.
[CI 39828245411](https://github.com/tequedo/despensa-precios/actions/runs/39828245411)
verificó compilación, licencias incluidas, firma con claves desechables y arranque
en emulador. El [PR20](https://github.com/tequedo/despensa-precios/pull/20) agrega el
asistente local; su estado de CI y merge debe leerse en el PR, no inferirse de este
documento. El procedimiento vigente es [FIRMA_DE_SUBIDA.md](FIRMA_DE_SUBIDA.md).

Faltan la clave real y el respaldo del titular, el AAB firmado y la huella real de
distribución de Play para Asset Links. El certificado de carga no sustituye al de
distribución. No se generó una clave del titular ni se firmó un AAB de producción
en este entorno. No se envió una versión a revisión o a producción.

## Evidencia que falta para adoptar los textos y enviar Seguridad de los datos

La fuente web vigente ya contiene información de privacidad, eliminación,
solicitudes, condiciones y licencias. La información pública conserva la advertencia
de piloto y revisión pendiente. La política cargada en Play no acredita que esos
pendientes estén cerrados.

| Frente | Preparado o comprobado | Comprobante que falta y acción concreta |
| --- | --- | --- |
| Identidad y atención | Responsable nombrado y formulario privado de solicitudes con seguimiento. | Definir el contacto operativo y el domicilio apropiado para el texto público; probar recepción, revisión y respuesta. Los datos privados ya recuperados no se copian al repositorio. |
| Base activa y conservación | Borrado transaccional, revocación y limpieza local; retención operativa de 90 días disparada por solicitudes. | Prueba operativa fechada y revisión de respaldos; definir duración de comprobantes, revocaciones y expedientes sin prometer caducidad de despensas. |
| Alojamiento/Sites/D1 | Código usa D1; documentación de D1 publica recuperación de 7 o 30 días según plan. | Identificar condiciones/plan efectivos, otras copias y destinos; comprobar restauración aislada con registro vigente de revocaciones. C3 sigue abierto. |
| OpenAI API | Interpretación con `store:false`; audio por Transcriptions cuando se elige ese método. | Confirmar controles de datos, contrato y usos independientes efectivos de la cuenta. No presentar `store:false` como retención cero ni asumir una aprobación ZDR. |
| Resend y buzón | Avisos futuros minimizados; documentación publica 30 días de mensajes/logs en Free/Pro/Scale y 7 de respaldo. | Confirmar plan, procedimiento de supresión y retención del buzón receptor; los mensajes ya entregados son copias separadas. |
| Google, voz y Georef | Google opcional; alternativas manuales al GPS y voz. Destinos propios identificados con HTTPS. | Identificar el proveedor/transporte efectivo de voz en Android y resolver su tratamiento, junto con el de coordenadas y logs de Georef. Falta la prueba del recorrido completo. |
| Recopilado/compartido | Matriz de categorías y finalidades preparada en la fuente web. | Resolver por recorrido las excepciones de proveedor/acción del usuario; no marcar «no compartimos» o «efímero» por una suposición global. |
| Materiales de terceros | Avisos de 53 coordenadas Android comprobados en el AAB; fotos externas sin derechos siguen suspendidas. | Completar los avisos web restantes y permisos/condiciones por fuente y uso. No reactivar fotos ni declarar convenios inexistentes. |
| Nombre/INPI | Nombre vigente Dónde Rinde; borrador y antecedentes conservados. Requisitos oficiales reconsultados el 22/10. | Recuperar el borrador y antecedentes actuales del nombre elegido; cotejar términos de clases 9/35/42 antes de firma/arancel. Informes pagados de RINDECASA no son de Dónde Rinde. Sin presentación o concesión nueva acreditadas. |
| Software/DNDA | Preparación histórica de obra y titularidad. Requisitos oficiales reconsultados el 22/10. | Confirmar autor/coordinador y aportes humanos, cesiones reales y copia completa del corte elegido, identificando web y Android. No adjudicar bibliotecas, datos o tipografía al titular. Sin presentación nueva acreditada. |

La información de proveedores consultada describe sus condiciones generales, no la
configuración contratada por este proyecto. La clasificación de transferencias y
la política final deben corresponder al servicio efectivo. No se enviaron consultas
a terceros, se aceptaron contratos, se efectuaron pagos ni se presentaron registros
durante esta revisión.

## SEPA y alcance de la pausa

El acceso/descarga directa se deja pendiente de la respuesta de SEPA, conforme a la
instrucción del titular. El PR20 separa la prueba real de acceso de los controles
automáticos de código: exige ejecución manual con opción explícita, desactivada
por defecto. Los procesos existentes de precios no se cambian por esta preparación.
La condición de reutilización de cada recurso sigue pendiente; no se la certifica
por haber obtenido un archivo ni por esperar una habilitación técnica.

## Fuentes primarias consultadas el 22/10/2026

- [Google Play: Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en), categorías, proveedores y responsabilidad de la declaración.
- [Google Play: datos del usuario](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en), política y eliminación.
- [AAIP: derechos y plazos](https://www.argentina.gob.ar/aaip/datospersonales/derechos).
- [Cloudflare D1: límites y recuperación](https://developers.cloudflare.com/d1/platform/limits/).
- [OpenAI API: controles de datos](https://developers.openai.com/api/docs/guides/your-data).
- [Resend: conservación](https://resend.com/security/gdpr).
- [INPI: registro de marca](https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca).
- [DNDA: software publicado](https://www.argentina.gob.ar/servicio/registrar-un-software-puesto-en-conocimiento-publico).
