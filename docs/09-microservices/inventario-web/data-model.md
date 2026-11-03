# Modelo del módulo

El módulo es dueño de las dos colecciones descritas en [models.md](../../06-data/models.md). No comparte la base con otro módulo.

`price: null` es parte del contrato de almacenamiento. No se rellena con 0 al leer.

`unit` ausente tampoco borra el producto: al leer se guarda en memoria como `cantidad`. `kg` y `g` se conservan. No hay otra colección ni otro objeto de producto. La columna `Alerta` del Excel no se almacena: se calcula cuando `quantity` es 0.
