# Continuidad de la A: significado, filtros y datos pendientes

Se conserva la copia provincial de 14 archivos, 22.026 observaciones, commit de datos `0ef2f12e9f80d3d8c0b1694fdbd39e94657c2067`. El alcance de la A mantiene 1.691 observaciones, 792 códigos locales y 659 nombres originales. Esta revisión continúa la web 186 y la densidad de botones publicada en web 187.

## Correcciones de significado

Se agregan alias y clasificación para cinco códigos abreviados con evidencia de código de barras y nombre/tipo. Sólo se aplica la revisión cuando coinciden el GTIN validado y la huella exacta de nombre y marca. Los alias no cambian los nombres, marcas, envases o importes de la fuente, ni permiten unir productos distintos.

| GTIN | Nombre informado | Clasificación acreditada |
| --- | --- | --- |
| 7790580156114 | AG RAMA LECHE 40G | Chocolate en rama con leche |
| 7790580156008 | AG BOMB LECHE 114G | Bombones rellenos con chocolate con leche |
| 7790580156046 | AG BOMB LECHE 38G | Bombones con chocolate con leche |
| 7790580156152 | AG AVE CH LECHE 90G | Avellanas bañadas en chocolate |
| 9786313071241 | ANIMALES GRANJ TE | Libro Animales de la granja |

Las cuatro primeras pruebas proceden de los campos técnicos indexados del catálogo de Carrefour, que exponen el EAN y el tipo correspondiente. El cuerpo completo de esas páginas no se pudo leer y no se presenta como comprobado visualmente. La quinta procede del catálogo de Interleo, con título completo y el mismo ISBN/EAN. Las direcciones y la procedencia quedan en `data/catalog-search-reviews.json`; no se incorporan fotos o precios externos.

`AGUILA FRAMB LECHE`, GTIN 7790580147822, permanece pendiente de confirmación. Se retira de Leche por falta de evidencia de que sea una bebida láctea, pero conserva búsqueda por nombre específico y código exacto. No se inventa su denominación completa ni se lo transforma en otra variedad.

Los plurales habituales de la A mantienen el control de familia. Arroz con leche y arroz inflado conservan sus consultas específicas sin mezclarse con arroz seco. Aji No Men se trata como fideos, sin confundirlo con ají. La prueba positiva de diez perfiles ahora usa Atún; el caso negativo de Aji No Men se verifica por separado. No se presenta la prueba anterior como una selección de ajíes.

Los usos corporal, aromatizante y mecánico del aceite conservan su búsqueda y clasificación correspondientes. Aceite de coco alimentario no incluye aceite para hornillo con aroma de coco; una búsqueda explícita de hornillo sí lo encuentra. La consulta genérica Aceite conserva los distintos usos, y una consulta específica requiere seleccionar su producto exacto. El agua micelar se clasifica en Higiene. Estas categorías sirven para navegar, no acreditan identidad comercial.

## Controles ejecutados

TypeScript, compilación final y suite completa: 362 aprobadas, cero fallos, cero omitidas y cero canceladas. Cinco pruebas adicionales usan productos reales de la copia, controlan huellas y códigos incorrectos, plurales, ingredientes y usos; no equivalen a cinco productos revisados ni a una revisión de las letras siguientes.

El barrido alfabético se amplía para accionar los eventos reales de Marca y Tamaño para cada grupo de consulta, marca y presentación; consulta la ruta real con esos filtros y comprueba que todos los códigos locales sigan apareciendo. Compartir una consulta idéntica entre varios códigos no los une ni permite elegir una variedad automáticamente. Los campos deben conservar los valores informados y la selección exacta debe seguir vacía hasta elegirla explícitamente.

El resultado final encontró los 792 códigos tras 55 consultas iniciales, dos consultas específicas y 131 páginas. Las 369 combinaciones de marca y presentación recorrieron otras 369 páginas y conservaron los 792 códigos, sin incidencias. Las 701 cotizaciones coinciden con sus mínimos admitidos; los 91 códigos restantes conservan su exclusión. El JSON guarda diez códigos locales con revisión confirmada y dos con familia pendiente. Son comprobaciones locales del manejador y los campos reales, no 792 recorridos visuales, cuentas Google ni pruebas físicas Samsung. La muestra posterior a publicar se incorpora al estado canónico.

## Pendientes conservados

La A sigue abierta por 90 códigos sin evidencia suficiente de presentación, el agua Benedictino informada como 1500 lt y la abreviatura AGUILA FRAMB LECHE. No se modifica la fuente para forzar una aprobación. Las formas coloquiales aún no ensayadas y la validación física conservan su límite. B–Z continúan pendientes. Las correcciones compartidas alcanzan todas las provincias; esta evidencia sólo acredita la copia fijada de San Juan.
