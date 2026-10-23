# Ficha de Play y primer video — 22/10/2026

## Resultado comprobado

La ficha predeterminada en español de Latinoamérica de la app existente **Dónde Rinde** se actualizó y mostró **Se guardaron los cambios**. La descripción incluye lista con teclado, inventario, compras parciales pendientes, historial de importes registrados y comparación por producto/sucursal con fecha y fuente. Conserva el ícono definitivo y los límites de cobertura. No anuncia reconocimiento por voz/foto ni disponibilidad en la tienda de Apple.

Descripción breve guardada: «Compará precios, armá tu lista y organizá tu despensa y tus compras.»

El panel continúa en **7 de 11** tareas. Faltan acceso de revisión, público objetivo, Seguridad de los datos y capturas para la ficha. El texto guardado no sustituye las dos capturas requeridas. No hay paquete subido, envío a revisión ni publicación Android nuevos. Web 170 sigue publicada, según consulta al alojamiento realizada durante este avance.

Al salir de la ficha, la consola pidió descartar cambios no guardados pese al aviso anterior de guardado; se salió después de observar ese aviso de éxito. La reapertura para comprobar persistencia no se completó durante este avance. El alcance verificado es el guardado informado por la consola, no una nueva lectura de la ficha.

## Seguridad de los datos: borrador avanzado al paso 3 de 5

La lectura del formulario fue rechazada por la revisión automática de seguridad del navegador. Informó falta de autorización del origen y mencionó `google.play`, distinto del dominio oficial `play.google.com` usado en la sesión anterior. Se detuvo la lectura bloqueada y se continuó trabajo independiente. Después, una comprobación de solo la URL de la pestaña confirmó el dominio oficial `https://play.google.com`; la lectura posterior del mismo formulario fue autorizada y se pudo continuar. No se navegó a `google.play`. El bloqueo de origen quedó resuelto.

La revisión de fuente identifica estos tratamientos para preparar el formulario. Se dejó una selección inicial de 9 tipos: ubicación aproximada/precisa, nombre, correo, ID de usuario, otra información personal (preferencia de jubilado/pensionado), historial de compras, fotos opcionales y dispositivo/otros IDs. Faltan completar las categorías de actividad/diagnóstico, resolver contacto/dirección comercial y documentar recopilado/compartido y finalidades por tipo. Las categorías y finalidades definitivas requieren cotejar todo el recorrido y las condiciones efectivas de los proveedores; esta tabla no es una declaración enviada.

| Tratamiento actual | Evidencia de código en web 170 | Criterio preparado |
| --- | --- | --- |
| Cuenta: nombre, correo e identificadores | Google Identity, vinculación de perfil y cuenta | Hay recopilación. Google es opcional para comparar; necesario para guardar/recuperar la despensa. No se recopila su contraseña. |
| Localidad, país orientativo y GPS cuando se solicita | Selector de ubicación, `app/api/location/route.ts`, eventos de acceso | Separar ubicación aproximada y precisa. La elección manual no elimina los registros de conexión del alojamiento. Resolver el alcance de envío a Georef al declarar compartido. |
| Inventario, listas, compras y gastos registrados | `app/api/pantry/route.ts`, herramientas de compra | Historial de compras y contenido aportado por el usuario. No hay integración de cuentas bancarias ni números de tarjeta. |
| Fotos opcionales guardadas manualmente | `AddProduct` en `app/page.tsx`, campo de imagen del producto | Las imágenes siguen recopilándose si el usuario las adjunta. Pausar reconocimiento no permite declarar ausencia de fotos. |
| Reconocimiento de voz/foto y texto por IA | `lib/recognition-availability.mjs`, panel sin montar y rutas bloqueadas | No se ofrece en el alcance actual. No hay nuevos audios ni transcripciones enviados por el recorrido vigente. No significa que los proveedores hayan borrado envíos anteriores. |
| Búsquedas, preferencias y condición de jubilado/pensionado elegida | Memoria y `components/market-personal-tools.tsx` | Considerar búsquedas, interacciones y otra información personal. La memoria puede desactivarse; no todos los registros operativos tienen el mismo control. |
| Reclamos y propuestas comerciales | Formularios de solicitudes y comercios | Nombres, correos y contenido aportado. El campo de contacto público del comercio admite información de contacto; cotejar teléfono/dirección y su relación con el usuario antes de resolver categorías. |
| Eventos de actividad, fallos y dispositivo | `app/notifications.ts`, `app-feedback`, cookie de dispositivo | Interacciones, diagnósticos e identificadores se revisan aunque sean opacos. No equivale a integrar un SDK publicitario ni a datos anónimos por defecto. |

Para cifrado en tránsito, la fuente revisada utiliza HTTPS entre el dispositivo y el sitio; Android declara `usesCleartextTraffic=false` y un origen HTTPS. Google Identity, la consulta geográfica y Resend tienen destinos HTTPS en el código. La voz del navegador está pausada. Esto sustenta preparar **Sí** para este alcance de transporte, separado de cifrado de extremo a extremo, conservación, contratos o eliminación externa. Se seleccionó **Sí** en Console, se conservó OAuth y los enlaces de eliminación, y se guardó el borrador. El paso de seguridad quedó completo y la consola permitió avanzar al paso 3 de 5.

Google define cifrado en tránsito para el flujo dispositivo-servidor e incluye HTTPS/TLS como técnicas habituales. También distingue recopilación de la excepción de compartido aplicable a proveedores que actúan únicamente por cuenta del desarrollador. No se adopta una excepción universal sin verificar esas condiciones. [Ayuda oficial consultada el 22/10/2026](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

El acceso de revisión sigue necesitando credenciales o recursos dedicados, repetibles y válidos desde otras ubicaciones; escribir únicamente «ingresar con Google» no resuelve ese requisito. [Requisitos oficiales](https://support.google.com/googleplay/android-developer/answer/15748846?hl=en-en). No se comparte la cuenta personal del titular.

## Primer video del frente 32

Se produjo `Donde_Rinde_promocion_borrador_01.mp4`: **30 segundos, 1080 × 1920, 30 fps, H.264/AAC**, con logo aprobado, seis escenas de beneficios y música sintetizada original. El archivo se entregó para revisión; no se publicó en redes. No tiene locución ni video generado mediante un modelo externo. El guion para una pieza posterior con capturas reales y voz con IA sigue en el plan de difusión.

El video usa textos y gráficos; no presenta pantallas simuladas como capturas de la app. Está identificado como borrador anterior al lanzamiento y el cierre dice «Próximamente en Google Play». La versión pública posterior deberá utilizar el enlace verificado y revisar nuevamente disponibilidad y funciones.

Comprobaciones: decodificación completa aprobada, 900 fotogramas, seis escenas inspeccionadas, audio sin saturación y formato compatible con reproductores habituales. [Metadatos y hash](VIDEO_PROMOCION_01_2026-10-22.json). Producción reproducible con `scripts/create-promo-video.py`; requiere Pillow, numpy y ffmpeg disponibles, sin instalar ni descargar dependencias automáticamente.

Costo ejecutado de esta pieza: **0 llamadas de API, 0 activos pagos y 0 pauta contratada**. No se crearon cuentas, se enviaron mensajes ni se aceptaron contratos nuevos. Los 31 frentes originales mantienen sus límites; el frente 32 ahora tiene un borrador audiovisual concreto para revisar.

## Actualización posterior: paso 4 y nueva interrupción

Se observó el paso 4/5 con 16 tipos, incorporando actividad, diagnósticos, fallas y preferencias financieras heredadas. El guardado posterior quedó en «Enviando…» y no se verificó su persistencia. Una captura del titular documenta una nueva denegación de la revisión automática de ChatGPT por dominio no verificado/riesgo alto; el acceso del navegador se mantiene en pausa. El bloqueo previo resuelto descrito arriba no equivale a autorización de esta nueva acción. La matriz técnica y la secuencia para retomar están en [el punto de reanudación](PLAY_SEGURIDAD_CHECKPOINT_2026-10-22.md). No se completó ni envió la declaración.
