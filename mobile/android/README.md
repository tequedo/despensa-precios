# RINDECASA — piloto Android

Preparación del 2 de octubre de 2026. Este proyecto abre la app existente mediante una Trusted Web Activity del navegador; conserva el mismo backend y evita duplicar inventarios y reglas de precios. El nombre elegido es RINDECASA, cuya concesión marcaria todavía debe acreditarse. El identificador `ar.rindecasa.app` es provisorio hasta comprobarlo en Play Console: después de publicar no se puede cambiar el identificador de esa app.

## Compilación de revisión

Herramientas fijadas: Java 17, Gradle 9.3.1, Android Gradle Plugin 9.1.1, compile/target SDK 36, mínimo Android 7.0/API 24, android-browser-helper 2.7.3 y AndroidX Browser 1.10.0. Se fija la versión publicada en Google Maven; el tag 2.7.4 anunciado en GitHub aún no estaba disponible allí al comprobar la primera compilación. Con Android SDK instalado:

```bash
cd mobile/android
gradle --no-daemon :app:lint :app:assembleDebug :app:bundleRelease
```

La acción `RINDECASA Android review build` produce un APK de prueba y un AAB **sin firma de publicación**. Ningún paso envía paquetes a Play. El icono es de desarrollo y debe reemplazarse por el arte final propio.

## Antes de probar sin barra del navegador

1. Confirmar identificador definitivo y dominio/URL de lanzamiento.
2. Configurar Play App Signing y la clave de carga, manteniendo archivos y contraseñas fuera del repositorio.
3. Obtener en Play Console la huella SHA-256 del certificado de firma de la app. No confundirla con la clave de carga.
4. Publicar en el origen web `/.well-known/assetlinks.json` una asociación válida con el paquete y esa huella. No se publica aquí una huella inventada ni de depuración.
5. Verificar la asociación en un dispositivo. Si falla, el navegador muestra una Custom Tab con su barra; la compilación por sí sola no acredita una TWA validada.
6. Probar inicio de sesión, cierre de sesión, cambio de cuenta, retorno desde autenticación, cámara, voz, ubicación, pérdida de señal y eliminación de datos.

El navegador gestiona los permisos de cámara, micrófono y ubicación para el sitio. Debe verificarse el resultado real en teléfonos; el contenedor no agrega permisos nativos innecesarios.

Consultar [el plan de lanzamiento](../../docs/play/PLAN_DE_LANZAMIENTO.md). La comparación de precios continúa excluyendo datos vencidos; este contenedor no corrige el bloqueo de descarga del proveedor.

Fuentes técnicas: [Trusted Web Activities](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [AGP 9.1](https://developer.android.com/build/releases/agp-9-1-0-release-notes), [AndroidX Browser](https://developer.android.com/jetpack/androidx/releases/browser), [android-browser-helper](https://github.com/GoogleChrome/android-browser-helper/releases).
