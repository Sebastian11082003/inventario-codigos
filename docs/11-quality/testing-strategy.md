# Estrategia de pruebas

| Riesgo | Prueba | Dónde |
|---|---|---|
| Categoría duplicada, semilla, borrado con productos | Unitaria | `tests/categories.test.ts` |
| Ficha inválida, precio vacío, QR como texto | Unitaria | `tests/products.test.ts` |
| Columnas, orden, código con ceros, hoja `inventario` | Unitaria sobre el xlsx | `tests/excel.test.ts` |
| Forma IndexedDB y precio nulo | Unitaria con `fake-indexeddb` | `tests/persistence.test.ts` |
| `facingMode: "environment"`, sin audio, errores de cámara, mostrar Flash solo si hay `torch` | Unitaria del contrato | `tests/camera.test.ts` |
| Lectura con una cámara física y la luz del flash | Manual en el teléfono | No automatizada. Ver riesgos |

Comando: `npm test` en la raíz de este repositorio.

No se agregó Cypress ni Playwright. El riesgo que queda es visual y de permiso de cámara, y el entorno de CI no tiene una cámara trasera. Inventar un E2E que simule `getUserMedia` no demuestra el teléfono.

Los avisos de `npm audit` que quedan están en Vitest y solo en dependencias de desarrollo. No viajan en `dist/`. No se fuerza `npm audit fix --force`. Está anotado en riesgos.

Criterios de HU-01 a HU-07: los de reglas quedan cubiertos por la tabla de trazabilidad. HU-01 y HU-07, en la parte de “el teléfono muestra la imagen”, quedan en verificación manual.
