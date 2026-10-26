# Revisión alfabética del buscador

Inicio acordado con el titular: 26/10/2026. Se trabaja una letra por vez sobre la copia SEPA disponible de San Juan. Las correcciones de lógica y presentación se comparten entre provincias; la validación de una copia provincial no acredita las demás.

## Método repetible

1. Fijar el índice, fecha, commit y archivos de las sucursales. Conservar códigos locales, nombres, marcas, tamaños y precios originales.
2. Enumerar todos los registros cuyo nombre informado comienza con la letra, ignorando acentos y mayúsculas. Contar por separado observaciones, códigos locales y nombres; códigos de distintas cadenas no equivalen necesariamente a productos diferentes.
3. Recorrer las búsquedas y todas sus páginas. Comprobar que cada código aparece y que sus marcas y tamaños se pueden seleccionar.
4. Comparar cada entrada cotizable por su identidad exacta. El importe Desde debe coincidir con un mínimo válido entre sus pares admitidos. Los empates pueden identificar sucursales distintas con el mismo mínimo.
5. Registrar las exclusiones por falta de evidencia de envase o datos contradictorios. No corregir tamaños ni inventar precios para lograr un aprobado.
6. Ejecutar los cambios de producto, marca, tamaño y ubicación, incluyendo respuestas tardías, cancelación y cambio de consulta.
7. Comprobar visualmente el recorrido en navegador y registrar la muestra exacta. El barrido automatizado de una letra no se presenta como clics manuales en cada producto ni como una prueba Samsung.
8. Probar las operaciones privadas en perfiles de ensayo aislados: existencia inicial, lista, comparación, recepción parcial, confirmación, recuperación e intento de acceso entre cuentas.
9. Guardar resultados y pendientes antes de pasar a la letra siguiente.

## Recorrido esperado

Producto → marca → tamaño → selección del producto exacto. El catálogo puede consultar opciones en segundo plano, pero la lista extensa no se abre automáticamente al escribir una familia. Las opciones iniciales son dos, compactas, con un acceso explícito a más resultados. El usuario también puede abrir las opciones del catálogo sin completar los filtros. Cada opción conserva nombre, marca, presentación, precio disponible, sucursal y fecha.

Los atajos habituales conservan su selección simple. El catálogo ampliado permite también las marcas que no aparecen en esos atajos. Si dos variedades comparten marca y tamaño, se requiere elegir la identidad exacta. Las carnes al peso conservan su control de corte y precio por kilo; la cantidad no se transforma en un número de envases.

## Estado del corte más reciente

| Letra | Barrido funcional local | Datos que requieren revisión | Visual |
| --- | --- | --- | --- |
| A | 792 códigos locales encontrados antes y después de filtrar; 369 combinaciones de marca/presentación; 701 cotizaciones verificadas sobre 1.691 observaciones y 659 nombres informados; cero incidencias locales | 90 códigos sin evidencia suficiente de presentación, un agua informada como 1500 lt y una abreviatura de familia sin confirmar; conservar la fuente y las exclusiones | Muestras web 183–186: Agua y Yogur con campos habilitados; Cerveza/AMSTEL/1 L y Yogurt/TREGAR/280 gr con dos opciones. El barrido completo no se presenta como muestra visual de cada producto. |
| B–Z | Pendiente, avanzar una letra por vez | Pendiente | Pendiente |

Evidencia detallada: `docs/integration/AUDITORIA_BUSCADOR_A_2026-10-26.json`. Ejecución repetible: `node scripts/qa/catalog-letter-audit.mjs A /ruta/al/resultado.json`. No iniciar otra letra en paralelo ni afirmar que todo el catálogo nacional está validado.

La continuidad agrega veinte casos semánticos iniciales y cinco pruebas adicionales con nombres reales, alias acreditados y controles negativos de identidad. Cinco GTIN abreviados quedaron clasificados con evidencia, y los aceites conservan sus usos sin mezclar cocina con hornillo cuando se especifica el tipo. La deduplicación visual fue verificada en web 186. `AGUILA FRAMB LECHE` sigue pendiente de confirmar. La suite completa actual aprueba 362 pruebas; la A no se declara cerrada por un barrido sin discrepancias de precios. El detalle está en `docs/integration/BUSCADOR_A_SEMANTICA_2026-10-26.md`.
