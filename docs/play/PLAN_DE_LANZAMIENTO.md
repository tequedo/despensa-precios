# RINDECASA — pasos para publicar y atender el piloto

Estado comprobado el 2 de octubre de 2026. Este plan complementa el listado maestro de 109 puntos; no sustituye esos puntos ni los declara terminados.

## 1. Recuperar precios utilizables

- Las tres ejecuciones programadas de hoy fallaron. La descarga SEPA oficial devolvió HTTP 403 y la réplica disponible excedió 72 horas.
- Los índices de las 24 jurisdicciones mantienen fecha de origen 2026-09-22, sin sucursales frescas al corte. San Juan contiene 14 sucursales históricas, pero cero utilizables hoy.
- Obtener una fuente autorizada que entregue fecha de precios, producto/presentación, sucursal, canal y condiciones; verificarla antes de cambiar el proveedor. No renovar fechas de datos antiguos.
- Cierre: descarga exitosa, nueva fecha comprobable, índices regenerados y comparación real contra tickets o páginas oficiales de al menos tres sucursales por zona del piloto, durante tres días consecutivos. Estos tres días son un criterio de calidad propuesto, no una exigencia de Google.

## 2. Consolidar promociones

- El archivo de promociones de producto verificadas contiene cero promociones y no se actualizó desde el 25 de septiembre.
- El chequeo independiente de beneficios se actualizó el 2 de octubre: 71 candidatos, uno verificado, 66 incompletos y cuatro en conflicto. El beneficio verificado mantiene `calculationEligible: false` por exclusiones; solo se puede simular con confirmación de productos, medio de pago y tope disponible, además de respetar fecha y sucursal.
- Validar por cadena y jurisdicción alcance, fechas, día, medio de pago, tope por persona/cuenta, exclusiones, acumulación y cantidad. Un beneficio nacional no equivale a todas las promociones nacionales.
- Cierre: matriz de cobertura visible y precios finales comprobados con casos elegibles y no elegibles. No anunciar cobertura completa mientras siga siendo parcial.

## 3. Acreditar la marca y derechos de uso

- Nombre elegido: RINDECASA. Las búsquedas fonéticas 24945231/24945232/24945233 son informes, no títulos de registro. Los borradores de clases 9/35/42 tampoco prueban presentación o concesión.
- Revisar las coincidencias de los informes y seleccionar clases/actividades que realmente se usarán. Consultar a un profesional de marcas antes de decidir frente a antecedentes semejantes.
- Verificar en INPI el estado actual; completar datos del titular, declaración, firma y aranceles. Conservar solicitud, publicación, eventual oposición y certificado si se concede. La navegación al portal no permitió comprobar hoy un estado nuevo.
- Si la condición del lanzamiento es tener nombre registrado, esperar el título de concesión. Una solicitud presentada no es una marca concedida.
- Revisar por separado propiedad/licencias de logo, fotos, tipografías, código, datos y atribuciones; no usar nombres o logotipos de supermercados como si fueran patrocinadores.
- Registrar una marca no elimina automáticamente riesgos de copyright o políticas de Play, ni garantiza ausencia de reclamos de terceros.

## 4. Privacidad, eliminación y ficha de Play

- Auditar el flujo real de nombre/cuenta, inventario, ubicación, voz, imágenes y avisos. El nuevo canal guarda descripción, producto/sucursal opcionales, correo opcional, provincia/localidad seleccionadas, pantalla y respuesta; debe figurar en la declaración.
- Publicar política de privacidad con titular responsable, contacto válido, proveedores, finalidades, plazos de conservación y derechos. No publicar un borrador con campos pendientes como política definitiva.
- Implementar y probar solicitud de eliminación dentro de la app y en una URL pública, incluyendo datos asociados a la cuenta. Borrar datos de este producto no significa borrar la cuenta de ChatGPT.
- Completar Seguridad de los datos, público objetivo, clasificación, anuncios, instrucciones para revisión y acceso verificable del revisor sin datos reales de terceros.
- Preparar icono final, capturas de teléfonos reales, descripción que reconozca disponibilidad por zona y promoción, y correo de soporte. Verificar la cuenta de desarrollador y su titularidad en Play Console.

## 5. Compilar, firmar y probar Android

- La base `mobile/android` y su acción de compilación están preparadas para API 36. No hay todavía AAB firmado ni envío a Google.
- Confirmar paquete definitivo, clave de carga, Play App Signing y asociación web Digital Asset Links. Mantener credenciales fuera del repositorio.
- Ejecutar checklist en dos teléfonos/cuentas: alta, vinculación, aislamiento de datos, inventario, compra manual, comparación, promoción, ticket/foto, voz, GPS, sin conexión, aviso y respuesta, eliminación.
- Abrir prueba interna. Para cuentas personales nuevas sujetas al requisito de Google (creadas después del 13/11/2023): prueba cerrada con al menos 12 testers inscritos de forma continua durante 14 días y posterior solicitud de acceso a producción. No prometer publicación al día 15; Google decide el acceso y revisa la app.

## 6. Atender avisos todos los días

- Formulario de usuario: “Informar un problema”. Panel privado del titular: `/admin/avisos`. Estados: recibido, en revisión, resuelto; al cerrar, explicar qué se corrigió.
- Una respuesta se muestra en “Mis avisos” del mismo perfil; no se envía automáticamente un correo. Vincular la cuenta permite recuperar ese perfil desde otro dispositivo.
- Rutina propuesta: revisar avisos cada día hábil, priorizar precio final incorrecto, mezcla de datos o pérdida de compras; reproducir, corregir, probar, publicar, responder con la versión y comprobar con el usuario.
- El formulario no inicia por sí solo un servicio humano diario ni garantiza que todas las quejas estén resueltas. Definir responsable y horario antes de invitar al público.

## Fuentes de requisitos

- [Marca y protección — INPI](https://www.argentina.gob.ar/inpi/marcas/preguntas-frecuentes-de-marcas-0).
- [Registrar una marca](https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca).
- [Nivel de API exigido por Google Play](https://support.google.com/googleplay/android-developer/answer/11926878).
- [Pruebas para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465).
- [Eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111).

El orden puede avanzar en paralelo: Android, documentos y marca mientras se recupera la fuente. No se marca listo para producción hasta cerrar precios, condiciones de promociones, privacidad, firma, pruebas y nombre según la condición del titular.
