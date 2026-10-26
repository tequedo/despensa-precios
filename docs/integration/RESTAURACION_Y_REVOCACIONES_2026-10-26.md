# Restauración y revocaciones — 26/10/2026

Frentes 15, 16 y 20; cruce C3. **Estado: herramienta de conciliación preparada y probada localmente; dependencia del alojamiento abierta.**

## Resultado comprobado

La copia anterior al borrado contiene la cuenta, sus vínculos y su despensa. El registro `profile_erasure_guards` está dentro de esa misma D1: recuperar la copia también puede perder la revocación posterior. Las barreras contra escrituras antiguas no solucionan por sí solas ese retroceso.

Se reprodujo el caso con un archivo físico de SQLite, todas las migraciones del proyecto y datos descartables. Se tomó la copia mediante `VACUUM INTO`, se ejecutó después el borrado real de la aplicación y se exportó su revocación efectiva. Al abrir otra copia del archivo anterior, volvieron la cuenta y su producto; la exportación posterior se conservó en otro archivo. La conciliación volvió a retirar la cuenta y todas las clases de datos contempladas por el borrado, sin cambiar otra cuenta ni los datos públicos. Esto es una prueba de recuperación de SQLite, **no una ejecución de Time Travel ni una certificación de D1 alojada**.

## Implementación

- `lib/account-erasure.mjs` comparte las sentencias de eliminación entre el borrado normal y la conciliación para evitar alcances divergentes.
- `lib/erasure-restoration.mjs` exporta los códigos revocados, la referencia técnica de la operación y su fecha. No copia nombres, correos, despensas, fotos ni secretos de seguimiento.
- La exportación identifica el proyecto y tiene una huella SHA-256. Se comprueban formato, fechas, códigos, duplicados, alteraciones y respuestas truncadas antes de escribir. La huella prueba integridad de los bytes: **no autentica el origen ni demuestra que el registro sea completo o esté actualizado**.
- La reaplicación conserva las demás revocaciones y usa una transacción por perfil. Puede repetirse; un fallo revierte la transacción afectada. Si hay varios perfiles, otros lotes anteriores pueden haber terminado: mantener el acceso cerrado y repetir el conjunto tras corregir el fallo.
- La conciliación no salta el borrado porque ya exista la barrera. Retira los datos que una copia haya repuesto y conserva el bloqueo frente a nuevas escrituras con el código anterior.
- No se agregó una ruta pública, una tarea automática de restauración ni otro proveedor. La primitiva necesita integración con un procedimiento de mantenimiento autorizado. No conserva por sí misma un registro independiente continuamente actualizado ni reconstruye los secretos o notas de recibos perdidos.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Recuperación física de SQLite y conciliación con revocación generada por el borrado real | Aprobada |
| Otra cuenta, sus datos y catálogo/precios públicos | Conservados |
| Reintento, revocaciones adicionales y cuenta nueva vacía | Aprobados |
| Fallo durante la conciliación y reintento posterior | Reversión y recuperación aprobadas |
| Proyecto incorrecto, alteraciones, duplicados, códigos inválidos y exportación truncada | Rechazados |
| Pruebas específicas de borrado, restauración y listas compartidas | 19 aprobadas; 0 fallos |
| Suite web completa | 312 aprobadas; 0 fallos; 0 omitidas |
| TypeScript y compilación | Aprobados |

En la base publicada se consultaron únicamente el esquema y la tabla de revocaciones mediante las herramientas de lectura de Sites. Se confirmó el binding `DB` y la tabla `profile_erasure_guards`; la lectura devolvió **0 filas**, sin truncamiento ni páginas pendientes. Es una observación puntual: no demuestra ausencia histórica de borrados, continuidad futura ni un respaldo completo. No se ejecutaron escrituras, borrados ni restauraciones de datos reales para esta validación.

## Condiciones para cerrar C3

1. Confirmar con el alojamiento la modalidad de restauración admitida para **este** proyecto y base, su ventana efectiva y quién puede ejecutarla. Las herramientas disponibles en esta sesión permiten consultar tablas; no ofrecen una operación de restauración.
2. Establecer un registro de revocaciones completo, protegido y recuperable **fuera del conjunto que se restaura**. Su mecanismo debe cubrir los borrados ya confirmados incluso si la base actual se pierde. Una exportación manual hecha después del incidente puede ser insuficiente.
3. Verificar un cierre efectivo de accesos y procesos en todos los puntos de entrada, incluidas solicitudes en curso y trabajos externos. Una variable o un paso escrito sin comprobación no acredita ese cierre.
4. Conservar la exportación final y la evidencia de su origen, integridad y corte temporal antes de restaurar. No usar la tabla de una base ya retrocedida como fuente completa de los borrados posteriores.
5. Recuperar una copia aislada por el mecanismo admitido, aplicar las migraciones necesarias y reaplicar todas las revocaciones posteriores. Verificar ausencia de datos, accesos y enlaces del perfil borrado; aislamiento de otra cuenta; bloqueo de escrituras viejas y creación de una despensa nueva vacía.
6. Reabrir acceso sólo después de esos controles. Registrar operador, fechas, referencias del respaldo y resultado; conservar evidencia mínima sin copiar datos personales innecesarios al repositorio.

La eliminación en correo, proveedores y copias de otros dispositivos conserva sus propias comprobaciones pendientes. Los frentes 15/16/20 no se declaran cerrados por esta prueba.

## Consulta preparada para el alojamiento — no enviada

Para el proyecto Dónde Rinde, necesitamos confirmar el procedimiento admitido de recuperación de su D1 administrada: ventana efectiva, permisos/canal para la operación y posibilidad de validarla en una base aislada. También necesitamos un método para detener todos los accesos y procesos durante la recuperación y un registro de revocaciones independiente de la base que se retrocede. Antes de reabrir debemos reaplicar los borrados posteriores al respaldo. Solicitamos instrucciones concretas y alcance de copias adicionales del alojamiento; no ejecutar una restauración de producción a partir de esta consulta.

## Referencia pública

[Cloudflare D1: Time Travel y respaldos](https://developers.cloudflare.com/d1/reference/time-travel/), consultado el 26/10/2026. La documentación advierte que la recuperación sobrescribe la base en su lugar. Las capacidades y condiciones generales de Cloudflare no prueban los permisos ni el procedimiento del proyecto administrado por Sites.

## Publicación

Web 174 publicada el 26/10/2026, fuente `3a1145063adc792e43e58f4fbb16bbee67d71069`. Despliegue `appgdep_6adf50ab8c488191924c26349c6973ae` confirmado como satisfactorio. Esta publicación incorpora la primitiva y el alcance compartido del borrado; no activa una restauración automática ni sustituye las condiciones pendientes de C3.
