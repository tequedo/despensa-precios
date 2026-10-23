# Cierres técnicos comprobados — 23/10/2026

## Ingreso y recuperación web (parte del frente 13)

En el sitio publicado se completó el ingreso real con Google mediante el formulario seguro, sin leer, guardar ni registrar la contraseña. La recuperación del proveedor exigió confirmación en el teléfono. Google terminó esa verificación; la solicitud original de la app había vencido. El botón normal de reintento obtuvo una solicitud nueva y se eligió la misma cuenta ya verificada.

La app mostró identidad de Google, despensa previamente vinculada, Abrir mi despensa y Cerrar sesión o cambiar de cuenta. Se comprobó la recuperación de la vinculación existente sin fabricar sesión, token ni perfil y sin modificar la despensa.

**Subtarea terminada:** ingreso y recuperación de la vinculación mediante Google en navegador web. **No acredita:** funcionamiento físico Android, un acceso dedicado reutilizable de los revisores ni borrado/restauración externa. La cuenta autenticada no se considera dedicada por el solo hecho de haber ingresado; no se compartieron sus credenciales en Play.

## Inventario legal y marca (parte del frente 18)

El inventario anterior nombraba los iconos históricos, mientras que el manifiesto y el código ya referenciaban la marca v2. El generador ahora obtiene las referencias de marca del manifiesto web y de literales locales en app/components TypeScript. Conserva archivo, hash, tamaño y referencias, con el alcance estático explícito. Incluye los cinco archivos referenciados de la identidad actual.

Se asociaron a sus versiones exactas siete avisos suplementarios ya retenidos, de cuatro proyectos. Se comprueba hash y referencia inmutable; esa asociación **no limpia automáticamente** la falta del aviso propio de un paquete ni certifica compatibilidad o derechos de distribución.

Se añadió un control previo a cada compilación: detecta diferencias entre lock, inventario técnico y público; versiones ausentes/duplicadas; bytes de avisos; evidencias suplementarias y archivos de marca. La fecha de la página de licencias se obtiene del inventario para evitar otra fecha estática desactualizada.

**Subtarea terminada:** coherencia reproducible del inventario y de la marca, con bloqueo de publicación ante discrepancias. El inventario comprende 879 entradas del lock, 678 instaladas en esta revisión y 631 con aviso propio retenido. Conserva 143 avisos de componentes incorporados, 342 textos distintos y siete entradas con aviso suplementario. No declara que las 879 tengan toda obligación de distribución resuelta. Las 89 imágenes de productos sin permiso documentado continúan suspendidas.

## Validación ejecutada

- La comprobación nueva detectó primero el inventario de marca antiguo y la falta de evidencia enlazada.
- Siete regresiones cubren lock/versiones, cambio de bytes de marca, icono nuevo, avisos truncados, divergencia del inventario público y referencia mutable de upstream.
- Suite web completa: **306 aprobadas, 0 fallos, 0 omitidas**. TypeScript y compilación aprobados.
- Se cotejaron los ocho archivos de salida correspondientes a inventario público, avisos y cinco elementos de marca con sus fuentes; coinciden byte por byte.
- Sin dependencias nuevas, cambios de base, secretos, rutas de reconocimiento o llamadas pagas. No se enviaron correos reales de prueba.

## Restauración y límites que continúan (C3; frentes 15/16/20)

El registro de revocaciones y los recibos están en la misma D1 que la despensa. Restaurar una copia anterior puede perder esas barreras. El procedimiento existente exige preservar y reaplicar las revocaciones antes de reabrir acceso; no se comprobó una restauración admitida por el alojamiento ni un registro independiente autoritativo. No se restauró una base real y C3 **sigue abierto**. No se sustituye esa evidencia por una simulación con una lista de borrados supuesta.

## Publicación y seguimiento

La versión y el commit publicados se registran tras el éxito del alojamiento en el estado canónico de `tequedo/despensa-precios`, `docs/integration/ESTADO_UNICO_31_2026-10-22.json`. Este documento acredita lo validado y sus límites; no declara un envío de Android ni sustituye los 31 criterios completos.

### Publicación efectivamente comprobada

- Web **172**, fuente `dbfc57ed1916ed21e4f925dda5c8044479679cf3`.
- Versión de alojamiento `appgprj_6a9c53ae66f4819182c306fba4c263ca~appgver_a4b2128900f08191b042c3ebbbf60900`.
- Despliegue `appgdep_6adade5333d08191935e7528e177623b`, resultado terminal **succeeded**. No se alteró la audiencia pública, las dependencias, la configuración de secretos ni la base de datos.
- Android permanece en borrador; no se subió un AAB ni se envió la app a revisión.

### Reanudación de Play Console

El diálogo de instrucciones de acceso tiene texto preparado, pero no se agregó ni guardó: falta acreditar una cuenta exclusiva de pruebas y un acceso repetible para revisores. El ingreso web comprobado corresponde a la cuenta que el usuario recuperó; no se infiere su finalidad ni se comparten sus credenciales.

La declaración de Seguridad de los datos conserva 16/16 tipos completos y guardados, vista previa en paso 5/5, sin envío. Público objetivo/contenido requiere completar antes el acceso. No se marcó acceso completo ni se sustituyeron esos requisitos por una cuenta personal.

El [mapa legal y fiscal](PROTECCION_LEGAL_Y_FISCAL_2026-10-23.md) explicita P28-ARCA y separa sus comprobaciones de las de INPI y DNDA. Ningún registro legal o fiscal se da por presentado por el despliegue de web 172.
