# Recorrido integrado de cuenta, lista, compra y borrado

Revisión del 26/10/2026. Base: web 178, fuente `5ee506adcc21c9a1cf6ef66de6e9945d05f78436`. Se agregan cuatro regresiones al artefacto compilado, una guía física vigente y una advertencia de archivo en la guía del 22/10. No se cambia el comportamiento ni la estética de la aplicación.

## Qué se comprobó

`tests/account-journey-worker.test.mjs` ejecuta el router del Worker construido, las migraciones, las cookies de la app y las transacciones sobre SQLite descartable. Sólo sustituye el binding de entorno de Cloudflare. Las peticiones privadas usan sesiones de la app firmadas con una clave efímera local; no usan el permiso del importador ni simulan una respuesta satisfactoria de Google. No se verificó un inicio OAuth real ni se utilizaron credenciales del titular o del revisor.

| Caso integrado | Resultado observado |
| --- | --- |
| Guardar/compartir, recibir parcialmente y confirmar importes | La lista conserva 3 unidades y 0,75 kg. Recibir 1 unidad sin importe deja 2 pendientes y ningún gasto. Confirmar las otras 2 y 0,25 kg crea sólo los dos importes ficticios indicados, total 1.500, y conserva 0,50 kg pendientes. La lista guardada no se reescribe. |
| Recuperación, aislamiento y sesión | Una nueva sesión local y un contenedor de cookies vacío recuperan la despensa por la misma identidad de ensayo. Una segunda identidad con el mismo nombre/correo no accede a sus datos. Se rechazan escrituras de otro perfil, orígenes ajenos y sesiones vencidas; cerrar sesión corta acceso privado. |
| Borrado y recreación | Preparar sin confirmar conserva datos. Otra cuenta no puede confirmar el borrado. La confirmación propia borra la despensa, revoca el enlace y las escrituras antiguas, mantiene a la otra cuenta y permite una nueva despensa vacía. El comprobante conserva `external_pending` y no declara eliminadas las copias externas ni la cuenta del proveedor. Una copia de lista que el destinatario guardó por separado sigue perteneciendo a éste. |
| Interrupción de un lote y reintento | Un fallo SQLite provocado durante el segundo producto revierte stock, importes y comprobante. Al retirar el fallo, el mismo intento se completa una vez; repetirlo no duplica movimientos ni gastos. |

Todos los datos son ficticios y locales. No se ejecutaron altas, compras, borrados, restauraciones ni envíos de correo en producción. Se bloquearon las salidas HTTP durante estos cuatro casos; ninguna fue intentada. Los avisos de correo no configurado del entorno de ensayo no se presentan como una validación de entrega del proveedor.

## Comprobaciones de esta revisión

| Control | Resultado |
| --- | --- |
| Suite completa, sobre el Worker construido | 330 aprobadas; 0 fallos; 0 omitidas; 0 canceladas |
| Nuevas regresiones integradas | 4, incluidas en las 330 |
| TypeScript | Sin errores |
| Compilación | Aprobada |
| Coherencia técnica de inventario legal previa a compilar | 879 entradas, 5 archivos de marca y 7 componentes suplementarios coherentes; no acredita todos los derechos de distribución |

Repetición desde el checkout con dependencias instaladas:

```sh
npm run build
node --test --test-concurrency=1 --test-reporter=tap tests/*.test.mjs
```

La ejecución secuencial conserva un resumen TAP completo y reproducible. La suite también incluye las regresiones anteriores de precios, reconocimiento pausado, compras y restauración. No se incorpora el log bruto al repositorio, pues contiene detalles temporales del ejecutor sin valor como datos de usuarios.

## Guía física corregida y límites

La guía vigente es [`docs/qa/PRUEBA_FISICA_ACTUAL.md`](../qa/PRUEBA_FISICA_ACTUAL.md). Mantiene la instalación/arranque y la comparación Natura ya confirmadas por el titular; pide verificar la compacidad posterior y el resto en Samsung y otro teléfono. Retira como instrucciones vigentes las pruebas de reconocimiento pago y las advertencias de C1/C2 que ya estaban corregidas. La guía anterior se conserva señalada como histórica.

Este avance cierra la subcomprobación local del recorrido integrado. No cierra los frentes completos 8, 10, 13, 14, 15, 20 o 23: faltan, según corresponda, navegador alojado, Google real desde otro contexto, dispositivos físicos, Android firmado, entrega de correo, restauración alojada, registro independiente de revocaciones y copias externas. No se ejecutaron nuevas pruebas visuales ni operaciones de Play Console, INPI, DNDA o ARCA. Los porcentajes generales conservan su criterio anterior.
