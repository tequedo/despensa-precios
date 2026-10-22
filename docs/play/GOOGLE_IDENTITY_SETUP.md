# Activar la cuenta opcional con Google

Configuración para la web publicada de Dónde Rinde, revisada el 21/10/2026. La comparación de precios funciona sin registro. La integración de Google está implementada, pero **no está activa**: falta un cliente propio y una prueba completa. La configuración no cambia la cuenta de Play ni convierte a ChatGPT en proveedor de acceso para los consumidores.

## Datos exactos para Google Auth Platform

| Campo | Valor o criterio |
| --- | --- |
| Proyecto | Proyecto de Dónde Rinde controlado por el titular; reutilizarlo si ya existe. |
| Tipo de cliente | **Aplicación web**. La TWA muestra esta web; no sustituirlo por un cliente Android. |
| Nombre visible | Dónde Rinde. |
| Origen JavaScript autorizado | `https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site` |
| URI de redirección | No agregar una por suposición: el código actual recibe la credencial mediante callback JavaScript, no un redirect OAuth. |
| Acceso a datos | Solo `openid`, `email` y `profile` para identificar la cuenta. Sin permisos de Gmail, Drive, contactos o pagos. |
| Página principal | El origen anterior, con `/`. |
| Privacidad | El mismo origen más `/legal/privacidad`. |
| Términos | El mismo origen más `/legal/terminos`. |
| Soporte | Correo del proyecto que el titular acepte mostrar; Google lo hace visible durante el consentimiento. No usar el teléfono privado como contacto público. |

Crear o seleccionar el proyecto y usar **Google Auth Platform → Branding, Audience, Data Access y Clients**, según la interfaz disponible. El origen lleva esquema y host, sin ruta, comodines o barra final. El nombre, enlaces y permisos deben coincidir con el comportamiento real.

No afirmar propiedad de `chatgpt.site`: el proyecto controla su sitio alojado, no acredita propiedad del dominio principal. Si Google exige verificar un dominio para la marca o los enlaces, resolver la verificación admitida o un dominio propio antes de presentar esa marca como aprobada. No comprar un dominio ni activar facturación para resolverlo sin una decisión del titular. Usar scopes básicos no autoriza a ignorar los requisitos que muestre Google; comprobar el estado real de la aplicación y sus límites de prueba.

## Qué se necesita compartir para activarlo

Únicamente el **Client ID web**, de la forma `…apps.googleusercontent.com`, junto con confirmación de que el origen y los permisos anteriores están configurados. El Client ID es un identificador público y la web lo entrega al navegador. **No compartir el Client Secret, contraseña, códigos de verificación o archivos de credenciales.** Esta implementación verifica ID tokens y no utiliza un Client Secret.

En el entorno de la web se configurará `GOOGLE_CLIENT_ID`. La clave privada de sesiones `ACCOUNT_SESSION_SECRET` ya está configurada: conservarla, sin escribirla en el repositorio ni reemplazarla innecesariamente. Cambiar el Client ID puede invalidar sesiones previas; coordinar cualquier cambio posterior.

## Comprobación antes de anunciar la función

1. La comparación pública sigue funcionando sin una cuenta y no carga el SDK de Google por una consulta de precios.
2. En `/cuenta`, el botón oficial de Google reemplaza el aviso de configuración pendiente. Se prueban aceptación y cancelación, con una cuenta autorizada para ese entorno.
3. El servidor valida firma, emisor, destinatario, nonce, vencimiento y correo verificado. No se acepta un token de otro cliente.
4. Crear una despensa, recuperarla desde otra sesión con la misma cuenta y comprobar que una segunda cuenta no accede a ella. La migración de una despensa anterior exige una acción explícita con ambas identidades verificadas.
5. Probar cierre y cambio de cuenta, cancelación de permisos y borrado desde el recorrido publicado. No usar la cuenta personal del titular como credencial para revisores.
6. Repetir el recorrido en la instalación Android firmada. Verificar por separado que Google permita el acceso de los usuarios previstos; tener un Client ID no acredita aprobación pública ni una marca verificada.

Estado de acceso observado: Google Cloud mostró «Site Unavailable» en el navegador de trabajo. No se creó un cliente ni se aceptaron acuerdos de Google para suplirlo. Play Console sí está accesible; ese acceso no permite administrar automáticamente clientes OAuth de Cloud.

Fuentes: [configuración oficial de Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [clientes OAuth](https://support.google.com/cloud/answer/15549257), [verificación de OAuth](https://support.google.com/cloud/answer/13463073) y [requisitos de marca y dominio](https://support.google.com/cloud/answer/13464321).
