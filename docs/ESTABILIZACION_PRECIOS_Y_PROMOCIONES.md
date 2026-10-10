# RINDECASA — controles de estabilización

Preparación del 9 de octubre de 2026. No se contratan servicios ni se cambia la política de aceptación de fuentes. Los nuevos controles no acreditan resultados antes de ejecutarse en producción.

## Precios diarios y ChangoMás

`data/price-refresh-history.json` conserva la comprobación diaria y el último intento, con enlaces a las ejecuciones. Se distinguen recuperación inicial (dos días consecutivos) y estabilidad propuesta (siete días consecutivos). Se cuentan fechas del calendario argentino, no cantidad de ejecuciones. Un fallo posterior queda visible aunque se conserve una comprobación positiva de ese mismo día. Una interrupción reinicia la racha.

La comprobación exige adquisición válida de la fecha actual, prueba de lectura de la app con la misma generación y diagnóstico desde un perfil técnico nuevo. Incluye las 24 jurisdicciones y el producto control de ChangoMás en San Juan con precio, código y sucursal física iguales a la fuente. Ese producto control no equivale a verificar todo el surtido de la cadena.

Cada día registra jurisdicciones con precios vigentes, sucursales y sucursales de ChangoMás comprobadas. La cobertura por localidades y sucursales se consulta en `data/price-access-report.json`; no equivale a cubrir todos los comercios del país.

`officialChannelRestored` permanece falso cuando se aceptó una réplica. `independentlyComparedWithOfficial` exige una comparación coincidente cuyo original proceda de descarga HTTPS oficial; un ZIP aportado sin autenticación independiente no cuenta como original oficial comprobado. No se modifica una fecha antigua para aparentar actualidad.

Al control previo a estos cambios constan días positivos 8 y 9 de octubre, fuente réplica y tres sucursales ChangoMás de San Juan comprobadas. No hay siete días demostrados ni acceso oficial restablecido. El canal oficial sigue siendo una dependencia externa; no se supone que contratar una IP fija la resolverá ni se elude un bloqueo.

## Promociones

La revisión programada de bancos y billeteras genera `data/promotion-matrix.json`, además de sus archivos anteriores. Registra fuentes accesibles, extracción parcial o ausente, fecha efectiva, condiciones conocidas y motivos de bloqueo. Una página accesible sin condiciones extraídas no se considera cobertura completa.

El descubrimiento conserva el legal de cada promoción y distingue descuento, reintegro y cuotas. Extrae solo información expresa: vigencias, días, medios de pago, condición de jubilado, topes/período/titular, canales, exclusiones y acumulación. Un candidato sigue incompleto hasta validar restricciones por producto, sucursal y persona; los términos contradictorios nunca se aplican al total.

El verificador de ofertas por producto usa ahora la ruta de Chromium instalada por la acción de precios. Esta corrección permite intentar el renderizado, pero no garantiza que las páginas entreguen ofertas verificables. 2x1/3x2 y descuentos por producto requieren evidencia específica de código, presentación, cantidad, vigencia y sucursal; no se fabrican a partir de anuncios generales.

La actualización bancaria no renueva la fecha de un informe anterior de ofertas por producto. Si falta ese informe, la matriz lo declara. La cobertura nacional completa permanece `false` incluso si se revisan todas las fuentes seleccionadas.

## Publicación de resultados sin interferencia

El intento [38003105793](https://github.com/tequedo/despensa-precios/actions/runs/38003105793), del 9/10 a las 20:31 de Argentina, falló al sincronizar cuatro archivos generados de beneficios y la matriz: precios y beneficios se ejecutaban con grupos de concurrencia distintos. Ese fallo de publicación es distinto del bloqueo del canal oficial de SEPA. El intento [38003555658](https://github.com/tequedo/despensa-precios/actions/runs/38003555658) terminó correctamente a las 20:50 de ese día.

La corrección preparada el 10/10 usa un grupo compartido para precios, beneficios y geografía, sin cancelar la ejecución activa y con `queue: max` para conservar hasta cien ejecuciones pendientes. Cada proceso comienza leyendo `main` después de esperar, evitando regenerar la matriz a partir de un catálogo previo. La actualización de beneficios utiliza el mismo publicador con reintentos de precios.

Si un cambio ajeno al grupo compartido provoca un conflicto, el publicador falla y aborta la sincronización incompleta: conserva los cambios locales y los remotos y nunca fuerza la rama ni elige automáticamente un archivo de promociones. La evidencia de diagnóstico se conserva mediante los artefactos del workflow; no se promete que un commit local conflictivo pueda publicarse sin revisión.

Una prueba con dos copias y un repositorio remoto local reproduce el conflicto y comprueba que ambas versiones y el informe local se conservan. La configuración de cola está documentada por [GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency). La prueba local y la configuración nueva no sustituyen las siete fechas de actualización efectiva.

## Criterios de cierre

1. Estabilidad: siete fechas consecutivas confirmadas y último intento exitoso, conservando procedencia real y detalle de ChangoMás/cobertura. El acceso oficial se informa por separado.
2. Promociones: registros por fuente y condiciones reproducibles; ejemplos elegibles y no elegibles comprobados sin aplicar reglas incompletas. La matriz no autoriza por sí sola un beneficio ni afirma cobertura total.
3. Android: firma, asociación web, privacidad/eliminación, pruebas físicas y revisión de marca son condiciones independientes; los precios y promociones no habilitan por sí solos una publicación.
