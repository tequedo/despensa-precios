# Pausa del reconocimiento pago — 22/10/2026

Decisión del titular: retirar el reconocimiento por foto y voz hasta poder solventar su costo. La carga manual con teclado y el guardado de productos siguen disponibles. Publicado como web **170**, fuente `4924c5c3f8ea51f4314778e42c218305592d6c71`, despliegue `appgdep_6ada95300c048191ba943df30a45c33c` finalizado correctamente el 22/10/2026 a las 22:59 UTC. Archivo SHA-256 `dd7de4e066195614353578d053165d7e4e611404382426a75e9cc6cf7b010113`, 5.672.960 bytes. Mismo público y revisión de entorno 12.

## Comportamiento de esta versión

- En inventario y compras se presenta **Agregar producto**, que abre el formulario manual existente. El panel de reconocimiento no se monta: no muestra botones de foto/voz, selectores de archivos ni solicitudes de micrófono.
- Una política común, `PAID_RECOGNITION_ENABLED=false`, bloquea los POST de `/api/assistant-list` y `/api/assistant-list/transcribe` antes de autenticar, leer el cuerpo, reservar cupo o llamar a OpenAI. Responden 503 con `recognition_paused` y sin caché. El GET de disponibilidad responde `enabled:false`, aunque exista una clave configurada. Los clientes anteriores y los parámetros de URL no pueden activarlo.
- El texto del formulario manual se guarda por `/api/pantry` y no utiliza la API de IA. El texto bloqueado en la ruta de reconocimiento era una entrada para interpretación automática, utilizada también después de transcribir voz.
- Las fotos opcionales asociadas manualmente a un producto y el lector de códigos del dispositivo no utilizan reconocimiento de OpenAI; se conservan.
- Se actualizaron privacidad e información del servicio para describir la pausa. Pausar no borra contenido recibido anteriormente por proveedores ni elimina otros costos de alojamiento, correos u otras cuentas.

## Trabajo conservado para una decisión futura

Se conservan los componentes de reconocimiento y los controles preparados: cupos transaccionales por perfil y servicio, una captura por perfil en curso, identificación de reintentos, timeout, propagación de cancelación, duración verificada de audio PCM y JPEG acotado. La cancelación no equivale a un reembolso por procesamiento ya realizado. Estos controles están inactivos en el alcance actual y no autorizan reactivar el reconocimiento.

Los registros técnicos preparados no incluyen audio, foto ni transcripción. Se limpian a los 90 días; los vinculados al perfil se retiran con su borrado. El agregado diario global no identifica al perfil y no se reinicia por eliminar una cuenta.

## Comprobación

- 298 pruebas aprobadas, 0 fallos y 0 omitidas; comprobación de tipos y build aprobados.
- Worker compilado con clave simulada presente: las rutas de texto, foto y voz responden pausa; disponibilidad desactivada; **0 llamadas externas**, **0 intentos/cuotas de reconocimiento** y **0 eventos de uso de reconocimiento**. En la misma prueba se guarda y recupera un producto manual.
- El componente real de entrada muestra una sola acción manual, ejecuta su callback y no monta controles de reconocimiento.
- Los controles conservados se prueban con proveedores simulados, incluyendo límites compartidos, duplicados, cancelación entre etapas, timeout, borrado y rollback. No se hicieron llamadas pagas para estas pruebas.
- Esto no acredita una instalación nueva ni un recorrido físico en Samsung u otro teléfono. Los frentes originales 11 y 20 conservan sus validaciones pendientes.

La futura reactivación requiere decisión expresa del titular, presupuesto y prueba de los dispositivos y controles. La rentabilidad no activa automáticamente una API.

La vista previa de navegador no completó la carga del módulo de la página. No se acredita recorrido autenticado de navegador; el componente real y el Worker compilado sí pasaron sus pruebas. La instalación física sigue pendiente.
