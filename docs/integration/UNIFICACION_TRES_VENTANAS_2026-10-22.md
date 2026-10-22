# Dónde Rinde - unificación de las tres ventanas

Corte: 22/10/2026, Argentina. Integración de revisión por solicitud del titular. Proyecto: appgprj_6a9c53ae66f4819182c306fba4c263ca.

## Resultado

Las tres entregas web están combinadas en la rama integracion/tres-frentes-20261022. Se conservaron estética, contratos de API/JSON, migraciones y configuración. La base del repositorio de datos es 20b4da450f1502eb44da1c742c7de16d063ecf4b; no se sustituyeron precios generados por copias antiguas. Android se incorporó por sus 33 rutas revisadas y reglas de exclusión de claves, preservando el recolector actual.

La combinación no cierra los 31 frentes ni acredita publicación. Web pública: v167. No se solicitó despliegue web, firma, carga a Play, registros, acuerdos, pagos ni nuevos contactos externos.

## Logros incorporados

| Ventana | Resultado |
| --- | --- |
| 1 - Precios, fuentes y promociones | Validación estricta de mínimos, topes, titular/período, importes, provincia, canal y fecha. Separación entre pago en caja y reintegro. Evidencia por producto y auditoría repetible. Diagnóstico y alternativas de acceso SEPA. |
| 2 - Funcionamiento, cuentas y seguridad | Operaciones invalidadas al cambiar/cerrar/borrar perfil; descarte de respuestas viejas; agrupación solo de envíos idénticos; recuperación del intento por lote al reabrir y retiro de guardados confirmados. Cuentas, listas y borrado probados. Eliminado envío de foto original ante fallo. |
| 3 - Legal, Android y publicación | Revisión actual de privacidad/reclamos, licencias y preparación INPI/DNDA. Guiones de revisión, capturas, prueba cerrada, lanzamiento y piloto publicitario. Android 0.1.1/código 2, corrección de arranque y avisos de 53 coordenadas controlados en AAB. |

## Verificación conjunta

- Web: compilación correcta, 254/254 pruebas y tipos sin diagnósticos.
- Recolector y preflight Android: 145/145. Incluye los cinco casos de preflight, que no se suman otra vez.
- Diagnóstico SEPA: 7/7. Licencias Android: 5/5.
- Firma Android local: cuatro aprobadas y seis omitidas por falta de JDK completo.
- Total local: 415 aprobadas, cero fallos y seis omitidas.
- CI Android previo 39784776544: 20 pruebas, lint, paquetes, avisos y arranque en emulador aprobados sobre la fuente Android conservada. No se recompiló Android nativo en esta integración.
- Aviso idéntico entre web y Android; precios generados, worker, hosting y migraciones preservados.
- No se acredita navegador, Samsung, segundo teléfono, Google real ni período de prueba cerrada por estas pruebas.

Comandos, hashes y alcance: VALIDACION_CONJUNTA_2026-10-22.json.

## Cruces abiertos

### C1 - Compras parciales

Pedir 3 y recibir 1 debe conservar 2 pendientes; la ruta actual puede ocultarlos. Requiere coordinar saldo, API, comparación y migración compatible.

### C2 - Respuesta perdida en operaciones individuales

Repetir un alta o una compra individual tras perder la respuesta puede sumar dos veces. Falta comprobante transaccional por operación y recuperación tras recarga.

### C3 - Restauración y revocaciones

Un respaldo anterior puede perder barreras de borrado. Falta procedimiento admitido por el alojamiento y prueba aislada antes de reabrir acceso.

### C4 - Límites del reconocimiento

Faltan cuotas por perfil, timeout y propagación de cancelación. Cancelar en la pantalla no demuestra cancelación ni ausencia de costo del proveedor.

## Dependencias externas principales

Acceso oficial SEPA e IP/egreso autorizado; continuidad real de actualización; promociones oficiales utilizables por producto; proveedores y restauración; pruebas físicas y acceso dedicado de revisión; clave/certificados, Console, prueba cerrada y publicación. La preparación de Oracle no acredita cuenta activa, IP reservada ni autorización SEPA.

Los archivos vigentes de datos conservan estado replica_integrity_checked y autenticidad independiente no verificada. Una fecha de comprobación reciente no convierte por sí sola los precios en datos del día.

## Trazabilidad

- webBase: d6122f03f4bcf567873334b596f910ded6eba77d.
- webCodeIntegrated: 222a90e3fc03a24a578d305bc4b0d57a76e528e3.
- webWindow1: b966af101bd65bc501b6b0dbe1d546459fab6a13.
- webWindow2: 921c11a42cba65aa0a588313a7fedf12cac7b19b.
- webWindow3: 0a0dd8dab46688c241c7a10c16c59bf64ee73dcc.
- dataBase: 20b4da450f1502eb44da1c742c7de16d063ecf4b.
- dataCodeIntegrated: 1b3d3713cbce7e588112bbc45e88b42287afa627.
- dataWindow1: b620e041846703f5c641211a447e5076fa8d4979.
- dataSepa: 199726355a33e6086310db2108c9c816743bfd61.
- android: ee94d2056e51f40574e494c7918713613fa5cc2e.

El estado de cada punto está en ESTADO_UNICO_31_2026-10-22.json y su versión Markdown. Los informes anteriores son históricos; este corte actualiza la recepción de las entregas 1 y 2.
