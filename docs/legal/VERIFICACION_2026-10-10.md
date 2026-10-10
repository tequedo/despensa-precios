# RINDECASA — verificación de controles legales

Fecha: 10/10/2026. Fuente de partida: versión web 136, commit `678d1a704941fe24c48608784ebdae3487e06fe3`.

## Comprobado localmente

Compilación Vinext completa y `npm test`: **166 pruebas aprobadas, 0 fallos**. Resultado posterior a la corrección de una expectativa de test sobre la URL absoluta de redirección. `git diff --check` aprobado.

Los tests nuevos usan SQLite en memoria con las migraciones reales y rutas transpiladas. Se comprueban: consentimiento y origen, validación, límite de solicitudes, reintento idempotente, hash del recibo, separación del caso por secreto, campos privados excluidos, panel y escritura sólo del titular, referencias tomadas del control del perfil, evidencia necesaria para resolver y bloqueo de falso cierre de eliminación. No crean reclamos de usuarios reales ni envían correos.

Los controles de campañas se comprueban con pago/condiciones insuficientes, acuerdo o permiso faltante, referencias privadas omitidas en el anuncio público y campañas antiguas que intentan eludir el permiso. Las fotos externas quedan ocultas sin evidencia; se conservan fotos de producto aportadas como datos y se bloquean esquemas ajenos a los admitidos.

El worker compilado devuelve las seis rutas legales públicas; el panel sin cuenta redirige al inicio de sesión y una cuenta diferente ve acceso denegado. Las pruebas previas de inventario, recuperación, precios, promociones y captura también siguen aprobadas.

## No comprobado por esta verificación

No se hizo una revisión visual en navegador ni una prueba física Android, cámara o micrófono. No se creó una solicitud real en producción. El despliegue se valida por el estado terminal del servicio y se registra por separado; el test de worker local no prueba por sí mismo publicación ni recepción real.

No se verifica autoría/titularidad legal sólo con hashes ni compatibilidad de todas las licencias. No hay presentación INPI/DNDA, pago, campaña comercial aceptada o envío a Play. No hay eliminación integral de cuenta/proveedores/respaldos certificada; sólo registro y seguimiento del pedido.
