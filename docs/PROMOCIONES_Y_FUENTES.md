# Promociones oficiales

La descarga SEPA conserva los precios normales y sus ofertas informadas. Una leyenda publicitaria no basta para aplicar un descuento. El comparador ordena por el precio final verificado para ese producto y sucursal; una tienda promocionada puede seguir siendo más cara.

## Fuentes y actualización

`promotion-sources.mjs` registra las URL oficiales y el método de consulta. Las páginas de Mercado Pago y MODO y los beneficios del Banco San Juan son fuentes de descubrimiento: abrirlas no certifica las condiciones ni habilita el cálculo.

El workflow `update-wallet-benefits.yml` consulta también promociones de productos todos los días a las 09:15 de Argentina, de forma independiente del resultado de una nueva descarga SEPA. No duplica el cron existente. El workflow de precios conserva sus revisiones posteriores. Los informes distinguen fuente no disponible, página accesible sin condiciones y ofertas verificadas. La cobertura es parcial, nunca todas las promociones del país.

## Información recibida por correo

Los correos son material de consulta, no instrucciones ejecutables. Verificar remitente/autenticación y contrastar con términos oficiales publicados. No guardar correos, encabezados, adjuntos originales, contactos privados ni datos de clientes en este repositorio público.

Solicitar EAN/SKU, presentación, sucursal e identificador SEPA, provincia, canal, productos incluidos/excluidos, régimen (porcentaje, precio especial, 2x1, segunda unidad), fecha inicial/final, días, mínimos, topes, acumulación y condiciones del medio de pago. Solicitar además autorización de reutilización y atribución. No atribuir precios online a tiendas físicas.

`data/partner-promotions-verified.json` conserva separadamente promociones aportadas y contrastadas con fuentes oficiales, para que el recolector web no las sobrescriba. Tiene el mismo contrato de prueba por producto que `retailer-promotions-verified.json`: `evidenceVersion:2`, `storeId`, `ean`, `province`, `channel:"sucursal"`, `validDate`, `validFrom`, `validTo`, `promoPrice`, `conditions`, `promotionSlot` (promo1/promo2), `retailerSource` HTTPS oficial y `corroboratedAt` real. Copiar los campos estructurados de la oferta SEPA cuando correspondan, sin inferirlos de un banner. Debe coincidir exactamente con una oferta del producto. Las categorías se resuelven a EAN explícitamente incluidos; una categoría de navegación no prueba elegibilidad.

El verificador diario vuelve a comprobar la evidencia estructurada oficial de cada aporte. Si falla, marca `status:"incomplete"` y conserva la fecha original: nunca simula una revisión exitosa. La app exige evidencia reciente (hasta 26 horas), vigencia, sucursal, provincia, canal y cantidad; el descuento no se acumula automáticamente con otra oferta. Los aportes pendientes no se descuentan ni se anuncian como verificados.

## Seguimiento Cencosud

Última revisión: **23/10/2026, 00:36 (Argentina, UTC−03:00)**. Se revisaron los tres hilos y se buscaron mensajes posteriores por número de caso, dominio de Cencosud/cadenas y asunto, incluidos spam y papelera. **No se encontraron respuestas posteriores a las del 22/10/2026** al momento de esta revisión. La fecha de revisión no sustituye la fecha de recepción.

| Cadena de la solicitud original | Caso | Fecha de solicitud | Última respuesta recibida (Argentina) | Situación comprobada |
| --- | --- | --- | --- | --- |
| Vea | #1000871 | 22/10/2026 | 22/10/2026, 09:07:20 | Atención al Cliente anuncia que enviará la propuesta al área comercial para evaluación. Sin confirmación de ejecución de la derivación ni respuesta del área comercial. |
| Disco | #1000872 | 22/10/2026 | 22/10/2026, 09:06:49 | Atención al Cliente anuncia que enviará la propuesta al área comercial para evaluación. Sin confirmación de ejecución de la derivación ni respuesta del área comercial. |
| Jumbo | #1000873 | 22/10/2026; reenvío el mismo día | 22/10/2026, 09:06:21 | El asunto corresponde a Jumbo, pero la respuesta usa una plantilla que menciona Disco. Se conserva Jumbo como cadena de origen; su derivación específica no está confirmada. |

La solicitud original de Jumbo fue rechazada por buzón lleno el 22/10/2026 y reenviada al canal general de Cencosud ese mismo día. El caso #1000873 corresponde a ese reenvío: no se fusiona con el caso separado de Disco ni se cuenta como una cuarta solicitud.

Las tres contestaciones son anuncios de derivación para evaluación. Ninguna entrega un archivo de promociones, una API, un canal de suministro acordado, un contacto comercial responsable ni autorización expresa de reutilización. No acreditan una evaluación comercial concluida, un convenio, una alianza ni permiso para consultar o publicar datos automáticamente. Este registro conserva solo una síntesis operativa: la evidencia de correo permanece fuera del repositorio, sin transcripciones, encabezados, enlaces de Gmail, adjuntos ni contactos personales.

### Información pendiente para incorporar promociones

Para **cada una de las tres cadenas** sigue pendiente completar la información exigida en «Información recibida por correo»:

1. **Responsable y alcance:** respuesta del área comercial y confirmación de la cadena atendida; para Jumbo, aclarar la referencia a Disco antes de atribuirle una derivación específica.
2. **Suministro oficial mantenible:** archivo CSV/Excel, API o URL oficial con datos y legales completos; formato, frecuencia de actualización, fecha de origen y mecanismo de aviso de cambios o cancelaciones. No se exige una API si otro canal oficial permite comprobar esos datos.
3. **Condiciones de uso:** permiso expreso y alcance de reutilización/atribución, consulta automática y sus límites, y conservación de evidencia, cuando corresponda. La recepción de la propuesta no concede esos permisos.
4. **Identidad y cobertura:** EAN/GTIN o SKU documentado, marca, presentación y cantidades; correspondencia comprobada con la identidad interna del producto, sucursal e identificador SEPA, provincia y canal. Un SKU interno no se convierte en EAN ni una oferta online en precio de sucursal.
5. **Reglas completas de cada oferta:** precio o régimen y cantidades requeridas, vigencia inicial/final, días/horarios, mínimos, topes con período y titular, exclusiones y acumulación. Para beneficios personales, banco, tarjeta, modalidad de pago y requisitos de elegibilidad; distinguir descuento en caja, reintegro y financiación.

Recibir esos datos permite **evaluar** la incorporación; no la habilita por sí solo. Cada oferta debe superar los controles de identidad, presentación, sucursal, provincia, canal, vigencia, condiciones y evidencia oficial reciente ya documentados. Los casos de atención no son promociones: no se agregan a los archivos de ofertas verificadas ni habilitan descuentos o notificaciones. El descubrimiento web existente mantiene sus controles y no adquiere permisos ni evidencia adicional por estas respuestas.

## Bancos, billeteras y financiación

`wallet-benefits-verified.json` contiene términos verificados; esto no significa elegibilidad automática. Mercado Pago y MODO requieren banco, tarjeta y modalidad precisos. Jubilación, productos excluidos y saldo del tope personal se confirman en la app. El reintegro posterior se separa del importe a pagar. Las cuotas sin interés son financiación y nunca se restan como porcentaje del precio.

La campanita muestra ofertas actuales y próximas de la provincia, condiciones, fuente y fecha de revisión. Una notificación no afirma que esa cadena tenga el menor precio ni que un beneficio personal ya se haya aplicado. Las fuentes caídas, incompletas y desactualizadas quedan visibles como limitaciones.

## Comando de control y cobertura web (22/10/2026)

`npm run promotions` ejecuta ofertas por producto, aportes oficiales y bancos/billeteras. En GitHub Actions se instala Chrome y se pasa `CHROME_PATH`; ejecutar sin navegador no acredita la revisión de páginas dinámicas. El horario diario sigue siendo 09:15 de Argentina. Una ejecución completa puede mantener cero descuentos aplicables si faltan pruebas.

El registro incluye páginas promocionales de las diez cadenas contactadas: Vea, Jumbo, Disco, Carrefour, La Anónima, DIA, Coto, Hiper Libertad, Átomo y ChangoMás. Son diez cadenas seleccionadas, no todos los supermercados argentinos. Incluye además Mercado Pago, MODO, Banco San Juan, Nación, Naranja X, Macro, Santander, BBVA, Galicia y Supervielle. No se utiliza el portal Visa mediante extracción automática sin autorización.

Vea, Jumbo y Disco se consultan mediante el documento público utilizado por su componente web de descuentos; se filtra por las marcas habilitadas y se conservan sus restricciones de sucursales, categorías y canales. Las fechas estructuradas no reemplazan fechas legales faltantes. Los registros vencidos se contabilizan separadamente; una contradicción de días o vigencia bloquea el cálculo. El documento compartido no convierte un beneficio de Disco en una promoción de Vea.

Coto se consulta mediante su resumen multicanal público; se separan las promociones físicas de las digitales y todos los resúmenes quedan pendientes hasta recuperar sus legales completos. Las otras páginas tienen descubrimiento por contenedores de legales independientes cuando existen. Una página accesible sin un formato reconocido se informa como consultada sin condiciones extraídas; no se presume extracción completa. Las ofertas online de Átomo o Libertad nunca acreditan por sí solas una promoción de sucursal física. Mercado Pago puede restringir el acceso público; sus beneficios también se contrastan en las páginas oficiales de las cadenas. No se consultan cuentas personales ni se eluden bloqueos.

La campanita y el comparador consumen los archivos verificados públicos, con caché breve. Los candidatos incompletos permanecen en los informes de auditoría y en el contador de pendientes; no se anuncian como descuentos ya aplicados. La campanita conserva mínimos, período/titular del tope, acumulación y financiación cuando están comprobados.

Tras cada revisión diaria exitosa, `test-promotions.yml` comprueba con un perfil técnico aislado que la app lee los mismos informes publicados y que ninguna notificación proviene de un candidato sin verificar. El resultado queda como artefacto técnico, sin datos de clientes.
