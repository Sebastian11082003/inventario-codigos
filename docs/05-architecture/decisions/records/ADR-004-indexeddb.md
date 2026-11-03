# ADR-004 — IndexedDB en el teléfono

- **ID:** ADR-004
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** entrega de este incremento

## Contexto

Refrescar no puede borrar el estante. No hay backend.

**Origen:** HU-05 y el modelo en `06-data`.

## Decisión

**Decidimos:** base `inventario-codigos`, versión 1, almacenes `products` (clave `id`, índice único `barcode`) y `categories` (clave `id`). Si no hay categorías, se siembran las cuatro por defecto.

**Justificación:** IndexedDB sobrevive al refresco y cabe en el navegador del teléfono. `localStorage` se queda corto para la lista y no tiene índice.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| localStorage | Sin índice y con techo de tamaño más bajo |
| Archivo que el usuario reimporta cada vez | Pierde la sesión que el pedido quiere conservar |

## Consecuencias

Los datos son de un solo origen (este sitio en este navegador). El precio nulo se guarda como `null`, no como `0`.
