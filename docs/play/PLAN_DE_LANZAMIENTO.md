# Dónde Rinde — preparación para Android y marca

Actualización de identidad: 11 de octubre de 2026. El nombre elegido es **Dónde Rinde**; los informes fonéticos pagados y los borradores anteriores de RINDECASA son antecedentes de otro nombre. Los hitos históricos fechados se conservan y no se presentan como comprobaciones actuales.

Corte original de preparación: 9 de octubre de 2026. Se recupera el trabajo Android del 2 de octubre, no se crea otra app. Este documento no presenta marcas, genera pagos ni envía paquetes a Google. Complementa el listado maestro sin declarar todos sus puntos terminados.

## 1. Precios: recuperación no equivale a estabilidad

La evidencia previa a estos cambios confirma días 8 y 9 de octubre, lectura desde perfil técnico nuevo y tres sucursales ChangoMás en San Juan. La fuente aceptada es una réplica, no una descarga oficial independiente. No se han demostrado siete días consecutivos.

El nuevo historial distingue recuperación inicial, estabilidad de siete días y canal oficial. Las 24 jurisdicciones representadas no significan todos los productos o comercios. Véanse [los controles](../ESTABILIZACION_PRECIOS_Y_PROMOCIONES.md), el historial diario y el informe de acceso de producción.

## 2. Promociones

Se mejoró la extracción de vigencias, cuotas, porcentajes, días, pago, jubilados, topes, canales y acumulación. La matriz registra extracción parcial/ausente y motivos de bloqueo. La corrección de Chromium permite volver a intentar las páginas dinámicas de ofertas; no acredita por sí sola 2x1/3x2 ni descuentos por producto.

Ninguna regla incompleta, contradictoria o vencida se aplica al total. Se verifican por separado producto/presentación/cantidad, sucursal, exclusiones, elegibilidad y tope personal. La revisión diaria no garantiza cobertura total. Archivo de evidencia: data/promotion-matrix.json.

## 3. Marca

Nombre elegido el 11/10: **Dónde Rinde**, propuesta denominativa en clases 9, 35 y 42. Las consultas nominales de DONDE RINDE, DONDERINDE y DÓNDE RINDE no devolvieron registros en la consulta realizada ese día; eso no es una búsqueda fonética, una autorización ni una garantía de disponibilidad. Hay antecedentes con RINDE en clases relacionadas, por lo que no se acredita menor riesgo.

Véase [la preparación del nombre actual](REGISTRO_DONDE_RINDE.md). Se conserva el borrador histórico DONDE RINDE de clase 9 y los de RINDECASA, sin crear duplicados ni modificarlos sin verificar su estado. El estado civil fue confirmado privadamente; continúa pendiente el cotejo final de antecedentes y campos. El portal de trámites del INPI devuelve 502 después del ingreso: no se pudo acreditar una nueva presentación, firma, pago o concesión. El hito de propiedad exclusiva es la concesión; la preparación y la búsqueda no lo sustituyen.

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

- Cotejar Dónde Rinde y formalizar titularidad/presentación cuando esté autorizada; las búsquedas fonéticas pagadas corresponden a RINDECASA y no acreditan registro.
- Acreditar autoría y derechos sobre los aportes originales; preparar registro DNDA como protección documental, separado de la marca.
- Auditar licencias de código, fuentes, imágenes y contenido distribuido, así como condiciones de reutilización de SEPA, su réplica y promociones.
- Actualizar privacidad/eliminación con memoria y circuito comercial; revisar términos, contrato de anuncios y canal de reclamos.
- Revisar la ficha de Play y conservar permisos. Un aviso de copyright o una exención general no garantizan inmunidad frente a reclamos.

La preparación sigue pendiente de revisión jurídica y pruebas documentadas. No se presentan registros ni se publican textos legales definitivos por este cambio.

## 7. Controles legales preparados y web publicada el 10/10

La web 137 (commit `a943af13f6b5f0cc6591b65797c88ca667e5704c`) incorpora páginas públicas de privacidad, licencias, información del servicio y solicitudes, enlace de eliminación desde Mi cuenta, recibo privado y panel del titular. La compilación y 166 pruebas pasaron. No hubo prueba física Android ni recepción real nueva comprobada en producción.

El expediente técnico, borradores de términos/privacidad/acuerdo publicitario y procedimiento están en [el dossier](../legal/ESTADO_LEGAL.md). Se conservaron avisos de terceros; las 89 fotos externas sin permiso documentado quedan ocultas. Los anuncios requieren además referencia de acuerdo y autorización de materiales, sin alterar el ranking ni verificar automáticamente un pago.

**Eliminación integral y textos definitivos siguen pendientes.** Registrar una solicitud no elimina datos ni copias de proveedores; el panel impide simular un cierre de borrado. No declarar este requisito de Play cumplido sólo porque existe una URL. INPI/DNDA continúan sin presentación nueva acreditada. No se firman, pagan ni presentan por este cambio.

## 8. Protección legal publicada en web 139

La web 139, commit `3c11f4a07c71fb408d35b9ff808c2c5e33b386f6`, publicó identidad visual con origen documentado y avisos ampliados de licencias. Compilación y 175 pruebas aprobadas. Se preparó una copia íntegra de 347 archivos por commit para revisión del depósito DNDA. Su preparación no acredita registro ni autoría.

La web 138 ya había publicado eliminación atómica de la base activa y revocación del perfil; su revisión externa y la política definitiva siguen pendientes. Las secciones sobre web 137 son antecedentes históricos. Consultar [protección legal actual](PROTECCION_LEGAL.md) e [inventario de datos actualizado](INVENTARIO_DE_DATOS.md) para los límites actuales. Los formularios privados no se incluyen en este repositorio. No hubo firma, pago, registro ni presentación en Play.

## Cierre por evidencia

| Frente | Evidencia de cierre | Pendiente |
|---|---|---|
| Precios | Siete días confirmados y procedencia real | Racha y canal oficial, informado por separado |
| Promociones | Matriz y casos positivos/negativos corroborados | Extracción y cobertura de ofertas por producto |
| Marca | Revisión y constancias oficiales según hito exigido | Antecedentes del nombre elegido, disponibilidad del portal y gestión autorizada |
| Android | AAB firmado, asociación y pruebas físicas | Clave/custodia, privacidad/eliminación y teléfonos |
| Protección legal | Titularidad, usos de terceros y textos respaldados; registros según hito decidido | Antecedentes, licencias/datos, inventario actualizado y revisión jurídica |

Fuentes oficiales: [firma Android](https://developer.android.com/studio/publish/app-signing), [TWA](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [API exigida](https://support.google.com/googleplay/android-developer/answer/11926878), [eliminación](https://support.google.com/googleplay/android-developer/answer/13327111), [pruebas de cuentas nuevas](https://support.google.com/googleplay/android-developer/answer/14151465), [registro INPI](https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca).

## 9. Identidad Android preparada el 11/10

Se actualizan nombre visible, icono vectorial propio, nombre de proyecto, documentación y etiqueta del artefacto de CI a Dónde Rinde. El icono deriva de la fuente Outfit Bold y se distribuye su licencia SIL OFL. Se conservan por compatibilidad los identificadores técnicos provisionales y los controles de firma. Esta preparación no acredita compilación, pruebas físicas o aceptación de Google Play: consultar la ejecución correspondiente al commit de esta actualización.

Se debe confirmar el identificador definitivo antes de la primera publicación, custodiar la clave de carga y registrar la huella real de Play App Signing. No se genera una clave de publicación en un entorno temporal ni se sustituye por la firma de depuración.
