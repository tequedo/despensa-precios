# SEPA: alternativas de salida para revisión

Fecha: 22 de octubre de 2026. Ventana 1: precios, fuentes y promociones.

## Resultado y alcance

El acceso oficial sigue **pendiente de habilitación y comprobación**. No hay una IP
reservada confirmada ni una autorización de SEPA para los rangos de este informe.
El alta de la infraestructura inicialmente prevista sigue sin confirmarse.

Esta entrega agrega documentación y una instantánea de rangos públicos de GitHub.
No despliega infraestructura, contrata servicios, envía correos, modifica la web,
integra cambios en `main` ni cambia automatizaciones existentes.

Rama: `ventana1/sepa-acceso-oficial-20261022`.
Estado inicial de esta ampliación: commit
`371678a2bdea2ec525953602cc722e19faa70a8c`.
Se consultó `origin/main` en
`20b4da450f1502eb44da1c742c7de16d063ecf4b`: sus cambios respecto del punto de
partida `33018c809a495a0fd48ef6518760aa8640d677f4` no afectan los documentos,
scripts ni workflows revisados. No se fusionó ese estado sobre esta rama.

El procedimiento y las réplicas ya documentadas permanecen en
[ACCESO_OFICIAL_2026-10-22.md](ACCESO_OFICIAL_2026-10-22.md).

## 1. Rangos de los runners actuales de GitHub

El proceso de precios existente utiliza `ubuntu-latest`. GitHub publica los
rangos de sus runners alojados en la clave `actions` de
<https://api.github.com/meta>. Es una alternativa **para consultar al operador de
SEPA**, que admite evaluar IP de salida o un listado completo de rangos. La
solicitud de información del operador no constituye una autorización.

Instantánea preparada:

- Archivo: [candidatos/github-actions-cidrs-2026-10-22.txt](candidatos/github-actions-cidrs-2026-10-22.txt).
- Observación: `2026-10-22T16:01:51.375564Z` (13:01:51 de Argentina).
- Respuesta HTTP: 200; fuente: API pública oficial de GitHub, sin autenticación.
- Campo extraído: `actions`, completo, ordenado por familia y dirección de red.
- Contenido: 7.081 CIDR únicos; 5.553 IPv4 y 1.528 IPv6; un CIDR por línea.
- Tamaño del archivo: 120.403 bytes, ASCII, salto de línea final.
- SHA-256 del archivo: `e2551d3d18209a2db067b3f5f9bdd6959d59dd34ad4803324e20e8b06777e961`.
- SHA-256 de la respuesta JSON original: `e62928d716bc199bba3638a8124830cbba82856702499f30f14ec08ba916c852`.
- ETag de la respuesta: `W/"d232dd9cd14a94ab6a99fd879433454c873038af3faa73ea163deca5bd6bb950"`.

La lista representa infraestructura compartida de GitHub; no identifica una IP
exclusiva de Dónde Rinde. No se seleccionó un subconjunto a partir de una única
ejecución. La instantánea no garantiza el origen de ejecuciones futuras.

GitHub indica que actualiza estos rangos semanalmente y **desaconseja usar la
lista completa como lista de acceso por su amplitud**. Recomienda runners con IP
estática o infraestructura propia para ese caso. Por ello, la lista adjunta no se
presenta como una solución estable aprobada ni como recomendación de autorizar
miles de redes sin revisión del operador.

Pregunta técnica pendiente para SEPA: ¿acepta esta lista compartida y cuál sería
el procedimiento autorizado para incorporar sus cambios? Antes de cualquier
presentación o prueba posterior debe revalidarse la lista contra la API oficial.
Si el operador necesita una IP o conjunto reducido de IP estables, esta opción no
cumple ese requisito por sí sola.

Fuente primaria:
<https://docs.github.com/en/actions/reference/runners/github-hosted-runners>.

## 2. Render: rangos por región y límite de una retransmisión del ZIP

Render documenta conjuntos de rangos de salida por región, compartidos entre
servicios. Los rangos exactos de un servicio se obtienen en su panel, en
`Connect > Outbound`. No se creó ni seleccionó un servicio para este informe y
no se obtuvo un conjunto concreto para solicitar su habilitación. Una IP
dedicada y los rangos regionales compartidos son prestaciones diferentes.

Una retransmisión del ZIP original hacia GitHub puede superar la transferencia
incluida en el espacio Hobby gratuito:

| Dato | Valor y alcance |
| --- | --- |
| Transferencia saliente incluida en Hobby | 5 GB por mes, compartidos por el espacio de trabajo |
| Tamaño del último ZIP declarado por la réplica consultada | 320.321.828 bytes |
| Una retransmisión de ese tamaño por día durante 30 días | 9.609.654.840 bytes, aproximadamente 9,61 GB |
| Una retransmisión por día durante 31 días | 9.929.976.668 bytes, aproximadamente 9,93 GB |

La proyección no incluye reintentos ni otro tráfico. La respuesta HTTP que
entrega un archivo desde Render cuenta como transferencia saliente. Si hay un
método de pago, el exceso puede facturarse; sin él, el servicio puede suspenderse.
Además, los servicios web gratuitos se detienen tras inactividad y tienen
almacenamiento efímero y límites adicionales de tráfico iniciado por el servicio.
No se verificó el plan ni la facturación de ninguna cuenta particular.

**No se considera resuelta una retransmisión diaria gratuita y estable del ZIP
completo mediante esta opción.** Procesar los datos en el propio servicio y
devolver un resultado pequeño sería otra arquitectura: requeriría revisar
memoria, conservación del original, trazabilidad, transporte seguro y contrato
de ingestión antes de implementarla. No se aprobó ni implementó ese cambio.

El tamaño anterior procede de metadatos de la **réplica**, no de una descarga
independiente del original oficial:

- Fuente consultada: <https://raw.githubusercontent.com/catdevnull/sepa-precios-metadata/main/dataset-info.json>.
- Observación: `2026-10-22T15:59:19.037090Z` (12:59:19 de Argentina), HTTP 200.
- Dataset declarado: `6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5`.
- Recurso declarado: `Miércoles`, ID `1e92cd42-4f94-4071-a165-62c4cb2ce23c`.
- Última modificación declarada: `2026-10-21T16:19:34.488222`.
- Revisión declarada: `47b7d367-68c3-4fd1-8a4d-911c564ecbc4`.

Esta consulta no demuestra igualdad entre réplica y original ni precios del día
22. El presupuesto es ilustrativo y depende del tamaño real de cada descarga.

Fuentes primarias de Render:

- <https://render.com/docs/outbound-ip-addresses>
- <https://render.com/docs/outbound-bandwidth>
- <https://render.com/docs/free>

## 3. Contratos y coordinación con ventanas 2 y 3

El contrato actual no cambia: el proceso obtiene los datos, conserva su
procedencia y publica por los mecanismos existentes; la app consume los datos
publicados. Se mantienen `evidenceVersion: 2` y los controles de producto,
presentación, sucursal, provincia, canal físico, fechas y evidencia reciente.
Ningún consumidor carga el archivo de CIDR adjunto: es material de revisión.

Los consumidores potencialmente afectados por una infraestructura distinta
serían `update-san-juan.mjs`, `.github/workflows/update-prices.yml`,
`.github/workflows/audit-official-sepa.yml` y el mecanismo de ingestión de la app.
Cambiar transporte, API, JSON o ejecución requerirá un contrato propuesto y
coordinación previa con las otras ventanas. `render.yaml` contiene un cron de
plan `starter`; su presencia no demuestra que exista un servicio gratuito activo.

El diagnóstico existente `scripts/sepa_egress_probe.py` verifica una IPv4
esperada. No acredita autorización sobre un CIDR compartido. Configurar
`SEPA_RUNNER` en el workflow manual de diagnóstico tampoco modifica el runner del
workflow de precios de producción. No se modificaron esos archivos ni variables.
No se habilitó un runner persistente para un repositorio público.

Ventana 2: revisar cualquier propuesta posterior de transporte o runner, sus
credenciales y el consumo desde la app. Ventana 3: coordinar la integración y las
condiciones de reutilización, sin confundir una habilitación de red con permiso
para cualquier uso de los datos. No hay cambios pendientes en `app/page.tsx` por
esta entrega.

## 4. Verificación y pendientes

| Estado | Resultado real |
| --- | --- |
| Implementado | Informe y lista candidata de CIDR; sin cambios ejecutables |
| Probado automáticamente | Lectura de la API, formato canónico, unicidad, conteos, SHA-256, tamaño, proyección de transferencia y revisión de diferencias de Git |
| Comprobado en producción | Ningún cambio de producción realizado ni nuevo acceso oficial acreditado por esta entrega |
| Pendiente de validación | Aceptación del operador, origen de salida efectivo, lectura del catálogo y descarga completa del ZIP oficial desde el proceso autorizado |
| Pendiente de tiempo | Siete días reales consecutivos de adquisición, publicación y lectura verificadas |

No se repitieron pruebas de cálculo promocional por cambios exclusivamente
documentales. Las pruebas del diagnóstico registradas en la entrega anterior
mantienen su alcance; no prueban conectividad autorizada en producción.

Una vez habilitada una salida concreta: comprobar catálogo y ZIP desde ese
origen, conservar original y metadatos, contrastar las réplicas y observar la
publicación y lectura con las automatizaciones existentes. Siete días de
estabilidad se declaran únicamente después de transcurridos y con evidencia.

Requieren intervención externa la aceptación de los rangos por SEPA o la
provisión de una salida estable alternativa. No se envió ninguna nueva consulta
ni se aceptaron acuerdos o cargos para obtenerlas.
