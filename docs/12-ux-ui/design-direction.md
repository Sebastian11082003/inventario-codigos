# Dirección de diseño — Inventario de códigos

## Producto

- **Qué es:** una herramienta de teléfono para anotar códigos y llevárselos en Excel.
- **Qué debe hacer:** abrir la cámara trasera, confirmar el número y guardar una ficha corta.
- **Industria:** tienda pequeña y mostrador. Se usa de pie, con una mano y con prisa.
- **Personalidad:** cálida, clara y actual. Se reconoce al primer vistazo y se entiende sin manual.
- **Objetivo del usuario:** leer el código correcto y no perder la lista.
- **Objetivo de negocio:** un Excel que el punto de venta pueda mapear.
- **Contenido real:** códigos, nombres, categorías, cantidades y un precio que a veces no existe.
- **Dispositivo:** teléfono en vertical. En escritorio la misma columna, centrada, de unos 430 px.

## Usuario

Quien cuenta la mercancía. Termina cuando la lista está revisada y el archivo descargado.

## Referencias

No se copia un sitio. Cada fuente aporta una capa.

```yaml
references:
  mobbin:
    purpose: UX / interacción
    patterns:
      - El escáner ocupa el pulgar: el botón de captura está en la cabecera si la lista está vacía y fijo abajo cuando ya hay productos.
      - Si la cámara falla, el texto dice qué pasó y Escribir código sigue disponible.
      - La cantidad se cambia en la tarjeta, con − y +, sin abrir la ficha.
      - El estado vacío enseña el primer paso en vez de dejar un hueco.
  godly:
    purpose: identidad visual
    patterns:
      - Un campo de color saturado (papaya) con el título en una sans de carácter (Bricolage Grotesque).
      - El control principal es una cápsula de tinta con un sello papaya y el icono de cámara.
      - La hoja clara se mete bajo la cabecera. El mono solo vive en el número del código.
  web_anatomy:
    purpose: composición de secciones
    patterns:
      - Lista: cabecera a sangre y hoja con tarjetas.
      - Cámara: video a sangre, ventana oscurecida y esquinas.
      - Ficha: banda corta y campos blancos sobre la hoja.
      - Categorías: una tarjeta por nombre, con guardar y borrar a 48 px.
  land_book:
    purpose: narrativa y conversión
    patterns:
      - Una frase de valor: todo queda en este teléfono.
      - Una sola acción primaria: Escanear con la cámara.
      - Escribir, exportar y categorías se ven, sin competir con el escaneo.
  google_stitch:
    purpose: exploración
    directions: [A, B, C]
    selected: C
```

### Mobbin — UX

El escáner de un inventario móvil actual: una acción principal al alcance del pulgar, el permiso denegado explica el arreglo y deja escribir el código. La lectura no se acepta al primer fotograma. Contar stock es − y + en la misma tarjeta donde se lee el nombre.

### Godly — identidad

Campo papaya, título de display y un botón de tinta. No es una página blanca con un acento verde, ni un tablero. El número del código usa IBM Plex Mono; el resto no imita un recibo.

### Web Anatomy — composición

| Sección | Composición | Jerarquía | Ancla | Responsive |
|---|---|---|---|---|
| Lista vacía | Cabecera papaya con el botón de escanear y hoja con la marca del código | El título y el botón | La cápsula de tinta | Una columna |
| Lista con productos | Cabecera corta y tarjetas; el botón pasa al pie | El nombre y la cantidad | La bandeja de cantidad | Una columna, pie fijo |
| Cámara | Video a sangre, ventana oscura y esquinas papaya | La frase de mantener quieto | El recuadro | Alto del teléfono |
| Ficha | Banda papaya con el código y campos blancos | El código ya leído | El nombre | Una columna, se desplaza |
| Categorías | Tarjeta por categoría | El nombre | Guardar | Una columna |

### Land-book — narrativa

La cabecera dice cuántos productos hay y ofrece un solo gesto para el siguiente código. Exportar se apaga si la lista está vacía. Escribir el código queda a la vista como respaldo, no como camino principal.

### Google Stitch — exploración

| Dirección | Idea | Encaje |
|---|---|---|
| A — mínima / editorial | Lista blanca, Manrope y un botón verde | Se lee, y se siente vacía. Ya se probó y se descartó |
| B — expresiva | Talonario, papel crema, botón amarillo, serifa de mostrador | Se reconoce, y parece de otra década. Es el sitio en vivo que se rechazó |
| C — centrada en el producto | Mostrador papaya, marca de código, bandeja de cantidad y visor con esquinas | El trabajo es apuntar, confirmar y contar |

**Elegida:** C.

**Por qué se siente actual y amable:** la papaya es un color de ahora, la tipografía es de pantalla y los controles caben en el pulgar. El vacío saluda con la marca del código y dice qué hacer. El error se pinta junto al campo, con fondo, no solo con un cambio de color.

## Design DNA

```yaml
design_dna:
  visual_direction: mostrador de teléfono, cabecera papaya y hoja clara
  typography: Bricolage Grotesque en títulos y nombres; Outfit en la interfaz; IBM Plex Mono solo en el número del código
  colors: papaya #ff4f30, tinta #1c1410, hoja #fff4ef, tarjeta #ffffff, error #9f1239, lienzo de escritorio #2a1612
  layout: una columna; en escritorio la columna sigue en 430 px, centrada, sobre el lienzo oscuro
  spacing: 8 px de base; 16–20 px en los bordes; safe-area en cabecera y pie
  radius: 16 px en campos, 18–22 px en tarjetas y botones, 28 px en la hoja, 32 px en el marco de escritorio
  shadows: sombra suave teñida, nunca desplazamiento duro
  imagery: marca de código con lente en el vacío; el video de la cámara es la imagen del escáner
  icons: cámara en el botón de escanear; cuatro esquinas papaya en el visor
  motion: el botón se hunde al pulsar y una línea recorre el visor; se apaga con prefers-reduced-motion
  density: táctil, controles de al menos 48 px, campos a 16 px para que iOS no haga zoom
```

## Qué hace único este diseño

Sin el nombre, se reconoce por la cabecera papaya, la cápsula de tinta con la cámara, la marca de código del vacío y la bandeja donde se lee la cantidad. No es un tablero de tres columnas ni un talonario.

## Evaluación

```yaml
evaluation:
  UX_quality: 9
  visual_identity: 8
  originality: 8
  hierarchy: 9
  responsiveness: 9
  accessibility: 8
  product_fit: 9
  contemporary: 9
  friendliness: 9
```

La lista blanca (A) bajaba la identidad. El talonario (B) bajaba actualidad y amabilidad. Esta dirección pasa el corte: el color y la marca son de este producto, y la tarea de apuntar y contar sigue siendo obvia.

## Implementación

`src/styles.css`, `src/ui` y `index.html` usan estos tokens. Escanear es la cápsula de tinta. Guardar es tinta. Confirmar el código leído usa la papaya con texto de tinta. El foco visible es un anillo. En el visor el anillo es blanco.
