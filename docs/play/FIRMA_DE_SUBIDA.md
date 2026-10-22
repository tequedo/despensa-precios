# Clave de carga bajo control del titular

**Actualización del 22/10/2026:** el AAB vigente es **0.1.2, código 3**,
`ar.rindecasa.app`, SHA-256
`e9a1b27830bd117bd6b02c1e637ff1a4315f18aec36ce7f6b7ee1864091f879d`.
Fuente revisada `300d0c87dadff02826bd0d0feca3d6964b444dbb`,
[CI 39828245411](https://github.com/tequedo/despensa-precios/actions/runs/39828245411),
artefacto `12446594671`. Compilación, licencias, firmas con claves desechables,
arranque y coexistencia de los dos paquetes de prueba aprobados. El AAB sigue
sin firma del titular. Las referencias 0.1.1/PR13 siguientes son antecedentes;
no seleccionar esos bundles para el lanzamiento actual.

## Asistente local para el titular

El asistente `mobile/android/firma-asistida.py` reúne los pasos ya verificados.
Comprueba el hash y el paquete antes de crear claves. Pide las rutas de clave,
respaldo y salida; la contraseña la solicita directamente la herramienta local,
oculta, sin pasar por el asistente ni por el chat. Permite usar una clave existente
y conserva la prohibición de sobrescribirla. No envía archivos a Google ni acepta
acuerdos. No acredita que las unidades estén cifradas o sean físicamente separadas.

1. En la computadora del titular, descargar la fuente de esta revisión y extraer
   el ZIP del AAB 0.1.2 preparado. Instalar Python 3.11+ y JDK 17 completo desde sus
   proveedores oficiales si faltan.
2. Abrir `mobile/android/INICIAR_FIRMA_WINDOWS.cmd` en Windows. En macOS, abrir una
   Terminal y ejecutar `python3 mobile/android/firma-asistida.py`; el archivo
   `INICIAR_FIRMA_MAC.command` ofrece el mismo inicio si conserva permiso de ejecución.
3. Indicar la ruta del AAB, elegir crear o reutilizar clave y completar las rutas
   privadas. Al crear, elegir dos carpetas nuevas en unidades separadas. La carpeta
   para el AAB firmado debe existir y quedar fuera del repositorio.
4. Guardar la contraseña en el gestor del titular. Para continuar la publicación
   sólo compartir el AAB firmado, su `.verification.json` y `upload-certificate.pem`.
   Nunca compartir `upload.p12`, la contraseña ni un ZIP de las carpetas privadas.

Comprobación sin crear claves ni firmar:

```bash
python3 mobile/android/firma-asistida.py --check-only --bundle /DESCARGAS/Donde_Rinde_Android_0.1.2_sin_firma.aab
```

El comprobante `reviewed-release.json` identifica el AAB revisado. Si se modifica
el contenedor o se selecciona otra compilación, actualizar la evidencia después
de verificar ese artefacto, nunca cambiar el hash para eludir un rechazo.

## Procedimiento individual y antecedentes

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

El piloto 0.1.0 anterior queda descartado para publicación por el fallo de inicio identificado el 21/10/2026. No firmar ni subir los artefactos antiguos `12379881040` o `12381885593`, ni reutilizar su hash `504d7273c943b25be198ec1b69ed58d384a26ccb2fb8005da34bc46a382d0fff` como paquete vigente.

Usar el AAB **release 0.1.2** revisado del [PR 19](https://github.com/tequedo/despensa-precios/pull/19), CI `39828245411`, artefacto `12446594671`, identificado en la actualización y en `reviewed-release.json`. El paquete de descarga ya contiene `Donde_Rinde_Android_0.1.2_sin_firma.aab`. Los hashes del ZIP exterior, del APK debug y del AAB son distintos: usar el del AAB de entrada. Si el artefacto venció, recompilar la misma fuente y verificar el nuevo contenido; no adivinar ni copiar el hash de otra compilación.

El APK **Dónde Rinde Prueba** usa el paquete `ar.rindecasa.app.preview` y sirve para la prueba privada. No es el bundle de publicación, que mantiene `ar.rindecasa.app`.

Usar la huella pública impresa al crear la clave, que también figura en `upload-metadata.json`. Confirmar antes en Play Console que se mantendrá `ar.rindecasa.app`; el nombre visible es Dónde Rinde. La herramienta rechaza un manifiesto de otro paquete, pero no decide la identidad comercial por el titular.

```bash
python3 mobile/android/upload-key.py sign \
  --directory /RUTA-PRIVADA/donde-rinde-upload \
  --backup-directory /OTRA-UNIDAD-PRIVADA/donde-rinde-upload-respaldo \
  --bundle /DESCARGAS/app-release.aab \
  --output /ENTREGAS/donde-rinde-upload.aab \
  --bundle-sha256 SHA256-REAL-DEL-AAB-RELEASE-VERIFICADO \
  --upload-sha256 HUELLA-PUBLICA-REAL-DE-64-CARACTERES
```

Comprobaciones: respaldo idéntico, hash del artefacto de entrada, paquete del manifiesto protobuf, ausencia de firmas anteriores, firma JAR de todos los archivos de contenido, certificado esperado vigente y RSA de al menos 3072 bits, ausencia de entradas duplicadas y contenido idéntico antes/después de firmar. Se usa el verificador de Java, leyendo cada entrada completa, y se rechazan también archivos añadidos sin firma. Solo se escribe el AAB de salida después de verificarlo; no se reemplaza una salida existente.

El informe `donde-rinde-upload.verification.json` contiene hashes y resultado, sin contraseña ni clave. Puede compartirse junto al AAB firmado y certificado público para continuar el lanzamiento. No acredita una revisión de Google, licencias, exportación, funcionamiento físico o aprobación de producción.

## 3. Después del primer bundle

El certificado de **carga** no sustituye al certificado de **distribución** que use Google Play. Obtener los certificados reales en Play Console y publicar la asociación `/.well-known/assetlinks.json` con esas huellas; comprobar la TWA y los recorridos de permisos, sesión y borrado en un Android real. No generar esa asociación a partir de una huella de prueba. Completar luego ficha, políticas, acceso de revisión y prueba cerrada.

Estado al preparar este procedimiento: **no se creó una clave del titular ni se firmó un AAB de lanzamiento**. Las pruebas automáticas usan claves desechables y ZIPs sintéticos; nunca se usan para el paquete público.

Fuentes: [firma Android y separación de claves](https://developer.android.com/studio/publish/app-signing), [keytool del JDK 17](https://docs.oracle.com/en/java/javase/17/docs/specs/man/keytool.html), [verificación de JarFile](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/jar/JarFile.html).
