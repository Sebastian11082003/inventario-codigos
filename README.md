# Inventario de códigos

Aplicación web, en español, para escanear códigos de barras con la **cámara trasera del teléfono**, clasificar los productos y exportarlos a Excel. El archivo sirve para importarlos después en un punto de venta.

No hay servidor ni servicio de pago. Los datos quedan en el navegador (IndexedDB).

## Cómo ejecutarla

Requiere Node.js 20 o superior.

```bash
npm ci
npm test
npm run dev
```

Abre `http://localhost:5173`. En el computador, `localhost` es un contexto seguro y el navegador puede pedir la cámara. En el teléfono no uses la IP de la red (`http://192.168…`): ahí la cámara está bloqueada. Para el teléfono publica la app por HTTPS con uno de los pasos de abajo y ábrela desde ese enlace.

Otros comandos: `npm run build` genera `dist/`. `npm run preview` sirve esa carpeta.

## Uso en el teléfono

1. Abre la URL `https://` en Chrome o Safari.
2. Pulsa **Escanear con la cámara**. Ese es el flujo principal. La app llama a `getUserMedia` con `facingMode: "environment"` (cámara trasera).
3. Cuando el navegador pregunte, permite la cámara.
4. Apunta al código. Cuando lo lea, pulsa **Usar este código**, completa la ficha y guarda.
5. **Escribir código** solo es el respaldo si la cámara falla, no hay permiso o la página no es segura.
6. Ajusta cantidades o fichas en la lista y pulsa **Exportar Excel**.

Si el permiso quedó bloqueado: en Chrome, el candado de la barra → Permisos → Cámara → Permitir. En Safari, el icono de cámara en la barra o Ajustes → Safari → Cámara. Luego **Reintentar cámara**.

## Contrato Excel

Hoja `inventario`. La primera fila está congelada. El orden de columnas es fijo:

| Columna | Contenido |
|---|---|
| Código | Texto del código escaneado o escrito, para no perder ceros a la izquierda |
| Nombre | El nombre que escribió el operador |
| Categoría | Nombre visible de la categoría, no el id interno |
| Cantidad | Número mayor o igual a 0. Acepta decimales |
| Unidad | `cantidad`, `kg` o `g` |
| Precio | Precio unitario. Celda vacía si no se indicó |
| Notas | Texto libre. Puede ir vacío |

El archivo se llama `inventario-codigos-AAAA-MM-DD.xlsx` y va ordenado por nombre. En pantalla, la lista muestra primero lo que se editó más reciente para poder corregirlo antes de exportar.

Categorías iniciales: Abarrotes, Bebidas, Limpieza, Otros. Se pueden crear, renombrar y borrar si no tienen productos.

Formatos que el lector intenta reconocer: EAN-13, EAN-8, UPC-A, Code 128, Code 39 y QR. Un QR se guarda como texto. La app no abre el enlace.

## Publicar gratis por HTTPS

La cámara del teléfono exige HTTPS (o `localhost` en esa misma máquina). Las dos opciones cuestan $0 y no piden tarjeta.

### GitHub Pages (repositorio público)

En un repositorio privado, Pages no entra en el plan gratuito. Si este repo es privado, usa Cloudflare Pages.

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions → Inventario en GitHub Pages → Run workflow**.
3. Al terminar, abre `https://sebastian11082003.github.io/inventario-codigos/` en el teléfono y permite la cámara.
4. Abre esa URL en el teléfono y permite la cámara.

El workflow construye con la base `/{nombre-del-repo}/` y no corre solo en cada push: hay que lanzarlo. No crea servidores de pago.

### Cloudflare Pages (plan Free)

Sirve también si el repositorio es privado. El plan Free de Pages no pide tarjeta.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Elige este repositorio y la rama `main`.
3. Root directory: la raíz del repositorio.
4. Build command: `npm ci && npm run build`.
5. Build output directory: `dist`.
6. No agregues variables de pago ni un backend. La base de Vite ya es `/`.
7. Despliega. Abre la URL `https://….pages.dev` en el teléfono y permite la cámara.

## Límites conocidos

- El flujo principal es la cámara trasera del teléfono. No hay modo de lector de hardware ni un camino pensado para la webcam de escritorio.
- Si el aparato solo tiene una cámara, el navegador puede usar esa. La petición sigue siendo `facingMode: "environment"`.
- Las pruebas automáticas cubren categorías, la forma de los datos, las columnas Excel y el contrato de la cámara. No abren una cámara real.
- Borrar los datos del sitio borra el inventario. No hay copia en la nube.
- Quien tenga el teléfono puede ver y exportar la lista. No hay cuentas de usuario.

## Documentación del proyecto

El SDD está en [docs/README.md](docs/README.md). Este repositorio es solo la app. El OS de ingeniería queda en [ai-engineering-os](https://github.com/Sebastian11082003/ai-engineering-os) y no se mezcla con este código.
