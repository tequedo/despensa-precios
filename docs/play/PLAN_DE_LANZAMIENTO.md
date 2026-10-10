# RINDECASA — preparación para Android y marca

Corte de preparación: 9 de octubre de 2026. Se recupera el trabajo Android del 2 de octubre, no se crea otra app. Este documento no presenta marcas, genera pagos ni envía paquetes a Google. Complementa el listado maestro sin declarar todos sus puntos terminados.

## 1. Precios: recuperación no equivale a estabilidad

La evidencia previa a estos cambios confirma días 8 y 9 de octubre, lectura desde perfil técnico nuevo y tres sucursales ChangoMás en San Juan. La fuente aceptada es una réplica, no una descarga oficial independiente. No se han demostrado siete días consecutivos.

El nuevo historial distingue recuperación inicial, estabilidad de siete días y canal oficial. Las 24 jurisdicciones representadas no significan todos los productos o comercios. Véanse [los controles](../ESTABILIZACION_PRECIOS_Y_PROMOCIONES.md), el historial diario y el informe de acceso de producción.

## 2. Promociones

Se mejoró la extracción de vigencias, cuotas, porcentajes, días, pago, jubilados, topes, canales y acumulación. La matriz registra extracción parcial/ausente y motivos de bloqueo. La corrección de Chromium permite volver a intentar las páginas dinámicas de ofertas; no acredita por sí sola 2x1/3x2 ni descuentos por producto.

Ninguna regla incompleta, contradictoria o vencida se aplica al total. Se verifican por separado producto/presentación/cantidad, sucursal, exclusiones, elegibilidad y tope personal. La revisión diaria no garantiza cobertura total. Archivo de evidencia: data/promotion-matrix.json.

## 3. Marca

Nombre elegido: RINDECASA, denominativa. Se recuperaron los borradores y los informes fonéticos de clases 9, 35 y 42; no hay constancia nueva de solicitud presentada o concesión. La confusión anterior con DONDE RINDE se resolvió por la elección del 24 de septiembre: no repetir búsquedas ni crear otros borradores.

Véase [la revisión documental](REGISTRO_RINDECASA.md). Faltan estado civil legal y revisión final autenticada de campos y antecedentes. Los datos personales no se publican aquí. Si se mantiene la condición de lanzar con marca registrada, el hito es concesión: búsqueda o presentación no equivalen a registro.

## 4. Android recuperado y controles de firma

La base mobile/android ya compiló el 2 de octubre, ejecución [37075166479](https://github.com/tequedo/despensa-precios/actions/runs/37075166479). Produjo APK debug y AAB sin firma de publicación. No es un AAB listo para Play.

Esta actualización agrega configuración explícita de clave de carga y preflight de paquete/certificado/asociación. No genera claves ni huellas inventadas. Se solicita otra compilación por el PR Android; consultar su resultado en Actions, no inferirlo de las pruebas unitarias.

Pendientes: paquete definitivo, clave de carga y custodia, Play App Signing, huella real de firma de Play, asociación pública assetlinks.json y validación física sin barra del navegador. Véase [README Android](../../mobile/android/README.md).

## 5. Privacidad, ficha y pruebas físicas

- Confirmar responsable, contacto, proveedores y plazos de conservación para una política real; no publicar un texto incompleto como política definitiva.
- Implementar y probar eliminación/solicitud dentro de la app y desde una URL pública, incluyendo todos los datos asociados. Borrar memoria de preferencias no elimina la cuenta completa ni la cuenta de ChatGPT.
- Completar Seguridad de los datos, clasificación, ficha, arte propio, capturas físicas y acceso del revisor. Resolver [el inventario](INVENTARIO_DE_DATOS.md); una TWA no permite declarar que no se recopilan datos.
- Ejecutar [el protocolo de dos teléfonos](PRUEBAS_FISICAS_ANDROID.md), especialmente historial por cuenta, aislamiento, voz/foto, permisos, promociones y precios.
- Abrir prueba interna solo con paquete firmado y autorización. Para cuentas personales nuevas sujetas al requisito, verificar en Play Console los 12 testers durante 14 días y la posterior solicitud de acceso a producción. No prometer aprobación automática al día 15.
- Revisar licencias/derechos de iconos, código, fotos y datos: la marca no sustituye esos derechos. No insinuar patrocinio de cadenas.

## 6. Protección legal y derechos

Revisión incorporada el 10 de octubre de 2026: [acciones y criterios de cierre](PROTECCION_LEGAL.md). Este frente debe avanzar junto con Android.

- Cotejar RINDECASA y formalizar titularidad/presentación cuando esté autorizada; las búsquedas fonéticas no acreditan registro.
- Acreditar autoría y derechos sobre los aportes originales; preparar registro DNDA como protección documental, separado de la marca.
- Auditar licencias de código, fuentes, imágenes y contenido distribuido, así como condiciones de reutilización de SEPA, su réplica y promociones.
- Actualizar privacidad/eliminación con memoria y circuito comercial; revisar términos, contrato de anuncios y canal de reclamos.
- Revisar la ficha de Play y conservar permisos. Un aviso de copyright o una exención general no garantizan inmunidad frente a reclamos.

La preparación sigue pendiente de revisión jurídica y pruebas documentadas. No se presentan registros ni se publican textos legales definitivos por este cambio.

## Cierre por evidencia

| Frente | Evidencia de cierre | Pendiente |
|---|---|---|
| Precios | Siete días confirmados y procedencia real | Racha y canal oficial, informado por separado |
| Promociones | Matriz y casos positivos/negativos corroborados | Extracción y cobertura de ofertas por producto |
| Marca | Revisión y constancias oficiales según hito exigido | Estado civil, antecedentes y gestión autorizada |
| Android | AAB firmado, asociación y pruebas físicas | Clave/custodia, privacidad/eliminación y teléfonos |
| Protección legal | Titularidad, usos de terceros y textos respaldados; registros según hito decidido | Antecedentes, licencias/datos, inventario actualizado y revisión jurídica |

Fuentes oficiales: [firma Android](https://developer.android.com/studio/publish/app-signing), [TWA](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [API exigida](https://support.google.com/googleplay/android-developer/answer/11926878), [eliminación](https://support.google.com/googleplay/android-developer/answer/13327111), [pruebas de cuentas nuevas](https://support.google.com/googleplay/android-developer/answer/14151465), [registro INPI](https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca).
