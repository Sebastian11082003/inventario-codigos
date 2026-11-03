# Dirección de diseño — Inventario de códigos

## Producto

- **Qué es:** una herramienta de teléfono para anotar códigos y llevárselos en Excel.
- **Qué debe hacer:** abrir la cámara trasera, confirmar el número y guardar una ficha corta.
- **Industria:** tienda pequeña y mostrador. Se usa de pie, con una mano y con prisa.
- **Personalidad:** clara, actual y amable. No es un talonario ni un tablero de empresa.
- **Objetivo del usuario:** leer el código correcto y no perder la lista.
- **Objetivo de negocio:** un Excel que el punto de venta pueda mapear.
- **Contenido real:** códigos, nombres, categorías, cantidades y un precio que a veces no existe.
- **Dispositivo:** teléfono en vertical. En escritorio la misma columna, centrada.

## Usuario

Quien cuenta la mercancía. Termina cuando la lista está revisada y el archivo descargado.

## Referencias

No se copia un sitio. Cada fuente aporta una capa.

### Mobbin — UX

El escáner de un inventario móvil actual: una acción principal abajo, el permiso denegado explica el arreglo y deja escribir el código. La lectura no se acepta al primer fotograma.

### Godly — identidad

Sans contemporánea (Manrope), superficies blancas, un verde de acción y sombra suave. El mono solo se usa para el número del código, no para decorar títulos.

### Web Anatomy — composición

| Sección | Composición | Jerarquía | Ancla | Responsive |
|---|---|---|---|---|
| Lista | Cabecera clara y tarjetas con el nombre grande | El nombre | La tarjeta | Una columna |
| Cámara | Video a sangre y recuadro blanco | La frase de mantener quieto | El recuadro | Alto del teléfono |
| Ficha | Campos con fondo suave y un botón de guardar | El código ya leído | El nombre | Una columna |
| Categorías | Filas editables | El nombre | Guardar | Una columna |

### Land-book — narrativa

Una frase corta, el conteo y un solo botón verde. Exportar y las categorías quedan al lado, sin competir con el escaneo.

### Google Stitch — exploración

| Dirección | Idea | Encaje |
|---|---|---|
| A — mínima / editorial | Lista blanca, poca decoración | Clara y fácil de leer con prisa |
| B — expresiva | Talonario, sombra dura, serifa de mostrador | Se reconoce, pero se ve de otra década |
| C — centrada en el producto | Recuadro de cámara y ficha corta | Es el trabajo: apuntar, confirmar, contar |

**Elegida:** A con el recuadro de C. El verde solo marca la acción principal.

**Por qué no B:** el talonario perforado, el sello girado y la sombra de imprenta se sienten viejos para alguien que usa el teléfono todos los días.

## Design DNA

```yaml
design_dna:
  visual_direction: lista clara de teléfono, con un recuadro de cámara
  typography: Manrope en interfaz; IBM Plex Mono solo en el número del código
  colors: lienzo #eef3f6, superficie #ffffff, tinta #14202b, acción #0c8f78, error #c2413b
  layout: una columna; en escritorio sigue angosta y centrada
  spacing: 8 px de base; 16–20 px en los bordes; safe-area en el pie
  radius: 14–22 px en tarjetas y botones
  shadows: sombra suave y baja, nunca desplazamiento duro
  imagery: ninguna ilustración; el video de la cámara es la imagen
  icons: recuadro de cuatro esquinas blancas
  motion: el botón principal se hunde al pulsar; sin adorno
  density: táctil, campos a 16 px para que iOS no haga zoom
```

## Qué hace único este diseño

Sin el nombre, se reconoce por el botón verde de escanear, la lista de productos con cantidad a un toque y el recuadro que pide mantener el código quieto. No es un tablero de tres columnas.

## Evaluación

```yaml
evaluation:
  UX_quality: 8
  visual_identity: 8
  originality: 7
  hierarchy: 8
  responsiveness: 9
  accessibility: 8
  product_fit: 9
  contemporary: 9
  friendliness: 9
```

La dirección anterior (libreta y pistola de precios) tenía originalidad alta y se veía obsoleta. Esta prioriza que se sienta actual y fácil, sin volver a un tablero genérico.

## Implementación

`src/styles.css` y `src/ui` usan estos tokens. El verde es la acción principal: escanear y guardar.
