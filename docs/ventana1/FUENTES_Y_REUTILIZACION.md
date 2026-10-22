# Fuentes revisadas y ampliación preparada

Revisión: 22/10/2026. Este documento registra evidencia y trabajo pendiente; la evaluación legal final corresponde a ventana 3. No se enviaron mensajes ni se aceptaron acuerdos o suscripciones.

## SEPA y réplicas

| Fuente | Evidencia actual | Estado |
| --- | --- | --- |
| [Portal oficial minorista](https://datos.produccion.gob.ar/dataset/sepa-precios) y su API CKAN | El intento de producción y la consulta independiente del espacio de trabajo devolvieron 403. El informe conserva el rechazo, sin cambiar IP ni identidad | Acceso automático autorizado y estable pendiente |
| [Página oficial de acceso a SEPA](https://www.argentina.gob.ar/economia/industria-y-comercio/defensadelconsumidor/precios-sepa) | Publica entradas distintas para minoristas y mayoristas | No prueba disponibilidad del ZIP ni de una API alternativa |
| [Metadatos catdevnull](https://github.com/catdevnull/sepa-precios-metadata) | Metadatos actualizados el 21/10; réplica efectiva en Backblaze, manifiesto/hash de archivo y CSV en `sepa-provenance.json` | Integridad contrastada dentro de la réplica; original oficial no cotejado independientemente |
| [Archivador Preciazo](https://github.com/catdevnull/preciazo) | Se identificó el intermediario que produce la copia reempaquetada | No atribuirle carácter de descarga oficial |

La copia de `dataset-info.json` consultada declara CC-BY-4.0 para el conjunto original. Esa declaración proviene de metadatos replicados; el catálogo oficial permaneció inaccesible. La API de GitHub no identificó una licencia para los repositorios del intermediario en esta revisión; esto es una comprobación parcial, no una conclusión jurídica sobre los datos originales o el código. Ventana 3 debe confirmar alcance, atribución y condiciones por material. No se copiaron logos ni imágenes promocionales.

El canal de soporte publicado de SEPA ya tiene una gestión abierta. Queda pendiente la respuesta técnica sobre IP de origen estable u otro mecanismo autorizado. No se contrató infraestructura y no se envió un pedido duplicado. La IP fija por sí sola no equivale a autorización ni a estabilidad demostrada.

## Ampliación: mayoristas y comercios

Estas fuentes se localizaron y revisaron para preparar integración/contacto. **No se añadieron a los feeds productivos ni se publicaron cotizaciones sin evidencia suficiente.**

| Fuente oficial | Qué se comprobó | Contacto oficial preparado / bloqueo |
| --- | --- | --- |
| [Maxiconsumo: sucursales](https://www.maxiconsumo.com/sucursal_burzaco/sucursales/) | Lista San Juan en Ruta 40 km 3456. Distingue precios web y compra por bulto; el sitio advierte que sin sesión puede usar otra sucursal | Usar el canal comercial/sucursal del directorio. No atribuir precios anónimos de Moreno a San Juan ni precios web a góndola |
| [Makro: beneficios bancarios](https://makro.com.ar/beneficios-bancarios/) | Hay legales por beneficio y requisitos de cuenta/tarjeta, con topes distintos | [Formulario oficial](https://makro.com.ar/contacto/); pedir catálogo estructurado, identificación de tiendas y permiso de uso. No se confirmó por esta página una sucursal sanjuanina |
| [Diarco: ofertas](https://www.diarco.com.ar/ofertas/) y [promociones](https://www.diarco.com.ar/promociones/) | Diferencia formatos y exige elegir tienda/folleto | [Contacto](https://www.diarco.com.ar/contacto/). No se pudo confirmar una sucursal San Juan en el directorio consultado; la presencia de una provincia en un selector no la acredita |
| [Vital](https://www.vital.com.ar/) | Folletos semanales y selección de sucursal | [Contacto](https://www.vital.com.ar/contactos/) y [directorio](https://www.vital.com.ar/sucursales/). Falta cotización del EAN, presentación, tienda y régimen fiscal; no se acredita cobertura de San Juan |

Caso nuevo de descubrimiento: la página de Makro anuncia para octubre un beneficio de MODO los jueves, con límite mensual por banco y requisitos de cuenta/tarjeta. Se mantiene pendiente porque falta resolver la tienda, el alcance completo y la representación de límites múltiples. No se aplicó a productos ni a una compra real. Otro bloque de esa página contiene una oferta que terminaba el 21/10: una página accesible el 22/10 no la vuelve vigente.

## Otros bancos

- [Banco Hipotecario — beneficios](https://www.hipotecario.com.ar/beneficios/): fuente de descubrimiento separada de MODO. Requiere leer el legal individual, segmento, tarjeta, cuenta y topes. El portal publica restricciones de reproducción/almacenamiento: preparar autorización antes de incorporar sus textos a un feed propio. No se aceptaron condiciones en nombre del titular.
- [ICBC — beneficios](https://www.beneficios.icbc.com.ar/): se identificó el portal oficial. Falta verificar cada campaña y sus términos; no se reutilizan porcentajes de resultados de búsqueda ni beneficios de ICBC Mall como si fueran ofertas de supermercados físicos.

## Información a solicitar, sin envío realizado

Pedir a cada responsable comercial/técnico un canal estructurado o archivo mantenible con EAN/SKU y condición de identificador, marca/presentación/unidades, código de sucursal y correspondencia SEPA, provincia/canal, fechas internas y vigencia, precio/régimen, cantidades, impuestos, mínimos/cargos, exclusiones, acumulación y topes por operación/persona/cuenta/tarjeta/banco/período. Para billeteras: banco emisor, producto de tarjeta, modalidad QR/NFC y requisitos personales. Para mayoristas: precio del bulto y unitario, venta a consumidor final/categorizado y condiciones de retiro/entrega.

Solicitar permiso expreso para consulta automática, frecuencia/límites, conservación de evidencia, reutilización comercial de los datos y atribución. Una respuesta de derivación comercial no concede estos permisos ni verifica una promoción.
