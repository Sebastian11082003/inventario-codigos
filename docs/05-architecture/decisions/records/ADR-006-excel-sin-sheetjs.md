# ADR-006 — Excel sin la librería SheetJS

- **ID:** ADR-006
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** entrega de este incremento

## Contexto

El POS necesita un `.xlsx` real. La librería `xlsx` de npm arrastra avisos de prototype pollution y ReDoS, y viajaría dentro del sitio que abre el teléfono.

**Origen:** HU-06 y la revisión de seguridad del incremento (riesgo medio si el paquete se sirve al cliente).

## Decisión

**Decidimos:** armar el xlsx en `src/export/xlsx.ts` (XML de Office Open XML comprimido con `fflate`). El código se escribe como texto. El precio vacío queda como celda de texto vacía. La hoja se llama `inventario`. La primera fila es `Código`, `Nombre`, `Categoría`, `Cantidad`, `Unidad`, `Precio`, `Notas`. La unidad de la celda es `cantidad`, `kg` o `g`.

**Justificación:** el archivo que generamos es nuestro. No hace falta un parser de hojas arbitrarias. Se evita publicar en el teléfono una librería con avisos altos.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| SheetJS `xlsx` | Avisos altos en el artefacto del cliente |
| CSV | El pedido pide Excel y el POS mapea columnas de un libro |

## Consecuencias

El escritor cubre esta hoja y estas siete columnas. No es un Excel genérico. La prueba abre el zip y lee la primera fila.
