# Matriz de trazabilidad

| Historia | Origen | Regla | ADR | Prueba |
|---|---|---|---|---|
| HU-01 | 01 overview, 03 visión | Código leído | ADR-003 | `tests/camera.test.ts`, `tests/products.test.ts` |
| HU-02 | 01 alcance | Código vacío | ADR-003 | `tests/products.test.ts` |
| HU-03 | 03 visión | Producto | ADR-002 | `tests/products.test.ts` |
| HU-04 | 01 alcance | Categoría | ADR-004 | `tests/categories.test.ts` |
| HU-05 | NFR-08 | Persistencia | ADR-004 | `tests/persistence.test.ts` |
| HU-06 | NFR-07 | Excel | ADR-006 | `tests/excel.test.ts` |
| HU-07 | NFR-02, NFR-03 | Cámara | ADR-003, ADR-005 | `tests/camera.test.ts` |

La cámara física no tiene prueba automática. Ese hueco está en [risks.md](../15-project-control/risks.md), no se marca como cubierto.
