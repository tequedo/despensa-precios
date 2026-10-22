# Acceso oficial SEPA: entrega de ventana 1, 22/10/2026

## Estado y alcance

**El acceso oficial todavía no está habilitado ni comprobado.** Se confirmó
el requisito técnico comunicado por soporte el 21/10: identificar la IP pública
de salida o la lista completa de IP/rangos CIDR cuando existan varias salidas.
Esa información permite solicitar su validación; no equivale a una autorización
concedida ni a una descarga exitosa. Se conserva el hilo en el correo del titular;
no se copian mensajes, encabezados ni datos privados a este repositorio público.

Base de esta entrega: `33018c809a495a0fd48ef6518760aa8640d677f4`, rama aislada
`ventana1/sepa-acceso-oficial-20261022`. La rama anterior de promociones
`ventana1/precios-fuentes-20261022` permanece separada; esta entrega no la reemplaza.

La decisión recuperada del titular es Oracle Cloud Always Free, sin cargos
automáticos. No hay una instancia, cuenta activada o IPv4 reservada comprobada
en esta sesión. Buscar un correo de activación sin encontrarlo no prueba que
la cuenta no exista. Las entradas oficiales de alta y acceso a Oracle mostraron
«Site Unavailable» en el navegador disponible, aun tras una recarga del alta.
No se observó un formulario de acceso, CAPTCHA ni causa técnica suficiente para
atribuir el fallo a un bloqueo contra automatización.

## Última evidencia de producción revisada

Fuente: commit base de esta entrega y
[ejecución 39778870063](https://github.com/tequedo/despensa-precios/actions/runs/39778870063).

| Comprobación | Resultado observado |
| --- | --- |
| Catálogo oficial, 22/10 13:01:19.670 UTC | HTTP 403, BunkerWeb, solicitud `c9f13484cfd287ac762dd03b38fd0915` |
| ZIP diario oficial, 22/10 13:01:21.054 UTC | HTTP 403, BunkerWeb, solicitud `6ccfcf229f7703140b8a3ac6ef5c3d51` |
| Respaldo seleccionado | Réplica catdevnull; recurso modificado 21/10 16:19:34.488 UTC |
| Revisión de la réplica | `47b7d367-68c3-4fd1-8a4d-911c564ecbc4` |
| Fecha interna del precio observada | 21/10; la generación del informe el 22/10 no cambia esa fecha |
| Continuidad diaria confirmada | 0 días; siete días reales siguen pendientes |

La integridad de la réplica se controla; falta cotejarla con el ZIP oficial
adquirido independientemente. La IP medida anteriormente en un runner alojado
por GitHub no es una IP fija y no se presenta como tal.

## Implementado: diagnóstico portátil del servidor designado

`scripts/sepa_egress_probe.py` puede ejecutarse por SSH en el servidor que vaya
a descargar SEPA. Requiere Python 3 y curl. Recibe la IPv4 que el proveedor asignó
al servidor; no crea recursos ni solicita credenciales. Ejemplo con variable que
el operador debe completar con la dirección real, sin usar una IP de ejemplo:

```sh
python3 scripts/sepa_egress_probe.py --expected-ip "$SEPA_RESERVED_IPV4" --output artifacts/sepa-egress-probe.json
```

Mide la salida directa IPv4 en dos servicios independientes y exige que ambas
observaciones coincidan con la dirección esperada. Si una falla o discrepa, no
consulta SEPA. Si coinciden, hace una sola consulta al catálogo oficial, valida
identidad y estructura CKAN y conserva el código HTTP, la protección observada
y el identificador técnico del rechazo cuando existe. No sigue redirecciones,
reintenta un 403, usa proxies, cambia IPs ni desactiva TLS. Ignora configuraciones
personales de curl que pudieran alterar esas restricciones.

El informe local se crea con permisos `0600`, rechaza reemplazos y enlaces
simbólicos y queda bajo `artifacts/`, que ya está ignorado por git. No publica
la IP en consola; el operador puede compartir la evidencia con soporte cuando
el titular autorice ese envío. No conservar HTML, cookies ni encabezados libres.

Contrato nuevo, exclusivamente local y sin consumidores de producción:

- `expectedEgressObserved` acredita únicamente las dos mediciones de esa ejecución.
- `fixedIpVerified:false` requiere comprobación independiente de la reserva y
  asignación en el proveedor; pasar `--expected-ip` no la acredita.
- `operatorAuthorizationConfirmed:false` requiere la respuesta de habilitación
  del operador, fuera de este diagnóstico.
- `officialMetadata.metadataValid` exige HTTP 200 y el conjunto SEPA esperado.
- `officialArchiveDownloaded:false` y `productionUpdated:false` se conservan
  siempre: este comando no adquiere ZIP, importa, publica ni notifica.
- Código de salida 0: coincidencia de salida y catálogo válido; 1: acceso o
  medición no comprobados; 2: argumentos o escritura local no válidos.

No cambia APIs, formatos `data/*.json`, `evidenceVersion:2`, migraciones, horarios
ni workflows. El diagnóstico existente de Actions permanece disponible; una
ejecución allí mide ese runner y no acredita la salida del servidor Oracle.

## Secuencia para completar la habilitación

1. **Acceso personal pendiente.** Si ya existe la cuenta Oracle, recuperar su
   acceso a la consola. Si no existe, el titular completa el alta, verificación
   y aceptación de condiciones directamente con Oracle. No enviar contraseñas,
   tarjetas, códigos de verificación ni claves privadas por el chat.
2. **Aprovisionamiento pendiente.** Comprobar el cupo disponible de Always Free
   en la región principal y la etiqueta de gratuidad de la configuración completa.
   Usar únicamente ese cupo; no actualizar a una cuenta paga ni contratar otra
   forma cuando no haya capacidad. La documentación consultada publica A1 con
   hasta 2 OCPU/12 GB y 200 GB combinados de volúmenes dentro del cupo gratuito;
   comprobar el uso existente antes de asignar recursos.
3. **IP pendiente.** Crear una IPv4 pública de tipo **Reserved**, asociada a la
   IP privada de la VNIC del servidor en subred pública con salida por Internet
   Gateway. Conservar evidencia privada de la reserva, región y asignación.
   Una IP efímera no puede convertirse conservando su dirección. No incorporar
   NAT, proxy o intermediarios que cambien la IP que verá SEPA.
4. **Medición pendiente.** Ejecutar el diagnóstico anterior desde ese servidor.
   No ejecutarlo desde el portátil, este entorno de trabajo o Actions como si
   fueran el servidor. Una respuesta HTTP 403 no se elude: se conserva y se
   informa al operador por el canal de soporte ya abierto.
5. **Envío y decisión externa pendientes.** Preparar IP o todos los rangos de
   salida, zona horaria, horario y frecuencia de adquisición, URL del catálogo
   y ZIP requeridos, fecha UTC e identificador de rechazo. Confirmar con soporte
   alcance de la habilitación, límites y condiciones de reutilización. No se
   envió un nuevo correo ni se aceptó un acuerdo en esta sesión.
6. **Validación real pendiente.** Después de la confirmación, descargar con el
   adquirente existente: `node scripts/download-official-sepa.mjs` (opción
   `--compare-replica` para cotejar la réplica). Conservar ZIP original, catálogos,
   SHA-256, revisión y fechas internas; este comando tampoco publica precios.
7. **Coordinación con ventanas 2 y 3.** Elegir un único proceso de adquisición y
   transporte autenticado hacia el flujo actual. El workflow de precios usa
   `ubuntu-latest`: configurar únicamente la variable `SEPA_RUNNER` del diagnóstico
   no traslada la descarga de producción. No registrar automáticamente un runner
   persistente en el repositorio público; la documentación de GitHub advierte
   del riesgo de ejecutar código no confiable. Conservar los horarios existentes
   y evitar dos publicadores. La integración de permisos, secretos o workflows
   se propone y coordina antes de aplicarla.
8. **Aceptación pendiente.** Comprobar importación, publicación y lectura de la
   nueva generación desde la app, conservando fecha interna actual, provincia,
   canal, sucursal y producto. Registrar siete fechas argentinas consecutivas
   reales de adquisición, publicación y lectura. Un catálogo accesible, un ZIP
   válido o siete pruebas el mismo día no acreditan siete días de estabilidad.

Oracle puede recuperar instancias gratuitas consideradas inactivas; la reserva
de IP y la medición no garantizan disponibilidad permanente. El historial debe
mostrar las interrupciones reales. No generar carga artificial para eludir
las reglas del proveedor.

## Pruebas y entrega

Comando: `python3 -m unittest discover -s tests -p test_sepa_egress_probe.py -v`.
Siete pruebas locales aprobaron con respuestas de red simuladas: divergencia
de IP impide consultar SEPA, un 403 no se reintenta ni se interpreta como éxito,
HTTP 200 con HTML u otro conjunto se rechaza, las IP privadas/IPv6 se rechazan,
no se conservan datos libres del rechazo y el informe no sobrescribe archivos.
Las direcciones de esas pruebas no son servidores aprovisionados.

También aprobó `npm run check`: 129 pruebas JavaScript existentes, sin fallos.
Estos resultados verifican el código con casos controlados; no acreditan acceso
real desde Oracle ni una nueva descarga oficial.

Archivos de esta entrega: este documento, `scripts/sepa_egress_probe.py` y
`tests/test_sepa_egress_probe.py`. Implementación probada automáticamente;
**no ejecutada en Oracle, no comprobada en producción y acceso oficial pendiente**.
No se modificó ni desplegó el sitio. No se cambió código en `main`.

## Documentación oficial consultada el 22/10/2026

- [Oracle Always Free: recursos y recuperación de instancias](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [Oracle: direcciones públicas y requisitos de salida directa](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm)
- [Oracle: crear una dirección pública reservada](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/reserved-public-ip-create.htm)
- [Oracle: alta de la cuenta gratuita](https://signup.cloud.oracle.com/)
- [Oracle: acceso a la consola](https://www.oracle.com/cloud/sign-in.html)
- [GitHub: acceso y riesgos de runners propios](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access)

Los documentos históricos de recuperación conservan el estado que tenían en su
fecha. Esta revisión no declara vigentes las antiguas observaciones sobre una
réplica detenida ni toma el antiguo criterio de dos días como el objetivo actual
de siete días solicitado por el titular.
