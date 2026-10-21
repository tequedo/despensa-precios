# Clave de carga bajo control del titular

Procedimiento del 21/10/2026 para el primer piloto de Dónde Rinde. Python 3.11 o superior y un **JDK 17 completo** de un proveedor oficial son suficientes para firmar el AAB ya compilado en CI. No hace falta instalar Android Studio ni el SDK para esta operación. El equipo debe ser propio o de confianza, con almacenamiento cifrado y sin grabación de terminal.

La herramienta no se conecta a Internet, no carga claves a GitHub, no acepta acuerdos y no envía paquetes a Play. Su contraseña se pide sin mostrarla; no se guarda ni se pasa como argumento de un proceso. La clave PKCS12 se cifra con esa contraseña. El certificado y su huella son públicos; la clave y contraseña son privados. El entorno de los procesos Java contiene la contraseña mientras se ejecutan: no usar un equipo compartido o comprometido.

## 1. Crear la clave y su respaldo

Ejecutar desde el repositorio en la computadora del titular. Usar dos rutas absolutas **nuevas**, fuera de cualquier checkout; los directorios padre deben existir. Recomendación: carpeta principal en un disco cifrado y respaldo en otra unidad cifrada. Dos carpetas en el mismo disco no protegen frente a su pérdida.

```bash
python3 mobile/android/upload-key.py create \
  --directory /RUTA-PRIVADA/donde-rinde-upload \
  --backup-directory /OTRA-UNIDAD-PRIVADA/donde-rinde-upload-respaldo
```

En Windows, usar `py -3` y rutas absolutas propias entre comillas. Elegir una contraseña única de al menos 16 caracteres ASCII visibles, compatible con PKCS12, y guardarla en el gestor de contraseñas del titular. No enviarla por chat ni correo. No adjuntar `upload.p12` a un issue, un commit o una conversación. La herramienta no puede comprobar el cifrado ni la separación física de las unidades; son responsabilidad del titular.

Se crean `upload.p12`, `upload-certificate.pem` y `upload-metadata.json` en ambas ubicaciones y se compara su SHA-256. La clave es RSA de 3072 bits y el certificado dura 10.000 días, con nombre genérico sin domicilio, teléfono o identificación fiscal. La herramienta se detiene si las carpetas existen: **no regenerar una clave ya utilizada** por encontrar un error o perder una contraseña. Recuperar el respaldo y, cuando corresponda, usar el procedimiento de restablecimiento de clave de carga de Play.

Si una operación falla después de crear archivos, conservarlos y revisar la causa antes de repetirla. No sobrescribe ni borra automáticamente una clave parcial.

## 2. Firmar el artefacto de CI revisado

Descargar el artefacto de la compilación verificada en el [PR 13](https://github.com/tequedo/despensa-precios/pull/13). Compilación de referencia: workflow `39670052662`, artefacto `12379881040`, fuente `550f022a9f2bb37e5f59f129dc4ee062054e0ff5`. El artefacto temporal de GitHub vence el 04/11/2026; si no está disponible, volver a compilar la fuente revisada y registrar el SHA-256 nuevo. **No usar el hash anterior para un bundle nuevo.**

SHA-256 del `app-release.aab` de esa compilación, antes de firmar:

```text
504d7273c943b25be198ec1b69ed58d384a26ccb2fb8005da34bc46a382d0fff
```

Usar la huella pública impresa al crear la clave, que también figura en `upload-metadata.json`. Confirmar antes en Play Console que se mantendrá `ar.rindecasa.app`; el nombre visible es Dónde Rinde. La herramienta rechaza un manifiesto de otro paquete, pero no decide la identidad comercial por el titular.

```bash
python3 mobile/android/upload-key.py sign \
  --directory /RUTA-PRIVADA/donde-rinde-upload \
  --backup-directory /OTRA-UNIDAD-PRIVADA/donde-rinde-upload-respaldo \
  --bundle /DESCARGAS/app-release.aab \
  --output /ENTREGAS/donde-rinde-upload.aab \
  --bundle-sha256 504d7273c943b25be198ec1b69ed58d384a26ccb2fb8005da34bc46a382d0fff \
  --upload-sha256 HUELLA-PUBLICA-REAL-DE-64-CARACTERES
```

Comprobaciones: respaldo idéntico, hash del artefacto de entrada, paquete del manifiesto protobuf, ausencia de firmas anteriores, firma JAR de todos los archivos de contenido, certificado esperado vigente y RSA de al menos 3072 bits, ausencia de entradas duplicadas y contenido idéntico antes/después de firmar. Se usa el verificador de Java, leyendo cada entrada completa, y se rechazan también archivos añadidos sin firma. Solo se escribe el AAB de salida después de verificarlo; no se reemplaza una salida existente.

El informe `donde-rinde-upload.verification.json` contiene hashes y resultado, sin contraseña ni clave. Puede compartirse junto al AAB firmado y certificado público para continuar el lanzamiento. No acredita una revisión de Google, licencias, exportación, funcionamiento físico o aprobación de producción.

## 3. Después del primer bundle

El certificado de **carga** no sustituye al certificado de **distribución** que use Google Play. Obtener los certificados reales en Play Console y publicar la asociación `/.well-known/assetlinks.json` con esas huellas; comprobar la TWA y los recorridos de permisos, sesión y borrado en un Android real. No generar esa asociación a partir de una huella de prueba. Completar luego ficha, políticas, acceso de revisión y prueba cerrada.

Estado al preparar este procedimiento: **no se creó una clave del titular ni se firmó un AAB de lanzamiento**. Las pruebas automáticas usan claves desechables y ZIPs sintéticos; nunca se usan para el paquete público.

Fuentes: [firma Android y separación de claves](https://developer.android.com/studio/publish/app-signing), [keytool del JDK 17](https://docs.oracle.com/en/java/javase/17/docs/specs/man/keytool.html), [verificación de JarFile](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/jar/JarFile.html).
