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

## Criterios de cierre

1. Estabilidad: siete fechas consecutivas confirmadas y último intento exitoso, conservando procedencia real y detalle de ChangoMás/cobertura. El acceso oficial se informa por separado.
2. Promociones: registros por fuente y condiciones reproducibles; ejemplos elegibles y no elegibles comprobados sin aplicar reglas incompletas. La matriz no autoriza por sí sola un beneficio ni afirma cobertura total.
3. Android: firma, asociación web, privacidad/eliminación, pruebas físicas y revisión de marca son condiciones independientes; los precios y promociones no habilitan por sí solos una publicación.
