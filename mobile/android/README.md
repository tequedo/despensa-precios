# Dónde Rinde — piloto Android

Contenedor de la app existente mediante una Trusted Web Activity del navegador, con el mismo backend y reglas de precios. Nombre visible: **Dónde Rinde**. El identificador técnico es `ar.rindecasa.app`: se observó disponible en Play Console el 21/10/2026, pero todavía no se creó la ficha ni se publicó. Confirmarlo antes de la primera subida; cambiar el nombre visible no cambia ese identificador. No se afirma registro de marca concedido.

## Compilación y comprobación

Java 17, Gradle 9.3.1, Android Gradle Plugin 9.1.1, compile/target SDK 36, mínimo Android 7.0/API 24, android-browser-helper 2.7.3 y AndroidX Browser 1.10.0. Se fijan las versiones utilizadas por el piloto, sin cambiar dependencias como parte de la firma. Con Android SDK instalado:

```bash
cd mobile/android
gradle --no-daemon :app:lint :app:assembleDebug :app:bundleRelease
```

`Donde Rinde Android review build` genera un APK de depuración y un AAB de release **sin firma de carga**; conserva lint, dependencias resueltas y manifiestos. Ejecuta el preflight y pruebas de firma con claves desechables. No usa una clave del titular ni sube paquetes a Play. El APK de depuración no sirve como bundle de publicación.

## Firmar sin instalar Android Studio

El [procedimiento de clave de carga](../../docs/play/FIRMA_DE_SUBIDA.md) usa Python 3.11+ y un JDK 17 completo para generar una clave privada y verificar su respaldo en ubicaciones del titular, firmar una copia del AAB ya compilado y comprobar firma, certificado, paquete e integridad. No necesita Android SDK para esa operación. No pone contraseñas en argumentos, archivos o registros. Se ejecuta en la terminal del titular, no en este chat, y no hace solicitudes de red.

El script no reemplaza claves o paquetes existentes, rechaza rutas dentro de un repositorio y exige un respaldo idéntico antes de firmar. La separación física y el cifrado de las unidades deben comprobarse por el titular. **Aún no se creó una clave del titular ni se firmó un AAB de lanzamiento.** Las claves de pruebas no son claves de publicación.

También se conserva la vía de compilación firmada con Gradle. Requiere `RINDECASA_UPLOAD_KEYSTORE`, `RINDECASA_UPLOAD_STORE_PASSWORD`, `RINDECASA_UPLOAD_KEY_ALIAS`, `RINDECASA_UPLOAD_KEY_PASSWORD` y `RINDECASA_APPLICATION_ID_CONFIRMED=ar.rindecasa.app`, en un entorno privado. Operación explícita: `gradle --no-daemon -PrindecasaSignedRelease=true :app:bundleRelease`. Nunca usar la clave de depuración ni guardar estas entradas en el repositorio.

`node release-preflight.mjs` separa `readyForSignedBuild` de `readyForTwaVerification`: permite preparar el primer bundle con la clave de carga antes de que Play asigne o seleccione su certificado de distribución. Para verificar la TWA requiere además la huella real `RINDECASA_PLAY_SIGNING_SHA256` y una copia comprobada de la asociación pública `RINDECASA_ASSETLINKS_FILE`. Nunca declara lista una presentación en Play.

## Después de la primera subida

1. Obtener los certificados reales de **firma de la app en Play**, distintos del certificado de carga cuando corresponda.
2. Publicar `/.well-known/assetlinks.json` en el origen web con el paquete y esas huellas. No usar ejemplos, huellas de pruebas o del APK de depuración.
3. Probar la asociación en un teléfono. Si falla, el navegador muestra una Custom Tab con barra; compilar no acredita una TWA validada.
4. Probar comparación pública, autenticación opcional cuando esté activa, cierre/cambio de cuenta, retorno de autenticación, cámara, voz, ubicación, pérdida de señal, denuncia/bloqueo y eliminación de datos.
5. Completar ficha, datos, clasificación, acceso de revisión y prueba cerrada según Play Console. No afirmar cobertura, stock, pagos, actualización oficial SEPA o acceso Google que no se hayan comprobado.

El navegador gestiona cámara, micrófono y ubicación para el sitio. El contenedor no agrega permisos nativos de contactos, SMS o lectura del álbum completo. Las exclusiones de respaldo del contenedor no controlan los datos del navegador.

El icono instalado y el nombre se mantienen en la fuente Android; Outfit se usa bajo SIL OFL con la licencia incluida. La gráfica de la ficha y los controles de privacidad/contenido se mantienen en la fuente web. La compilación no acredita exclusividad marcaria ni resuelve las condiciones de las fuentes de precios.

Fuentes: [Trusted Web Activities](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [firma Android](https://developer.android.com/studio/publish/app-signing), [AGP 9.1](https://developer.android.com/build/releases/agp-9-1-0-release-notes), [AndroidX Browser](https://developer.android.com/jetpack/androidx/releases/browser).
