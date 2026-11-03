# Dirección de diseño — Inventario de códigos

## Producto

- **Qué es:** una libreta de bodega para capturar códigos con el teléfono.
- **Qué debe hacer:** abrir la cámara trasera, fichar el producto y sacar un Excel.
- **Industria:** inventario de tienda pequeña y mostrador, no un ERP.
- **Personalidad:** directa, de papel y tinta, usable con una mano y con luz de pasillo.
- **Objetivo del usuario:** no perder un código y irse con el archivo.
- **Objetivo de negocio:** un Excel que el POS pueda mapear.
- **Contenido real:** códigos, nombres, cuatro categorías semilla, cantidades y un precio que a veces no existe.
- **Dispositivo:** teléfono en vertical. En escritorio la libreta se queda angosta, no se convierte en tablero.

## Usuario

Quien cuenta la mercancía. Termina cuando el estante está revisado y el archivo descargado.

## Referencias

No se copia un sitio. Cada fuente aporta una capa.

### Mobbin — UX

Captura a pantalla completa con un solo verbo abajo, como el depósito de un cheque o el escáner de un inventario móvil: el pulgar cae en la acción, el permiso denegado explica el arreglo y deja un camino manual. No hay barra de cinco iconos.

### Godly — identidad

Contraste de una serifa de mostrador (Fraunces) contra una sans legible (Atkinson Hyperlegible) y un mono para el código (IBM Plex Mono). Sombra dura de imprenta, no desenfoque. El amarillo de la pistola de precios aparece solo en el disparador.

### Web Anatomy — composición

| Sección | Composición | Jerarquía | Ancla | Responsive |
|---|---|---|---|---|
| Estante | Cabecera nocturna y tiquetes perforados, no grilla de tarjetas | El nombre del producto | El tiquete | Una columna, también en escritorio |
| Cámara | Video a sangre con cuatro esquinas | La frase de apuntar | El visor | Ocupa el alto del teléfono |
| Ficha | Renglones de libreta, sin caja flotante | El código ya leído | El campo nombre | Una columna, cantidad y unidad en pareja |
| Categorías | Lista de sellos editables | El nombre | El sello verde | Una columna |

### Land-book — narrativa

Una frase de bodega, un conteo y un solo botón amarillo. El Excel y las categorías están en texto, debajo, para no competir con el escaneo.

### Google Stitch — exploración

| Dirección | Idea | Encaje |
|---|---|---|
| A — mínima / editorial | Lista blanca, mucha letra, poco color | Clara, pero parece una nota, no una herramienta de pasillo |
| B — expresiva | Mercado nocturno, color por categoría, ilustración | Memorable y más lenta de leer con prisa |
| C — centrada en el producto | Visor de pistola y tiquete de estante | Es el trabajo real: apuntar, confirmar, contar |

**Elegida:** C, con la cabecera nocturna de B y la lista en papel de A.

**Por qué no la convencional:** un tablero blanco con tarjetas redondas y un botón azul no dice “bodega” si se le quita el título.

## Design DNA

```yaml
design_dna:
  visual_direction: libreta de bodega con visor de pistola de precios
  typography: Fraunces en títulos y cantidades; Atkinson Hyperlegible en texto; IBM Plex Mono en códigos
  colors: noche #1d1814, papel #f4ecdf, disparador #ffd23f, sello #1e5c45, error #9c341f
  layout: una columna; en escritorio la columna sigue angosta sobre un fondo de montantes
  spacing: 8 px de base; aire de 16–18 px en los bordes; safe-area en el pie
  radius: 0
  shadows: desplazamiento duro 4 px, sin blur
  imagery: ninguna ilustración de stock; el video de la cámara es la imagen
  icons: esquinas del visor y perforación del tiquete, no un set genérico
  motion: el botón de escanear se hunde al pulsar; sin animación decorativa
  density: táctil, cómoda, campos a 16 px para que iOS no haga zoom
```

## Qué hace único este diseño

Sin el nombre, se reconoce por el tiquete perforado, el sello de categoría girado y el único bloque amarillo que pide la cámara trasera. No es un dashboard de tres columnas ni una landing.

## Evaluación

```yaml
evaluation:
  UX_quality: 8
  visual_identity: 8
  originality: 8
  hierarchy: 8
  responsiveness: 9
  accessibility: 8
  product_fit: 9
```

Originalidad por encima de 7 y encaje por encima de 8. La pregunta del logo se responde que no: la perforación, el visor y el amarillo único no sirven para otro producto genérico.

## Implementación

La interfaz de `src/ui` y `src/styles.css` usa estos tokens. El amarillo no se reutiliza en guardar ni en exportar.
