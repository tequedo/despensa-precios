# RINDECASA — política e inventario de datos para completar

BORRADOR del 10/10/2026. La página pública informa operaciones actuales y pendientes; este documento no acredita cumplimiento integral ni reemplaza campos faltantes del responsable.

## 1. Responsable y atención

Proyecto RINDECASA / Dónde Rinde. Responsable indicado: Aníbal Pringles. Confirmar identificación legal, domicilio y correo de atención efectivo por un canal privado; publicar únicamente datos necesarios. Canal web preparado: `/legal/solicitudes`. Atención operativa: titular del proyecto, sin equipo adicional confirmado. Determinar necesidad y alcance del registro de bases AAIP y documentar contratos con encargados.

## 2. Finalidades, datos y controles observados

| Categoría | Ubicación/control observado | Finalidad y límite |
|---|---|---|
| Cuenta/perfil: identificador, nombre y correo cuando están disponibles | `access_users`, `account_profiles`; cookie de perfil; identidad de gateway | Separar y recuperar despensa con la misma cuenta. El correo tecleado no autentica. No se guarda contraseña de ChatGPT. |
| Inventario, fotos guardadas, compras, consumo, listas | `products`, `purchases`, `consumption`, `shopping_lists` | Funciones solicitadas; carga y confirmación humana. Eliminar memoria no elimina todo este conjunto. |
| Preferencias, memoria, favoritos, interés en productos | `market_preferences`, `market_favorites`, `market_products` y referencias del perfil | Personalizar; controles existentes de memoria y preferencias. Revisar dependencias antes de borrar cuenta. |
| Ubicación | Provincia/localidad y coordenadas elegidas; copia local `despensa-location`; consulta Georef | Precios cercanos. Existe selección manual; GPS no obligatorio para comparar. |
| Reconocimiento | Texto/foto a OpenAI; audio a transcripción o servicio del navegador según método | Marca/presentación/cantidad sugeridas. Informar proveedor antes de captura; alternativa manual. |
| Accesos y actividad | `access_devices`, `access_events`, `usage_events`, `process_events`, `notification_digests` | Diagnóstico y avisos operativos. Algunos resúmenes entregados por correo salen de la base. No asumir eliminación de esas copias. |
| Feedback y reclamos | `market_reports`; reclamo guarda referencias de perfil/cuenta en JSON y hash del recibo | Tramitar caso; privados para titular y poseedor del enlace. Consentimiento específico, sin marketing. |
| Solicitud comercial | Contacto en `market_reports`; retiro con secreto separado | Responder propuesta; no publica contactos ni ejecuta cobros. |
| Métricas de anuncio | Hash de sesión/evento/día como identificador; payload campaña/día/evento | Contadores agregados, no ventas ni personas únicas. Copia de sesión en el navegador. No prometer anonimato universal. |
| Lista sin conexión | `donde-rinde-offline-list-v1` en cada navegador | Copia local deliberada; tiene su control de borrado y no desaparece por una solicitud al servidor. |

No recolectar DNI, números completos de tarjetas, claves bancarias, información médica ni datos de personas ajenas para comparar precios. Elegir banco o condición de jubilado para simular un beneficio no debe convertirse en acceso a cuentas bancarias ni datos previsionales verificatorios.

## 3. Proveedores y transferencias por confirmar

Documentar Sites/hosting y autenticación, base y respaldos, OpenAI para reconocimiento, servicio de voz del navegador, Georef, correo operativo y fuentes/replica de precios. Confirmar entidad contractual, destinos de procesamiento, condiciones de seguridad, retención y canal de supresión. La opción `store:false` en algunas llamadas no demuestra cero retención de todos los servicios. No afirmar que todos los datos permanecen en Argentina.

Una carga propia para reconocimiento no concede permiso general de marketing sobre su foto. La finalidad de contacto en un reclamo o comercio tampoco autoriza campañas de email.

## 4. Conservación pendiente

Definir por categoría plazo, disparador, responsable, ejecución, respaldos y excepciones concretas. Los datos de una despensa activa se usan para prestar sus funciones, pero eso no justifica plazo indefinido al terminar. Los registros técnicos, solicitudes, comprobantes y litigios pueden tener motivos diferentes que requieren límites documentados. No insertar un número de días arbitrario como si estuviera implementado.

## 5. Acceso, corrección y eliminación

Ruta pública y desde Mi cuenta: `/legal/eliminar-cuenta`. Se admite pedido sin reinstalar Android. La asociación a un perfil controlado ayuda a verificar; nombre/correo o recibo no acreditan control completo. La versión web 138 publicó la preparación y confirmación del borrado atómico de la base activa con revocación de perfil, recibo y limpieza de las copias locales conocidas del navegador que confirma. La solicitud asistida no ejecuta el borrado por sí sola. La ejecución integral, incluidos proveedores, respaldos y correos ya entregados, continúa pendiente. No se borró una cuenta real como prueba de esta revisión.

El mapa debe incluir relaciones directas y referencias JSON, datos fuera de la base, respaldos, proveedores y correos. Añadir protección contra escrituras en vuelo, cookies antiguas y recuperación de datos borrados. Conservar sólo aquello con base válida y plazo informado. La eliminación RINDECASA no elimina la cuenta de ChatGPT ni archivos exportados o copias de otros teléfonos.

Atender según plazos legales y caso concreto: el procedimiento incorpora referencias AAIP, verificación proporcional y seguimiento. No presentar a Play una eliminación completa que no fue probada.

## 6. Seguridad y transparencia

Evitar secretos de acceso en logs, query strings y datos públicos; limitar paneles a titular autenticado; respuestas no cacheables; controles de origen; pruebas de aislamiento por cuenta. Revisar recuperación de recibo perdido y contacto alternativo, que aún no están definidos. No prometer seguridad absoluta, ausencia de incidentes ni certificaciones inexistentes.

La versión definitiva necesita completar responsable, proveedores, retención y ejecución de derechos, y coincidir con ficha de Play y comportamiento efectivo. Conservar versión y aceptación específica donde sea necesaria; no convertir un permiso de cámara/micrófono en consentimiento informado para cualquier tratamiento.
