# Inventario previo a Seguridad de los datos

Revisión de código de la app web, 2 de octubre de 2026. Es un documento de trabajo, no una política pública ni una declaración enviada a Google. Debe completarse con proveedores contratados, conservación efectiva y pruebas de eliminación.

| Datos observados | Uso y recorrido observados | Verificación antes de declarar |
|---|---|---|
| Nombre de perfil, identificador de perfil y, al vincular, ID/correo/nombre autenticados | Perfil invitado con cookie opaca; vinculación opcional a la identidad autenticada; base de datos del producto | Identificar responsable, base legal, duración de cookies y separación entre borrar datos de esta app y borrar una cuenta de ChatGPT |
| Inventario, compras, cantidades, consumos e imágenes elegidas para productos | Datos por perfil guardados en la base; algunas imágenes se guardan como datos del producto | Incluir contenido del usuario y compras según las categorías de Play; fijar retención y eliminar relaciones asociadas |
| Provincia, localidad, latitud y longitud | Selección guardada en el navegador; coordenadas enviadas al backend para ubicación/comparación | Auditar servicio de geocodificación, registros de servidor y qué ubicación es precisa o aproximada; ofrecer selección manual |
| Fotos y texto para reconocer productos | La ruta del asistente envía imágenes/texto a OpenAI; `store:false` en Responses no demuestra por sí solo ausencia de retención del proveedor | Declarar procesamiento remoto; confirmar contratos, retención real y comportamiento cuando se deniega permiso |
| Audio grabado o elegido | La ruta de transcripción envía el archivo a OpenAI | Informar proveedor y finalidad antes del uso; confirmar plazos, permisos y que cancelar detenga la captura |
| Actividad de acceso y uso | El código de notificaciones registra identificador de dispositivo, país, agente del navegador, nombre/identificadores, funciones usadas, resultado y códigos técnicos | Revisar necesidad de cada campo, proveedor de correo/infraestructura, destinatario de avisos y conservación |
| Reclamos y respuestas | Descripción, categoría, producto/sucursal opcionales, correo opcional, localidad/provincia, pantalla, fecha y respuesta; aislamiento por perfil y panel del titular | Informar finalidad y conservación; incorporar también a la eliminación de datos del perfil |

El permiso concedido al navegador no sustituye la información de privacidad ni la declaración de Google Play. Tampoco se debe marcar “no recopilamos datos” solo porque Android funciona mediante una TWA.

## Diseño pendiente de eliminación

1. Ofrecer la solicitud dentro de Mi cuenta y desde una página web pública accesible desde la ficha de Play.
2. Verificar identidad/control del perfil sin aceptar el nombre escrito como autenticación.
3. Mostrar qué se elimina; pedir una confirmación específica al usuario antes de una operación irreversible.
4. Cubrir vínculos de cuenta, inventario, compras, consumos, listas, imágenes, actividad y reclamos. Identificar previamente cualquier conservación legal y explicarla.
5. Probar que un perfil no puede borrar a otro; que la eliminación no expone datos mediante cookies antiguas; y documentar tratamiento de respaldos y solicitudes.

Fuente de requisitos: [eliminación de cuentas de Google Play](https://support.google.com/googleplay/android-developer/answer/13327111). No hay en esta preparación un flujo completo implementado ni una política definitiva publicada.
