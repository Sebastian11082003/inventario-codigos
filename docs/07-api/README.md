# 07 — Contrato de integración

No hay API HTTP. No se escribe OpenAPI: no existe un endpoint que implementar antes que el código. El POS no llama a esta app. El contrato es el archivo Excel que el operador descarga.

## Hoja `inventario`

Primera fila congelada, en español y en este orden:

`Código`, `Nombre`, `Categoría`, `Cantidad`, `Unidad`, `Precio`, `Notas`, `Alerta`

| Columna | Tipo de celda | Notas para mapear en el POS |
|---|---|---|
| Código | Texto | El código que el operador escaneó o escribió. Conserva ceros a la izquierda |
| Nombre | Texto | El nombre que el operador escribió |
| Categoría | Texto | Nombre visible, no el id |
| Cantidad | Número | Entero o decimal. `0,5` kg y `250` g son válidos. Un decimal en cantidad no se rechaza |
| Unidad | Texto | Exactamente `cantidad`, `kg` o `g`. En pantalla, `g` se lee «Gramos» |
| Precio | Número o vacío | Vacío significa “sin precio”, no cero. Sigue después de las cinco columnas de la ficha |
| Notas | Texto | Puede ir vacía |
| Alerta | Texto o vacío | `Sin existencias` solo si Cantidad es 0. No se guarda en el teléfono: se calcula al armar el archivo. Vacía si hay existencias |

El estante en pantalla no es el archivo: en pantalla manda la última edición. El archivo sale ordenado por nombre.

Origen: HU-06 y NFR-07. Dueño: el módulo `inventario-web`.
