# Dónde Rinde — estado único de los 31 frentes

Corte: 22/10/2026, Argentina. Integración publicada en web 168, fuente `753215f2075f8dfd41464b91fddf735a5fc69297`. Android 0.1.2 revisado; Play permanece en borrador, 7/11 tareas.

Cada estado se refiere al punto completo. Una corrección incorporada y probada no sustituye pruebas físicas, permisos, contratos o publicación.

| N.º | Frente | Estado | Avance y límite |
| --- | --- | --- | --- |
| 1 | Acceso estable a SEPA | bloqueado por dependencia | Acceso y descarga directa pendientes de respuesta de SEPA por instrucción del titular. PR20 prepara la prueba real como ejecución manual explícita; no hay habilitación oficial ni IP autorizada acreditadas. Procedencia vigente: réplica. |
| 2 | Actualización diaria comprobada | implementado pendiente de validar | Auditoría de continuidad y lectura real de 12 cotizaciones recibidas. Éxito con réplica no acredita siete fechas oficiales consecutivas ni precios recién fechados. |
| 3 | Identidad y calidad de productos | implementado pendiente de validar | Entrega auditó 22.045 observaciones y 7.381 filas sin presentación resoluble. Controles incorporados; rectificación y contrato de identidad/presentación pendientes. |
| 4 | Cobertura geográfica real | implementado pendiente de validar | Entrega documenta 2.546 sucursales, 53 apartadas por inconsistencia geográfica y exclusión de canal Web. Falta corroboración física de tiendas y coordenadas. |
| 5 | Adaptadores de promociones | implementado pendiente de validar | Extracción y revalidación reforzadas: mínimo, tope, provincia, canal y fecha deben probarse. Faltan legales completos y contenido dinámico de varias fuentes. |
| 6 | Promociones por producto aplicables | bloqueado por dependencia | No se fabrica un EAN desde una clave interna. Extensión de identidad/presentación y caso oficial positivo por producto/sucursal pendientes. |
| 7 | Beneficios personales | implementado pendiente de validar | Cálculo bloqueado ante mínimos, topes, período, titular o importes incompletos. Reintegro separado del pago en caja; elegibilidad y saldo requieren confirmación. |
| 8 | Verificación completa en producción | implementado pendiente de validar | Integración web 168 publicada, fuente 753215f2075f; 254 pruebas web del corte aprobadas. Falta verificación completa de recorridos en producción y dispositivos; no acredita descuentos reales nuevos. |
| 9 | Canales oficiales y reutilización | bloqueado por dependencia | Matriz de fuentes, reutilización y límites recibida. Contactos previos no son convenios; faltan permisos o confirmaciones cuando corresponda. |
| 10 | Samsung y otro teléfono | implementado pendiente de validar | APK Dónde Rinde Prueba Nueva 0.1.2, paquete independiente preview012, entregado. CI39828245411 comprueba arranque y coexistencia con preview. Instalación en el Samsung y recorrido del segundo teléfono sin confirmar. |
| 11 | Voz, foto y códigos | implementado pendiente de validar | Permisos tardíos, cancelación y borradores comprobados. Eliminado envío de foto original al fallar su preparación; faltan voz/foto/código físicos. |
| 12 | Ubicación real | implementado pendiente de validar | Cambio de provincia invalida GPS viejo; rechazo permite selección manual. Falta recorrido físico de GPS, radio, sucursales y conservación de lista. |
| 13 | Cuentas y recuperación | implementado pendiente de validar | Respuestas viejas se descartan; cierre/cambio/borrado invalidan operaciones antiguas. Google configurado y aislamiento probado; recorrido real pendiente. |
| 14 | Listas y existencias | requiere corrección | Reintento de lote conservado al reabrir y guardados confirmados retirados del borrador. C1: compra parcial puede ocultar saldo. C2: operación individual puede duplicarse ante respuesta perdida. |
| 15 | Borrado y restauración | bloqueado por dependencia | Borrado activo, revocación, aislamiento y rollback probados con datos descartables. Restauración sin resucitar datos y eliminación externa sin acreditar. |
| 16 | Proveedores y conservación | bloqueado por dependencia | Matriz de proveedores y retención recibida. Los controles operativos de 90 días no acreditan contratos, regiones ni supresión de todas las copias externas. |
| 17 | Privacidad, términos y reclamos | bloqueado por dependencia | Privacidad y tratamiento cotejados con fuente web 168 y Console en vivo; cierre legal preparado. Faltan contacto operativo, condiciones efectivas de proveedores, conservación y comprobación externa. |
| 18 | Licencias, imágenes y datos | implementado pendiente de validar | CI39828245411 comprueba avisos y dependencias en el AAB 0.1.2 revisado. El inventario web y condiciones por fuente mantienen pendientes; fotos externas sin derechos siguen suspendidas. |
| 19 | Nombre y software INPI/DNDA | bloqueado por dependencia | Nombre vigente Dónde Rinde y preparación INPI/DNDA conservados. Requisitos oficiales reconsultados el 22/10; antecedentes actuales, titularidad/cesiones y ejecución pendientes. Sin presentación, pago o concesión nueva acreditados. |
| 20 | Operación y soporte | implementado pendiente de validar | Alertas, métricas y mantenimiento probados en suite. C3: restauración/revocaciones; C4: cuotas, timeout y cancelación del reconocimiento pendientes. |
| 21 | Firma de producción y AAB | bloqueado por dependencia | AAB 0.1.2/código 3 revisado, sin firma de carga. PR20 agrega asistente local y comprobante del hash. Clave real, respaldo y firma bajo control del titular siguen pendientes. |
| 22 | Asociación sitio y Android | bloqueado por dependencia | Origen y paquetes Android conservados. Certificado real de distribución y asociación TWA/Asset Links pendientes de verificación. |
| 23 | Acceso dedicado de revisión | bloqueado por dependencia | Detalles de acceso revisado en Console: sin respuesta ni cuenta dedicada repetible comprobada. No se sustituye por la cuenta personal del titular. El acceso público a precios no abre todas las funciones privadas. |
| 24 | Preparación de Play Console | implementado pendiente de validar | Console revalidada en vivo: app borrador, 7/11 tareas; icono definitivo guardado y comprobado al reabrir. Pendientes acceso de revisión, público, Seguridad de datos y capturas/ficha; países y envío final sin acreditar. |
| 25 | Capturas reales y coherencia | bloqueado por dependencia | Ficha reabierta: icono actualizado, gráfico y textos conservados; sin capturas de teléfono. Faltan paquete final y al menos dos capturas fieles sin datos personales. |
| 26 | Prueba cerrada | bloqueado por dependencia | Console muestra 0 participantes adheridos. Pendientes versión cerrada y 12 participantes durante 14 días consecutivos. APK externo y pruebas automáticas no inician ese período. |
| 27 | Lanzamiento controlado | bloqueado por dependencia | Integración publicada en web 168; Android continúa como borrador. Firma, certificados, pruebas físicas, declaraciones pendientes, prueba cerrada, revisión y publicación Android sin completar. |
| 28 | Primer piloto publicitario | bloqueado por dependencia | Acuerdo propuesto y ficha de campaña preparados. Sin anunciante, aceptación, derechos, cobro ni campaña real acreditados. |
| 29 | Más cadenas, bancos y comercios | ampliación posterior | Fuentes mayoristas y bancarias adicionales propuestas con enlaces y límites. Sin nuevos contactos enviados ni cobertura completa declarada. |
| 30 | Mayoristas y catálogo local | ampliación posterior | Calculadoras/adaptadores no constituyen un catálogo mayorista real. Faltan cotizaciones por tienda, presentación, bulto, impuestos y vigencia. |
| 31 | Historial y alertas ampliados | ampliación posterior | Auditoría por commit/hashes e historial recibidos. Ampliación comparable requiere contrato de conservación; campanita interna no es push. |

Continúan abiertos C1 (saldo de compra parcial), C2 (idempotencia individual), C3 (restauración/revocaciones) y C4 (cuotas, timeout y cancelación de reconocimiento).

Firma y cierre legal: [procedimiento de firma](../play/FIRMA_DE_SUBIDA.md) y [comprobaciones de Play y legal](../play/CIERRE_LEGAL_PLAY_2026-10-22.md). La preparación del PR20 no acredita por sí sola CI, merge o firma del titular.
