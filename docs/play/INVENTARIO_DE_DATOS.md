# RINDECASA — inventario previo a Seguridad de los datos

Revisión ampliada de fuente web al 10/10/2026, web 137, commit `a943af13f6b5f0cc6591b65797c88ca667e5704c`. Documento de trabajo; no es política definitiva ni declaración enviada a Google. [Mapa detallado](../legal/PRIVACIDAD_DATOS_BORRADOR.md).

| Datos observados | Uso/control | Pendiente antes de declarar |
|---|---|---|
| Cuenta, ID, nombre y correo disponibles; perfil invitado | Vinculación en account_profiles; cookie opaca, separación por cuenta | Responsable/contacto, retención; suprimir vínculo y evitar acceso con cookie antigua sin borrar ChatGPT |
| Inventario, fotos guardadas, compras, cantidades, consumo y listas | Base por perfil | Borrado completo de relaciones, fotografías y copias locales |
| Memoria de productos/marcas, preferencias y favoritos | Persistencia por perfil y controles de borrado/desactivación | El opt-out y borrado de memoria no equivalen a eliminación total |
| Provincia, localidad, coordenadas | Selección manual o GPS; copia del navegador; consulta Georef | Proveedores, logs y precisión/retención; no presumir procesamiento sólo en Argentina |
| Foto/texto/audio para reconocimiento | OpenAI o servicio de voz del navegador según método; aviso antes de captura y alternativa manual | Contratos, transferencias y plazos; store:false no prueba retención cero |
| Accesos, dispositivo, país, agente, actividad y errores | Diagnóstico, avisos y resúmenes operativos | Necesidad, destinatarios, proveedor de correo y copias externas ya entregadas |
| Feedback y solicitudes de derechos/usuarios/anunciantes | market_reports; referencias privadas de perfil/cuenta en JSON; hash del recibo, respuesta y evidencia | Atención real, plazos legales, conservación, recuperación de recibos y supresión vinculada por JSON |
| Consulta comercial: comercio/contacto/localidad/nota | Permiso específico de contacto; retiro mediante secreto separado | Retención efectiva; no usar para marketing general |
| Campañas y referencias de acuerdo/materiales | Sólo panel del titular conserva referencias; pieza pública limitada | Documentos privados y aceptación; no publicar contratos ni identificación personal |
| Métricas publicitarias | Deduplicación sesión/evento/día; payload campaña/día/evento, hash en ID | No son ventas/personas únicas ni certificado antifraude; fijar retención |
| Lista offline/localidad/sesión en navegador | Copias locales con finalidad concreta | Explicar y probar borrado en cada dispositivo; solicitud al servidor no elimina copias exportadas |

## Eliminación activa publicada y copias externas pendientes

La web 138 publicó la preparación del borrado, confirmación específica y eliminación atómica de la base activa por perfil controlado. Incluye relaciones de inventario, compras, consumo, listas, memoria, preferencias, dispositivos, actividad y referencias JSON de reclamos. Revoca el perfil e impide escrituras antiguas; ante fallo revierte toda la operación. Se limpian las copias locales conocidas del navegador que confirma, si su almacenamiento lo permite.

La web 139 sigue mostrando y probando ese alcance: 175 pruebas locales aprobadas. No se borró una cuenta real como prueba. El recibo separa base activa eliminada de supresión integral y conserva seguimiento privado. La solicitud asistida no ejecuta el borrado por sí sola. No se elimina ChatGPT ni las copias de otro teléfono desde este navegador.

Falta confirmar retención del recibo/guardia de revocación y completar respaldos, correos, proveedores, otros dispositivos y excepciones legales específicas. No declarar a Play eliminación integral ni cumplimiento global por la URL o las pruebas parciales.

Completar responsable/domicilio/contacto, proveedores, retención y transferencias; política definitiva y formulario de Play deben corresponder al tratamiento real. Los datos privados recuperados del titular no se publican en este repositorio. La TWA y el permiso de cámara no permiten afirmar que no se recopilan datos.

Fuentes: [Google Play, eliminación](https://support.google.com/googleplay/android-developer/answer/13327111) y [AAIP, derechos](https://www.argentina.gob.ar/aaip/datospersonales/derechos), consultadas el 10/10/2026.
