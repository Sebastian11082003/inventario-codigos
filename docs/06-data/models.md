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
| quantity | number | Mayor o igual a 0 |
| unit | string | Lista cerrada |
| price | number o null | Null si el operador no escribió precio |
| notes | string | Puede ir vacía |
| updatedAt | string | ISO-8601 |

## categories

Clave `id`. Campos `id` y `name`.

Semilla: `cat-abarrotes`, `cat-bebidas`, `cat-limpieza`, `cat-otros`.

No hay migraciones de servidor. Subir `DB_VERSION` sería la migración, y todavía no hace falta: la versión es 1.
