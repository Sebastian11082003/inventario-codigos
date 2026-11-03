# inventario-web

## Responsabilidad

Dueño de la lista de productos y de las categorías en el teléfono, y del archivo Excel que se descarga.

## Ubicación

| Campo | Valor |
|---|---|
| Número en el catálogo | 01 |
| Puerto local | 5173 con `npm run dev` |
| Repositorio | `Sebastian11082003/inventario-codigos` |
| Motor de datos | IndexedDB. No hay base propia de servidor |
| Comunica con | La cámara del teléfono. Nadie más |
| Consumido por | El operador. El POS solo recibe el archivo |

## Lo que sí hace

- Pide la cámara trasera y decodifica el código en el aparato.
- Valida la ficha, guarda, edita y exporta.

## Fuera de alcance

- Importar el archivo al POS.
- Cuentas, red y hardware de escaneo.

## Cómo ejecutarlo

```bash
npm ci
npm run dev
```

## Dependencias

Vite, ZXing (`@zxing/browser` y `@zxing/library`) y `fflate`. No hay servicio externo en runtime.
