# Identificación de productos — puntos 4.3, 4.5 y 4.6

En el esquema SEPA, `productos_ean` indica `0` (identificador interno) o `1`
(EAN/UPC). El código está en `id_producto`. El importador anterior trataba el
indicador como código y terminaba utilizando claves de comercio para todos ellos.

La corrección conserva `product.ean = sepa:comercio:bandera:id_producto`. Esta es
una clave histórica de nuestra base, no una afirmación de que el valor sea un EAN.
No se reemplazan las claves únicas ni se recrean productos, compras o existencias.
Se añaden `sourceProductId`, `barcodeStatus`, `barcode` cuando es matemáticamente
válido y `gtin` normalizado a 14 dígitos sólo cuando puede usarse como candidato
global. No se eliminan ceros ni se reparan dígitos de control.

Estados: `internal`, `invalid`, `restricted`, `valid_format_and_checksum`. Los
declarados EAN con formato inválido siguen disponibles mediante su clave local y
se registran en cuarentena de identificación. No se les atribuye código global.

La política conserva como restringidos los prefijos 02, 04, 20–29, GTIN-8 que
empiezan por 0 o 2 y GTIN-14 variable de indicador 9. También excluye del cruce
global los prefijos 000, 05, 98 y 99 como medida conservadora para asignaciones
locales, reservadas o usos especiales. No es un verificador de licencia GS1.
Un checksum válido no prueba asignación, autenticidad ni correspondencia física.

La aplicación recibe los nuevos datos en el lugar 9 de cada tupla nacional; los
lugares 0–8 mantienen sus significados. Un lector anterior ignora la extensión.
Un lector nuevo puede seguir leyendo archivos anteriores. La promoción continúa
en el lugar 8, incluso cuando no existe y es necesario escribir `null`.

El cruce entre cadenas exige evidencia explícita del código en los datos actuales.
No se obtiene un EAN recortando una clave `sepa:` antigua. Ante marcas o contenidos
contradictorios se bloquea el cruce. Si la cadena de origen de un producto guardado
no está entre las sucursales cargadas, puede faltar la evidencia para resolver esa
referencia; se conserva como faltante hasta disponer de ella.

Los importes SEPA aceptan decimal punto o coma, hasta dos posiciones, sin moneda,
separador de miles, hexadecimal ni notación científica. Los vacíos, ceros y
negativos no se usan como precios. Se mantiene la revisión existente para valores
menores que 100 y mayores que 10.000.000: un valor positivo fuera del umbral no se
declara necesariamente incorrecto; queda excluido hasta revisión. Los precios de
carne mantienen la exigencia de base exacta de un kilo y sus controles de rango.

La salida de San Juan se reúne antes de la ingesta, rechaza precios contradictorios
para la misma referencia y exige coincidir con el recuento del catálogo nacional.
Se escribe un archivo temporal completo, se comprueba su hash y sólo entonces se
reemplaza la versión anterior. Los lotes se envían después de esta comprobación.

## Fuentes y alcance

- [Esquema del intermediario examinado](https://github.com/catdevnull/preciazo/blob/2642ece2a284417b267e1e9d74ea59c55d89c1a3/sepa/dataset-validator/schemas.ts).
- [GS1: alimentos frescos y circulación restringida](https://ref.gs1.org/guidelines/fresh-foods/), apartados 2.4 y 7.2.
- [GS1: prefijos y números de circulación restringida](https://ref.gs1.org/standards/genspecs/gscn/2015/WR15-006-Updating-Figures-in-General-Specification_errataAnkurComment.pdf).
- [Auditoría de productos del 12 de septiembre](audits/2026-09-14-sepa-products.json).
- [Auditoría de cadenas y sucursales del mismo archivo](audits/2026-09-14-sepa-stores.json).

Quedan fuera del cierre automático la comprobación de envases reales, los precios
por peso que no expresan una base suficiente y la autenticación del original SEPA.
