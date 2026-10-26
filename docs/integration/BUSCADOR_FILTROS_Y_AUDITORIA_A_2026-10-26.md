# Buscador: filtros, densidad y primera revisión alfabética

Base publicada al comenzar: web 182, fuente `a6ec7c14fc3202537346d838debd3abfbcd64d3e`.

El titular mostró que Yogur y Cerveza desplegaban una lista grande pero mantenían deshabilitados Marca y Tamaño. La reproducción independiente con Agua en la web publicada confirmó ambos selectores deshabilitados y con una sola opción vacía. El componente dependía de los atajos locales y no recibía las facetas del catálogo real.

## Correcciones

- Los campos usan las marcas y tamaños del catálogo para productos fuera de los atajos. El catálogo ampliado también permite marcas que no están en la lista rápida.
- La familia escrita consulta opciones sin desplegar una lista extensa. Primero se pueden elegir marca y tamaño; después aparecen dos opciones exactas y Ver más opciones. Ver opciones del catálogo permite abrirlas voluntariamente antes de completar filtros.
- Los filtros aparecen antes de las sugerencias. Sus tarjetas reducen relleno y tipografía, conservan el nombre y todos los datos y mantienen un área táctil mínima de 44 píxeles CSS. No hay truncado de texto.
- Una marca o tamaño usados como filtro no eligen automáticamente un SKU diferente. La selección explícita conserva código, cantidad y consulta exacta. Cambiar de familia limpia filtros incompatibles; cambiar de marca limpia tamaño.
- Los resultados, facetas y paginación de una consulta anterior dejan de estar disponibles al cambiar consulta, filtros o zona. Las respuestas canceladas no reemplazan los nuevos resultados.
- Yogur y yogurt se reconocen como la misma familia, conservando la exclusión de productos cuya familia principal sea otra.
- El barrido detectó 154 entradas de la A con un Desde superior al menor precio cotizable del mismo producto en otra cadena. El catálogo ahora usa los mismos controles de identidad y presentación que la comparación para elegir ese mínimo y mostrar su sucursal y fecha. Los importes originales no se alteran. Se conservan los nombres y códigos locales para que sus búsquedas sigan encontrándolos, incluso si el mínimo pertenece a otra cadena.

Las correcciones se aplican al componente compartido por En casa, Mi lista y Precios, sin cambiar el cálculo de compra confirmada ni registrar cotizaciones como gastos.

## Alcance del primer barrido: letra A

Se fijaron los 14 archivos de `data/national/AR-J`, índice `89caada6631c5e50b659cfe4841e483a2dce02d7`, generado el 25/10/2026 a las 23:26:35.887Z, desde el commit `0ef2f12e9f80d3d8c0b1694fdbd39e94657c2067` del repositorio de datos. La copia contiene 22.026 observaciones provinciales. El navegador, en su selección habitual de San Juan Capital, consulta hasta 12 sucursales; el barrido local cubre los 14 archivos conservados.

| Control A | Resultado |
| --- | --- |
| Observaciones por sucursal | 1.691 |
| Códigos locales diferentes | 792 |
| Nombres tal como fueron informados | 659 |
| Búsquedas / páginas recorridas | 55 / 130 |
| Códigos encontrados | 792 |
| Cotizaciones comprobadas | 701 |
| Sin presentación suficientemente acreditada | 90; siguen sin un importe utilizable |
| Capacidad contradictoria de agua | 1; precio excluido hasta confirmar la presentación |
| Diferencias Desde/comparación antes / después | 154 / 0 |

El script ejecuta el manejador real de precios y el componente real de campos, con la carga del mercado sustituida por la copia fijada. Las cotizaciones se contrastan contra todos los registros pares del código, aplicando previamente la revisión global de precios. No se simulan promociones adicionales y no se interpreta un código local por cadena como un producto único de consumo. El archivo JSON conserva los resultados y las 91 exclusiones individualizadas.

## Verificación y límites

La suite de funcionamiento cubre la selección de Yogurt y Cerveza, el límite inicial de opciones, ampliación, cambio de familia, guardado de la identidad y cancelación de respuestas antiguas. El mínimo de catálogo admite empates entre sucursales sin presentarlos como una discrepancia de precio.

La integración adicional crea diez perfiles de aplicación locales sobre SQLite desechable y usa sesiones firmadas para ensayo. No son diez altas Google ni diez navegadores independientes. Cada perfil trabaja con diez selecciones reales de la A, existencias, cantidades pendientes, canasta, recepción parcial, reintento sin duplicación, cierre de sesión y recuperación. La prueba de precios usa una selección de dos códigos fuente por familia y todos sus pares entre sucursales; el barrido completo de los 792 códigos se ejecuta por separado. El límite de E/S de la fuente se vincula explícitamente a la copia de ensayo, para evitar que el envoltorio fetch del framework la sustituya. Las fechas originales se conservan y sólo se fija el reloj de las funciones de vigencia de precios, sin congelar sesiones o temporizadores del framework.

La vista previa local sirve la interfaz, pero no puede consultar la cobertura provincial en este entorno; la web publicada sí cargó las localidades. Esto no se tomó como una caída del servicio ni se modificó la aplicación para eludir esa limitación.

Los resultados finales de la suite, perfiles y muestra visual se incorporan al estado canónico tras completar sus controles. La B y las letras siguientes conservan su revisión pendiente. El color turquesa solicitado se entrega sólo como imagen conceptual; esta corrección no cambia la paleta ni los recursos de marca o Play Store.

## Segunda reducción de tarjetas solicitada durante la revisión

Se compactan también las tarjetas de Mi lista, En casa y resultados de precios. Nombre, marca, presentación, importancia, existencia, importe, comercio/sucursal/localidad, fechas y acciones permanecen en el DOM. La importancia de Mi lista comparte la línea de marca y presentación, en vez de ocupar una fila aparte. Los títulos bajan un punto, los importes conservan su mayor jerarquía, la imagen de referencia ocupa 32 píxeles y los botones conservan 44 píxeles de área táctil con un relieve de dos píxeles. No se usa altura fija, recorte de nombres ni ocultamiento adicional. El objetivo de dos o tres productos por pantalla sigue pendiente de medir en el Samsung con su tamaño de texto.

La consulta de marcas y capacidades no se limita a los atajos: un tipo conocido consulta también las facetas reales. Una marca fuera de la lista rápida se puede elegir, y al cambiar la marca se espera la actualización de tamaños antes de permitir elegirlos. Los códigos exactos, los cortes por kilo y las combinaciones previamente verificadas conservan sus restricciones.

El barrido basado en los nombres informados no acredita todas las formas coloquiales de búsqueda ni resuelve las abreviaturas de origen. Esa fase y la muestra visual se conservan pendientes para la A antes de declarar su cierre completo.

## Controles completados del corte

- Suite completa: 357 aprobadas, cero fallos, cero omitidas y cero canceladas.
- TypeScript, compilación y revisión del diff aprobados.
- Diez perfiles locales, cien recorridos de producto, sin escritura de existencias de producción. No se crearon cuentas del proveedor.
- Barrido A: 792 códigos, 701 cotizaciones y cero discrepancias del importe Desde después de la corrección.
- La revisión de interfaz en producción usa el perfil de prueba existente y puede registrar las consultas en su historial de búsquedas; no modifica la lista ni las existencias.

## Hallazgos posteriores al primer despliegue

La consulta genérica Agua ya habilitaba los campos, pero sus facetas mezclaban galletitas de agua, agua micelar y agua de consumo. Se agregó el control de familia y uso para que el agua de consumo no muestre esas marcas. Las consultas específicas siguen encontrando las otras familias. La consulta Yogur mostró seis marcas y tamaños seleccionables sin abrir resultados automáticamente.

Una observación de Benedictino de la sucursal `2|1|381`, código `sepa:2:1:7790895647659`, informa literalmente `1500 lt` y $2.100. Se conserva esa fuente y se aparta el precio hasta confirmar la capacidad. No se presume una conversión a 1,5 litros. El control compartido pone en revisión agua minorista cuyo contenido supera 100 litros; se verificó que los formatos de 500 ml, 1,5 L, 6,25 L y 20 L siguen admitidos. Por esta exclusión, el corte final de la A pasa de 702 a 701 códigos cotizables y de 90 a 91 sin precio utilizable.

El barrido final recorre 134 páginas y encuentra los 792 códigos, con cero discrepancias entre Desde y la cotización. La revisión de nombres habituales, abreviaturas y la muestra visual ampliada aún no permite dar por cerrada la A. La B conserva su estado pendiente.

## Continuación tras recuperar el entorno

Se incorporó la corrección pendiente de agua lavandina: queda en su familia de limpieza y se encuentra también al buscar Lavandina. La comparación de Agua no la incluye como bebida.

La lectura ordenada de los 659 nombres informados de la A detectó familias principales que faltaban en el control de ingredientes: aderezo/aceite, atún/aceite, anchoas/aceite, alimento para animales/arroz o leche, albóndigas/arroz, aritos/arroz, condimento/arroz, alimento o algodón/azúcar, acondicionador/leche, antitranspirante o aromatizador/té, aromatizante/aceite, espumador/leche, envase/gaseosa y abridor/vino. Se incorporan estas familias sin cambiar nombres, códigos, presentaciones o precios de origen. Veinte casos con nombres reales de la copia provincial verifican que la familia principal siga encontrándose y el ingrediente no se convierta en el producto. Entre ellos se comprueba también el hallazgo visual de vasos y copas al buscar Cerveza. No es un barrido de la letra C.

La A mantiene pendiente la resolución de nombres abreviados de origen, por ejemplo AG RAMA LECHE y ANIMALES GRANJ TE, y la clasificación de consultas generales con varios usos, como aceite alimentario/corporal. No se expanden abreviaturas ni se asignan categorías sin evidencia. El barrido funcional por códigos y los veinte casos semánticos cubiertos no sustituyen esa revisión. No se declara cerrada la A ni se inicia la B.

Muestra de navegador previa al corte: web 184 permite seleccionar Cerveza → AMSTEL → 1.00 lt. y muestra dos opciones iniciales, con nombre, marca, tamaño, Desde, sucursal y fecha. Puede haber códigos locales distintos con textos visibles iguales; se conserva como ajuste de presentación pendiente deduplicar únicamente con evidencia de identidad y envase. No se guardaron productos ni compras en producción. Las consultas pueden registrar historial de búsqueda del perfil de prueba.

## Opciones visuales idénticas

La prueba web 185 de Yogurt → TREGAR → 280 gr encontró dos opciones con el mismo texto, importe, sucursal y fecha, pero identificadores locales distintos. El componente compartido conserva ahora el código de barras y su estado de verificación recibido del catálogo y une únicamente opciones con el mismo GTIN validado, envase coherente y todos los metadatos mostrados idénticos. Retiene el primer código local concreto para la comparación. No une códigos internos/no verificados, variedades, tamaños, nombres, importes, sucursales o fechas diferentes. La fuente conserva los 792 códigos y su auditoría; la unión es sólo visual. Una prueba con la entrada real de Tregar y once controles negativos verifica estas condiciones. La muestra posterior a publicar se incorpora al registro canónico, sin presentarla como medición Samsung.

La primera corrida completa de este último ajuste falló durante el arranque de la prueba de perfil por `ENOTEMPTY` al compartir la caché de Vite con otros procesos de ensayo; no fue un resultado funcional de ese perfil. Los ocho arneses SSR usan ahora directorios temporales únicos y desactivan HMR, con limpieza al cerrar. Se repite la suite completa con el artefacto ya construido; los archivos de aplicación no cambiaron después de la compilación aprobada. El resultado definitivo se registra en el corte publicado.

## Publicación del corte

Web 186, fuente `5341c3421b1be4bf3c5a47f73544e25183b63957`, versión guardada `appgprj_6a9c53ae66f4819182c306fba4c263ca~appgver_1543c3bf91188191aefe067cafde909d`. Publicación confirmada por el alojamiento. Suite definitiva: 357 aprobadas, cero fallos, cero omitidas y cero canceladas; tipos y compilación aprobados. El barrido funcional de la A conserva 792 códigos, 701 cotizaciones, 91 sin precio utilizable y cero discrepancias, sobre 130 páginas. Las muestras posteriores del navegador y sus límites se registran en `AUDITORIA_BUSCADOR_A_2026-10-26.json` y en el estado único. El color turquesa sigue como preview; no se cambió la app ni se habilitaron fotos externas.
