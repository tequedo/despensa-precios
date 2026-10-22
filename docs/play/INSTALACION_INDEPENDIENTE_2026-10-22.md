# Prueba independiente de Android — 22 de octubre de 2026

El teléfono del titular muestra «No se instaló la app» al instalar el APK de
prueba 0.1.2. El mensaje no identifica la causa. La comparación de los archivos
anteriores conservados y del APK nuevo confirma certificados de prueba distintos;
una versión previa con el mismo paquete y otra firma no admite una actualización.
No se debe afirmar que ese sea el motivo exacto sin diagnóstico del dispositivo.

Se agrega la variante `compatibility`, identificador
`ar.rindecasa.app.preview012`, nombre visible «Dónde Rinde Prueba Nueva» y logo
aprobado. Puede convivir con `ar.rindecasa.app` y `ar.rindecasa.app.preview`.
No reemplaza ni elimina sus instalaciones o datos. Se mantiene la misma URL web;
el acceso y recuperación de datos del titular deben comprobarse en su teléfono.

La variante debug habitual se conserva. El paquete release de Google Play sigue
siendo `ar.rindecasa.app`, versión 0.1.2/código 3, con firma de producción
explícita pendiente de la clave bajo custodia del titular.

El flujo CI compila y verifica licencias, ejecuta la regresión de arranque tanto
para debug como para la prueba independiente y comprueba que ambos paquetes
queden instalados simultáneamente en el emulador API36. Esa evidencia no sustituye
la instalación real en Samsung, la recuperación de cuenta ni la aprobación Play.
