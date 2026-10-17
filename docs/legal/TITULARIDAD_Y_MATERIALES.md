# RINDECASA — componentes y materiales de terceros

Fecha: 10/10/2026. Inventario verificable; no es un certificado de no infracción.

## Bibliotecas y avisos

`scripts/audit-legal-materials.mjs` lee el lockfile, metadatos y textos instalados, sin declarar permisos que no encontró. Produce `DEPENDENCIAS.json`, `IMAGENES_Y_FUENTES.json`, `public/legal/license-summary.json` y `public/legal/THIRD_PARTY_NOTICES.txt`.

- 878 entradas en el lockfile; 677 instaladas en el entorno de compilación.
- 630 entradas instaladas con aviso propio encontrado y conservado. La revisión ampliada conserva además 143 avisos de componentes incluidos dentro de otros paquetes; 341 textos distintos después de deduplicar por hash.
- 47 entradas instaladas sin aviso propio localizado: comprobar aviso del paquete, licencia del repositorio, versión y posibles atribuciones antes de certificar distribución.
- 201 entradas del lockfile no instaladas, incluidas variantes opcionales: examinar si otra plataforma las incorpora.

MIT, Apache, ISC y otras licencias conservan sus requisitos. Se identificaron también declaraciones MPL/LGPL y combinaciones: hace falta determinar cuáles se ejecutan, modifican, enlazan o redistribuyen en web, servidor o Android. La presencia de una etiqueta en el lockfile no obliga automáticamente a abrir toda la app y tampoco permite ignorar sus condiciones. El inventario no sustituye esa revisión. No hay una conclusión jurídica sobre cumplimiento integral.

Se conservaron los avisos existentes de la tipografía Outfit y de componentes shadcn, además de los textos encontrados. El archivo LICENSE del proyecto se limita a expresiones originales cuyos derechos tenga el titular; no cambia licencias ajenas ni derechos legales de terceros.

## Fotos, iconos y piezas

Se encontraron 89 fotos externas del catálogo con enlaces y correspondencia de producto. No hay permisos de reproducción comprobados para ellas. El registro vacío `data/image-rights.mjs` impide exhibirlas hasta agregar una referencia auténtica del permiso, titular, uso comercial y vigencia. La autorización debe cubrir la foto exacta y su uso; identificar el SKU no es autorización. No se borraron datos de usuarios ni se afirmó que el material sea ilícito.

Las fotos propias que suba un usuario siguen disponibles para el uso solicitado por ese usuario. Debe evitarse su reutilización en anuncios, catálogos o marketing sin autorización separada. Si contienen terceros identificables, se requiere revisar su tratamiento.

Los antiguos icono y wordmark raster se retiran del directorio público por falta de documentación de origen. No se declara que sean ilícitos. La identidad visual actual usa recetas conservadas en `scripts/build-brand-icon.py` y `scripts/build-brand-wordmark.py`, sin imagen externa de entrada, y Outfit Bold con el TTF y SIL OFL retenidos. El inventario registra esos archivos y licencias. La trazabilidad no certifica autoría humana, exclusividad sobre formas genéricas ni registro de marca. La titularidad del signo denominativo y, en su caso, de una marca mixta se revisan por separado.

## Fuentes de datos y marcas referenciales

| Material o fuente | Evidencia | Pendiente |
|---|---|---|
| SEPA oficial | Referencias de procedencia en el código y plan de datos | Obtener y conservar términos/licencia de cada recurso realmente utilizado. No se comprobó en esta tarea. |
| Réplica/intermediario de SEPA | Etiquetas de réplica y fecha en el cargador | Verificar permiso y condiciones del intermediario además de procedencia y vigencia. No llamarlo descarga oficial propia. |
| Promociones de bancos, billeteras y comercios | Enlaces de condiciones y controles de consistencia | Revisar reutilización y actualización; preferir hechos y condiciones resumidas con fuente. No copiar piezas gráficas o términos extensos sin permiso. |
| Nombres de productos y cadenas | Referencias para comparar | Mantener claridad sobre fuente y ausencia de afiliación. Revisar signos, logotipos y usos concretos si hay conflicto. |
| Contenido de anunciantes | Acuerdo y autorización a documentar | Verificar representación, uso de fotos/textos/marcas, vigencia y alcance antes de publicar. |
| Datos subidos por usuarios | Finalidad del uso solicitado | No reivindicar propiedad exclusiva ni ampliar finalidad por una aceptación genérica. |

No se certifica licencia abierta de un recurso por estar disponible en Internet. Obtener prueba antes de redistribuir archivos o material protegido. La información de procedencia y la fecha siguen siendo obligaciones distintas del permiso.

## Android

La preparación Android usa directamente Android Browser Helper 2.7.3 y AndroidX Browser 1.10.0. Falta inventariar el árbol resuelto de dependencias del APK/AAB exacto y conservar sus avisos; el inventario npm no lo cubre. No se ha comprobado aquí la inclusión de cada aviso en el artefacto móvil. El contenido servido por la web mantiene su propia revisión.

## Criterio de cierre

Para cada material distribuido, conservar versión/archivo, origen, titular o licencia, prueba privada, uso permitido, restricciones y vencimiento. No publicar contratos o datos personales en el repositorio. Para retirar o corregir, registrar qué se suspendió, su versión y evidencia de ejecución; una casilla de administrador es constancia de revisión, no prueba legal autosuficiente.
