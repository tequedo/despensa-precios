# Densidad visual compartida — 26/10/2026

El titular confirmó que la comparación Natura corregida funciona en su Samsung y aportó una captura con precios, comercios y fecha. Solicitó cuadros más pequeños y extendió el criterio a todas las ventanas, manteniendo información y estética.

Se ajusta exclusivamente `app/compact-ui.css`: márgenes, separaciones e interiores de paneles en En casa, Mi lista, Precios, Gastos, formularios, comparación, compras, mayoristas y promociones. Los diálogos de compra, comparación y ubicación comparten el mismo criterio. Las tarjetas de precios usan comercio e importe en una misma fila cuando disponen de ancho suficiente, con lectura vertical en espacios estrechos.

Los textos, datos, importes, fechas, controles y detalles conservan su contenido. Se mantienen los colores, bordes y relieves existentes. Los campos y acciones conservan un mínimo de 44 píxeles CSS. No se agregan recortes de texto, elementos ocultos, límites de altura o cambios de escala global.

La confirmación del Samsung corresponde al arreglo funcional publicado en web 177; la compacidad visual posterior requiere revisión en el teléfono. El resto del recorrido funcional y el segundo dispositivo siguen pendientes. Para este cambio de presentación se revisa el diff y se compila la aplicación; la suite funcional de 326 pruebas corresponde a la versión previa, cuyo código funcional permanece intacto.
