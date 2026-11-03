# 07 — Contrato de integración

No hay API HTTP. No se escribe OpenAPI: no existe un endpoint que implementar antes que el código. El POS no llama a esta app. El contrato es el archivo Excel que el operador descarga.

## Hoja `inventario`

Primera fila congelada, en este orden:

`codigo_barras`, `nombre`, `categoria`, `cantidad`, `unidad`, `precio`, `notas`

| Columna | Tipo de celda | Notas para mapear en el POS |
|---|---|---|
| codigo_barras | Texto | Conserva ceros a la izquierda |
| nombre | Texto | |
| categoria | Texto | Nombre visible, no el id |
| cantidad | Número | |
| unidad | Texto | und, kg, g, L, ml, caja, paquete |
| precio | Número o vacío | Vacío significa “sin precio”, no cero |
| notas | Texto | Puede ir vacía |

El estante en pantalla no es el archivo: en pantalla manda la última edición. El archivo sale ordenado por nombre.

Origen: HU-06 y NFR-07. Dueño: el módulo `inventario-web`.
