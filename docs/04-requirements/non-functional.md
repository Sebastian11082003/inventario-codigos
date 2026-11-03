# Requisitos no funcionales

| ID | Requisito | Medida |
|---|---|---|
| NFR-01 | Usable en el teléfono | El flujo principal cabe y se opera desde 360 px de ancho. Controles de al menos 48 px |
| NFR-02 | Cámara trasera | La única llamada de captura usa `facingMode: "environment"` y `audio: false` |
| NFR-03 | Contexto seguro | Sin `window.isSecureContext` no se llama a la cámara y se explica que hace falta HTTPS o localhost |
| NFR-04 | Sin red para trabajar | Después de cargar la app, guardar y exportar no llaman a un API |
| NFR-05 | Costo | El despliegue documentado es $0 y no pide tarjeta |
| NFR-06 | Idioma | Textos de interfaz y de error en español |
| NFR-07 | Contrato estable | La primera fila del xlsx es exactamente `Código`, `Nombre`, `Categoría`, `Cantidad`, `Unidad`, `Precio`, `Notas`, `Alerta`. La celda de unidad es `cantidad`, `kg` o `g`. `Alerta` dice `Sin existencias` solo si la cantidad es 0 |
| NFR-08 | Datos en el aparato | No se envían productos, códigos ni imagen de la cámara a un servidor |

Seguridad de este incremento: riesgo bajo. No hay cuentas, secretos ni datos de otro usuario. La entrada de la ficha se valida antes de guardarla. Un QR no se ejecuta ni se navega. Evidencia: pruebas de validación y de `acceptScannedCode`.
