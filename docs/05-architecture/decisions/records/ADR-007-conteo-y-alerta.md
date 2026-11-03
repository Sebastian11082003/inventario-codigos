# ADR-007 — Conteo sobre el inventario del teléfono y alerta de cero

- **ID:** ADR-007
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** Sebastian Osorio (restricción), entrega de este incremento

## Contexto

El primer inventario ya guarda nombre, categoría y cantidad. El siguiente pase por el pasillo tiene que contrastar con eso, no crear otra ficha. Un lector de mostrador (y las apps de escaneo que se tomaron como referencia de gesto) enseña el producto en cuanto lee el código y deja seguir con el siguiente. Esas apps completan el nombre con un catálogo de internet. Aquí el catálogo es el inventario de este teléfono.

El botón − de la lista no puede dejar la cantidad en 0 por un toque de más. Cero solo vale cuando el operador anota que el estante está vacío. Ese cero tiene que verse en el Excel.

**Origen:** HU-08, HU-06, NFR-04, NFR-07. Amplía la fila de columnas de ADR-006.

## Decisión

**Decidimos:**

- Si el código ya está, la hoja del visor muestra el nombre, la categoría y la cantidad guardada, y pide el conteo de ahora. Guardar actualiza solo la cantidad y la cámara sigue abierta.
- Si el código es nuevo, no se inventa un nombre ni se consulta internet. Se abre el camino para completar la ficha.
- La ventana del visor es apaisada y la línea papaya es una guía. La lectura sigue siendo el fotograma completo (ADR-003).
- `−` y `+` no pueden dejar la cantidad en 0 ni por debajo. El 0 se escribe en el conteo o en la ficha.
- La columna `Alerta` va al final. Si la cantidad es 0, la celda dice `Sin existencias`. Si no, va vacía. No se guarda en IndexedDB: se calcula al exportar.

**Justificación:** el trabajo del pasillo es apuntar, ver qué había y anotar lo que hay. Buscar el nombre en internet rompería la regla de no usar red y pondría en el Excel un nombre que el operador no escribió. El cero accidental y el cero contado no pueden ser el mismo gesto.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| Cada lectura del mismo código suma 1 | Sirve para ir tomando unidades, y no para contrastar un estante ya contado |
| Ocultar la cantidad anterior (conteo ciego) | El pedido pide ver cuántos había |
| Catálogo externo de códigos | Viola NFR-04 y ADR-002. El nombre lo pone el operador |
| Dejar que − llegue a 0 | Un toque de más borra existencias sin ser un conteo |

## Consecuencias

ADR-006 sigue armando el xlsx sin SheetJS. La primera fila pasa a ocho columnas. El POS que ya mapeaba las siete primeras no cambia de orden; `Alerta` es nueva, al final.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El operador espera el nombre de Coca-Cola solo por el código, como en las apps de la tienda | Media | Medio | La hoja dice que el nombre no se busca en internet |
| El POS no tiene columna Alerta | Media | Bajo | Va al final y puede ignorarse. El texto solo aparece en cero |
