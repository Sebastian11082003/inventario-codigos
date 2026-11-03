# Sistema de diseño

Piezas del ADN del mostrador. No entran la página blanca con un botón verde, el papel crema, el botón amarillo, la serifa de cartel, el borde duro ni la sombra de imprenta.

| Pieza | Regla |
|---|---|
| Cabecera | Campo papaya `#ff4f30`, pastilla blanca «En este teléfono», título Bricolage Grotesque en tinta |
| Lista vacía | Marca de código con lente, título y tres acciones en columna. El botón de escanear vive en la cabecera |
| Lista con productos | La cabecera se acorta. Escanear pasa al pie y permanece visible |
| Tarjeta | Superficie blanca, radio 22 px, sombra suave. El nombre es lo más grande. La categoría es una pastilla de color fijo por nombre |
| Cantidad | Bandeja `#ffe8dc` a lo ancho: −, número con la unidad al lado (cantidad, kg o gramos), +. Cada botón mide 48 px |
| Unidad en la ficha | Al lado del número, un selector con Cantidad, kg y Gramos. Cantidad queda elegida al crear. No cambia el resto de la ficha |
| Escanear | Cápsula de tinta, alto mínimo 64 px, texto blanco, sello papaya con icono de cámara |
| Acciones secundarias | Escribir código, Exportar Excel y Categorías. Exportar se desactiva si la lista está vacía |
| Ficha | Banda papaya con el código en mono. Campos blancos, radio 16 px, texto a 16 px, etiquetas en tinta |
| Error | Fondo `#fff1f2`, texto `#9f1239` y borde del campo en el mismo rojo. El campo inválido recibe el foco |
| Visor | Video a sangre, alrededor oscurecido, esquinas papaya, línea de lectura y estado en una pastilla oscura |
| Flash | En la barra del visor, a la derecha y en una segunda fila, solo si la pista informa `torch`. Apagado: pastilla translúcida, borde claro y lámpara hueca. Encendido: papaya `#ff4f30` con texto de tinta y lámpara llena. No tapa el recuadro. Al salir, la luz se apaga |
| Guardar | Botón de tinta. Confirmar el código leído es papaya con texto de tinta |
| Eliminar | Primero un botón rosa suave; la confirmación es rojo sólido |
| Categorías | Una tarjeta blanca por nombre, con Guardar y Borrar a 48 px |

Contraste: tinta sobre papaya, blanco sobre tinta y blanco sobre el rojo de error sirven para texto. El foco visible es un anillo de tinta; en el visor es blanco. Se respeta `prefers-reduced-motion`.
