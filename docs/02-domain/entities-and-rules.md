# Entidades y reglas

## Producto

- Código obligatorio, sin caracteres de control, hasta 500 caracteres. Se recortan solo los extremos.
- Nombre obligatorio, hasta 120 caracteres.
- Categoría obligatoria y existente.
- Cantidad mayor o igual a 0, hasta 3 decimales. Se acepta coma o punto.
- Unidad de la lista cerrada: und, kg, g, L, ml, caja, paquete. Por defecto `und`.
- Precio vacío o número mayor o igual a 0 con hasta 2 decimales. Vacío no se guarda como 0.
- Notas hasta 500 caracteres.
- El código es único. Escanear uno que ya existe abre esa ficha. No se crea un duplicado.

## Categoría

- Semilla al primer uso: Abarrotes, Bebidas, Limpieza, Otros.
- Nombre obligatorio, hasta 40 caracteres, único sin distinguir mayúsculas ni acentos.
- No se borra si tiene productos ni si es la última.

## Código leído

- Un texto vacío no entra.
- Un QR con URL se acepta como texto. No hay acción de navegación.
