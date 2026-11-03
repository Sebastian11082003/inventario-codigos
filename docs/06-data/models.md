# Modelo

Base: `inventario-codigos`, versión 1. Ver [ADR-004](../05-architecture/decisions/records/ADR-004-indexeddb.md).

## products

Clave `id`. Índice único `barcode`.

| Campo | Tipo | Regla |
|---|---|---|
| id | string | UUID |
| barcode | string | Único |
| name | string | Obligatorio |
| categoryId | string | Apunta a `categories.id` |
| quantity | number | Mayor o igual a 0. Hasta 3 decimales, también si la unidad es cantidad |
| unit | string | `cantidad`, `kg` o `g`. Por defecto `cantidad`. Si el registro no trae `unit`, viene vacío o trae `und`, se lee como `cantidad`. `gramos` se lee como `g` |
| price | number o null | Null si el operador no escribió precio |
| notes | string | Puede ir vacía |
| updatedAt | string | ISO-8601 |

`Alerta` no es un campo. Si `quantity` es 0, el Excel escribe `Sin existencias` en esa columna. El botón − no escribe 0: solo el conteo o la ficha.

## categories

Clave `id`. Campos `id` y `name`.

Semilla: `cat-abarrotes`, `cat-bebidas`, `cat-limpieza`, `cat-otros`.

No hay migraciones de servidor. Subir `DB_VERSION` sería la migración, y todavía no hace falta: la versión es 1. La unidad nueva cabe en el mismo campo `unit`. Un producto guardado antes, sin ese campo, se completa al leer.
