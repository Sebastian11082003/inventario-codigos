# Alcance

## Dentro

- Escanear EAN-13, EAN-8, UPC-A, Code 128, Code 39 y QR con la cámara trasera.
- Escribir el código a mano solo como respaldo.
- Ficha: código, nombre, categoría, cantidad, unidad, precio opcional y notas.
- Crear, renombrar, asignar y borrar categorías vacías. Semilla: Abarrotes, Bebidas, Limpieza, Otros.
- Guardar la sesión en el navegador y editarla antes de exportar.
- Exportar `.xlsx` con el contrato de [07-api](../07-api/README.md).
- Publicar como sitio estático HTTPS de costo $0.

## Fuera

- Backend, cuentas, multiusuario y sincronización entre teléfonos.
- Importación directa a un POS concreto. El Excel es el puente.
- Lector de código de hardware, pistola USB o modo “solo webcam de escritorio”.
- Abrir la URL que venga dentro de un QR.
- Servicios de pago o planes que pidan tarjeta.

## Actores

- **Operador de inventario:** la persona en el pasillo, con el teléfono.
- **Punto de venta:** sistema externo que más tarde importa el archivo. No habla con esta app.
