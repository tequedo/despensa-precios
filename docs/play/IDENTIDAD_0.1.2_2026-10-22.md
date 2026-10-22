# Identidad Android 0.1.2 — 22 de octubre de 2026

El usuario autorizó aplicar y publicar el trabajo integrado de las tres ventanas,
incluido el logo definitivo. La integración general quedó incorporada mediante
PR17. Este cambio completa la coherencia del icono nativo con la identidad web
aprobada: casa con D azul y R naranja.

La geometría del VectorDrawable se conserva directamente del SVG web
`public/brand/donde-rinde-icon-v2.svg` del Site, fuente
`753215f2075f8dfd41464b91fddf735a5fc69297`. Se mantienen el encuadre,
traslación, colores, contorno blanco y regla de relleno de la R.

La compilación se identifica como 0.1.2, código 3. El paquete de producción sigue
siendo `ar.rindecasa.app` y el de prueba `ar.rindecasa.app.preview`.

El cambio no sustituye la firma de producción, la asociación de certificados ni
los pasos de revisión y publicación en Google Play. La validación de compilación,
licencias, firma de prueba y arranque corresponde al flujo CI de esta revisión;
su resultado debe comprobarse antes de incorporar la revisión a main.
