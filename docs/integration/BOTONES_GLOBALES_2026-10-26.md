# Densidad compartida de botones

Pedido del titular: reducir aproximadamente un 30% el volumen de los botones en todas las ventanas, conservar proporciones e información y después continuar la revisión de la A.

La hoja `app/button-density.css`, cargada al final del layout raíz, fija un factor de 0,7 para relleno, separaciones, radios y relieve. Se aplica a botones nativos y a enlaces presentados como botón; incluye las pestañas, formularios, menús, páginas de cuenta, descarga y diálogos que se sirven bajo el mismo layout. Los enlaces de acción de Descargar declaran el mismo identificador semántico. Se conservan colores, texto, funciones, estados deshabilitados y foco de teclado.

El factor no escala toda la interfaz ni reduce cada dimensión un 30%. Las etiquetas siguen completas; los botones principales usan 14 px y los secundarios 13 px. La altura y el ancho de controles de icono/cantidad conservan un área táctil de 44 px. Los controles que ya tenían 44 px no se achican por debajo de ese mínimo. Se reducen anchos sobrantes y se permite que las acciones de formulario se ajusten al contenido; el texto largo puede ocupar más de una línea.

Las opciones que contienen información de producto, canasta o catálogo conservan la jerarquía de sus datos. Los controles de casilla, radio y switch no se convierten en botones de acción. Se respeta la preferencia de movimiento reducido y no se usa `transform: scale` para encoger áreas táctiles.

## Comprobaciones del corte

- TypeScript y compilación aprobados con las entradas finales.
- Revisión del diff sin errores de espacios.
- Vista previa pública: Elegir mi localidad mide 44 px de alto, fuente 14 px y relleno 5,6 / 8,4 px; relieve 3,5 px, frente al estándar anterior de 5 px.
- Diálogo de ubicación: Cerrar, Usar mi ubicación actual y Usar esta localidad mantienen 44 px y texto completo. No se solicitó geolocalización ni se guardó otra ubicación.
- La vista previa necesitó reinicio para incorporar el archivo nuevo; la fuente y la compilación estaban correctas. Su falta de cobertura provincial se mantiene como límite del entorno, sin cambiar lógica o permisos.
- La revisión de las cuatro pestañas y sus medidas en la publicación se documenta en el estado canónico posterior. La medición Samsung y tres tarjetas por pantalla siguen pendientes.

No se agregan pruebas que reflejen únicamente las reglas CSS. La última suite funcional completa aprobó 357 pruebas en web 186; este corte cambia presentación y atributos de estilo, sin modificar buscador, operaciones privadas ni cálculo de precios. El barrido alfabético conserva el mismo estado y continúa después de publicar los botones.

## Medición publicada y continuidad

Web 187, fuente `63ff93d0e345de5011f99b57a0b81dcb868ebdf7`, quedó publicada correctamente. Agregar producto pasó de 191,484 × 48 px a 162,172 × 44 px, con fuente de 14 px, relleno de 5,6 / 8,4 px y relieve de 3,5 px. La reducción medida de superficie de ese botón es aproximadamente 22,4%; el 30% corresponde al factor aplicado al relleno y relieve, no a todas las dimensiones.

Se midieron los controles visibles de las cuatro pestañas en navegador de escritorio: En casa (16), Precios (13), Gastos (8) y Mi lista (22). Ninguno quedó por debajo de 44 px de altura. La insignia de notificación sobresale intencionalmente. El contenido interior de Opciones excedía dos píxeles por el borde exterior: el siguiente corte ajusta ese interior a 42 px y conserva el botón exterior de 44 px. No se modificaron existencias, listas ni compras durante estas comprobaciones.

La continuidad semántica del buscador incorpora una compilación final y una suite completa de 362 pruebas aprobadas, cero fallos, omitidas o canceladas, con esta hoja de botones incluida. La medición en Samsung y el objetivo de tres tarjetas completas por pantalla siguen pendientes; la muestra de escritorio no los acredita.

## Cierre de publicación y muestra final

Web 188 publicó las correcciones semánticas y el barrido ampliado de la A; web 189 (`1e71a1f13def34956ce01012d9466b584cd8eb3c`) sólo completa el ajuste de relleno del menú. Su compilación pasó. La suite de 362 pruebas corresponde a la fuente funcional de web 188; no se repitió por este único cambio CSS. El navegador confirmó en web 189 que Opciones mide 44 × 44 px, con relleno 0 y sin desborde. La muestra de cuatro pestañas de web 187 sigue descrita por separado y no acredita Samsung.
