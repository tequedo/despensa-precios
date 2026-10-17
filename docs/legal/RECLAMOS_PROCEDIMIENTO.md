# RINDECASA — procedimiento de solicitudes y reclamos

Preparado el 10/10/2026. Responsable operativo que debe revisar el panel: titular del proyecto. No hay equipo de atención adicional documentado, aviso automático al titular ni correos automáticos al solicitante en este canal.

## Entrada y seguimiento

Rutas públicas: `/legal/solicitudes`, `/legal/eliminar-cuenta`. Panel privado: `/admin/legal`. Tipos: acceso, rectificación, eliminación, derechos de autor/marca, usuario y anunciante. Se registra finalidad y versión del consentimiento, fecha de recepción y origen de control del perfil cuando está disponible. El consentimiento sólo cubre gestionar el caso; no habilita marketing.

El recibo usa un secreto independiente del identificador. Sólo se almacena su hash. El enlace privado lleva el secreto en el fragmento; la consulta lo envía en el cuerpo, con respuesta no cacheable y sin referencias privadas del perfil. El enlace permite leer el reclamo y la respuesta: debe protegerse como una credencial. No es prueba de identidad para acceder a todos los datos de una cuenta.

El correo escrito no se valida como propiedad de una cuenta. Evitar DNI, contraseñas, datos médicos y contratos completos. Recibir el reclamo no valida titularidad, no retira automáticamente contenidos, no aprueba indemnización ni completa eliminación.

## Tramitación

1. Revisar el panel y registrar la respuesta inicial. Priorizar datos personales, exposición de terceros o posible contenido sin permiso. Los plazos se cuentan desde la recepción según la normativa aplicable; una necesidad de verificar identidad no habilita postergación indefinida.
2. Comprobar control de la cuenta/perfil o representación por un medio proporcional. No entregar inventarios, correos, compras o historial sólo por coincidencia de nombre o correo. Si hace falta prueba adicional, pedirla por un canal privado seguro y conservar únicamente lo necesario.
3. Identificar material, cuenta, anuncio o dato concreto. Conservar evidencia mínima, fecha, versión y acceso restringido. Diferenciar lo alegado de lo confirmado.
4. Ejecutar la medida procedente: corregir, bloquear, suspender, retirar, entregar copia o gestionar supresión. En derechos de autor/marca, revisar legitimación y permiso; una alerta creíble puede justificar suspensión preventiva mientras se verifica. Un conflicto jurídico necesita análisis del caso. No acusar públicamente al denunciante o al proveedor.
5. Registrar qué se hizo, evidencia y dependencias externas. Responder por el seguimiento privado. Los contactos externos o correos requieren la autorización correspondiente y no se envían por preparar este documento.
6. Resolver sólo con acción y resultado comprobables. Casos en proveedores siguen `external_pending`. El sistema bloquea cerrar como resuelta una eliminación sin flujo integral auditado. No certificar un borrado por haber recibido el formulario.

## Acceso, rectificación y eliminación

La AAIP informa 10 días corridos para contestar acceso y 5 días hábiles para rectificación, actualización o supresión. Son referencias legales, no una promesa de capacidad ya implementada. Hay que organizar atención real para cumplirlos y revisar excepciones aplicables. Fuente: [AAIP, derechos de datos](https://www.argentina.gob.ar/aaip/datospersonales/derechos), consultada el 10/10/2026.

Para eliminar: verificar perfil y cuenta, detener nuevas escrituras vinculadas, inventariar dependencias, suprimir datos propios y comprobar que no se recrean por solicitudes en vuelo o cookies antiguas. Incluir inventario, compras/consumo, listas, favoritos, preferencias, memoria, fotos, accesos, actividad, avisos y reclamos vinculados por referencia. Revisar copias locales de cada dispositivo, respaldos y correos ya entregados. Gestionar proveedores y documentar sólo la conservación limitada que tenga motivo y plazo válidos. No eliminar la cuenta de ChatGPT.

El flujo integral de copias externas aún está pendiente. La web 138 publicó un borrado atómico de la base activa que incluye referencias JSON de reclamos y revocación del perfil; las pruebas automatizadas cubren aislamiento, reversión ante fallos y solicitudes antiguas. No ejecutar borrados sobre usuarios reales como prueba ni informar a Play que la revisión de todas las copias externas está terminada. El registro de reclamos usa `market_reports` y puede referenciar el perfil dentro del JSON; un borrado por `owner_id` solo no lo cubriría.

## Denunciante, usuario y anunciante

No exponer identidad/contacto a otros usuarios o anunciantes. Si se necesita informar al afectado, compartir sólo lo indispensable. Conservar defensas y pruebas de ambas partes sin presentarlas como hechos validados. El canal no reemplaza AAIP, Defensa del Consumidor ni otros medios legales, ni exige renunciar a ellos.

Los anuncios deben poder pausarse mientras se revisan derechos o condiciones. El acuerdo debe definir cancelación y devolución aplicables; no improvisar decisiones de cobro o compensación. Resolver un caso requiere evidencia, y no un contador de clics o una venta supuesta.
