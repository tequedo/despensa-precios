# RINDECASA — protocolo de piloto Android

Preparado el 9 de octubre de 2026. **No ejecutado en teléfonos en esta preparación.** Un test de servidor o una foto previa no reemplaza pruebas físicas de cámara y micrófono.

Usar dos teléfonos y cuentas controladas, sin datos de terceros. Registrar commit/versión, modelo, Android/navegador, fecha, resultado y evidencia por caso. No subir cookies, claves, caras, audios o tickets con datos personales al repositorio público.

| Prueba | Acción | Criterio verificable |
|---|---|---|
| Asociación | Abrir versión firmada por canal de prueba previsto | Origen, paquete y certificado coinciden; TWA sin barra. Un APK debug con barra no acredita firma Play |
| Cuenta en otro teléfono | Vincular A, guardar historial/preferencias y entrar en A desde teléfono 2 | Se recuperan los mismos datos sin copiar datos ni depender del teléfono |
| Aislamiento | Cambiar a B y volver a A, cerrar sesión | B nunca recibe inventario, historial o avisos de A |
| Memoria | Desactivar, buscar y borrar memoria | No guarda cuando está desactivada; borrado reflejado en ambos teléfonos |
| Precios | Mismo código/marca/presentación en ChangoMás, con/sin filtro y en provincias distintas | Coinciden sucursal, unidad, fecha y origen; distingue filtro de falta de fuente |
| Promociones | Incluido/excluido, cantidades 2x1/3x2 insuficientes, día errado, jubilado/no, tope agotado | Solo regla completa y elegible; total nunca usa términos incompletos/contradictorios |
| Voz | Dictar marcas/tamaños/cantidades, cancelar otra captura y denegar permiso | Confirma datos antes de guardar; cancelar detiene captura; alternativa manual |
| Foto | Fotografiar envase físico y caso ambiguo; denegar cámara y elegir imagen | Confirmación de marca/tamaño/cantidad, sin inventar campos; carga manual disponible |
| Ubicación | Manual, GPS concedido/denegado, cambio de localidad | Sucursales correctas y sin mezclar pantalla anterior |
| Red | Cortar durante búsqueda/foto/voz y reconectar | Reintento sin duplicados ni renovar fecha de datos viejos |
| Correo | Solo prueba autorizada a destinatario controlado | ID, aceptación del proveedor y recepción real documentados por separado |
| Eliminación | Tras implementarla, confirmar borrado de A y volver desde ambos teléfonos | Datos eliminados según política, B intacta, sesión vieja sin exponer datos de A |

Si no se puede probar, marcar pendiente/bloqueado. Cada fallo exige reproducción, corrección, nueva versión y repetición. Verificar los requisitos Google con tipo/antigüedad reales de la cuenta de desarrollador.
