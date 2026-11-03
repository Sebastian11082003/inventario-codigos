# Eventos de dominio

No hay bus ni webhooks. Estos nombres describen lo que la interfaz ya hace, para no inventar un transporte.

| Evento | Cuándo | Efecto |
|---|---|---|
| Código confirmado | El operador acepta una lectura o un código escrito | Se abre la ficha nueva o la ya guardada |
| Producto guardado | La ficha pasa la validación | Queda en el estante y en IndexedDB |
| Cantidad ajustada | − o + en el estante | Se actualiza el mismo producto |
| Categoría cambiada | Alta, renombre o borrado válido | Los productos conservan el id y muestran el nombre nuevo |
| Inventario exportado | Hay al menos un producto | Se descarga el xlsx. El estante no se borra |
