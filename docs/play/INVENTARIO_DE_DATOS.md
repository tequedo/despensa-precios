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

## Solicitud implementada, eliminación pendiente

[URL pública](https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site/legal/eliminar-cuenta) y enlace desde Mi cuenta publicados en web 137. Canal probado localmente para registrar y seguir pedidos. El correo escrito no demuestra control de perfil. Una recepción no se presenta como borrado: no hay ejecución integral auditada y el panel bloquea resolver artificialmente el pedido.

Falta proteger contra escrituras en vuelo/recreación, cubrir todas las tablas y referencias JSON, separar retención legal justificada, verificar respaldos, correos/proveedores y copias locales. No ejecutar borrados de usuarios reales como prueba. No declarar a Play que el requisito está cumplido por la mera URL.

Completar responsable/domicilio/contacto, entidades proveedoras, retención y transferencias; política definitiva y formulario de Play deben corresponder al funcionamiento real. La TWA y el permiso de cámara no permiten afirmar que no se recopilan datos.

Fuentes: [Google Play, eliminación](https://support.google.com/googleplay/android-developer/answer/13327111) y [AAIP, derechos](https://www.argentina.gob.ar/aaip/datospersonales/derechos), consultadas el 10/10/2026.
